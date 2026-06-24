import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { StatusAbsensi } from '@prisma/client';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    // Gunakan zona waktu Asia/Jakarta untuk mencocokkan tanggal hari ini
    const todayStr = new Intl.DateTimeFormat('sv', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const todayDate = new Date(todayStr);

    // Cek absensi hari ini
    const absensiToday = await prisma.absensiGuru.findFirst({
      where: {
        guruId: user.guru.id,
        tanggal: todayDate
      }
    });

    // Ambil riwayat absensi bulan ini
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const history = await prisma.absensiGuru.findMany({
      where: {
        guruId: user.guru.id,
        tanggal: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { tanggal: 'desc' }
    });

    const guru = await prisma.guru.findUnique({
      where: { id: user.guru.id },
      select: { tandaTangan: true }
    });

    return NextResponse.json({
      today: absensiToday,
      history,
      hasTandaTangan: !!guru?.tandaTangan
    });
  } catch (error) {
    console.error('Fetch absensi mandiri error:', error);
    return NextResponse.json({ message: 'Gagal memuat absensi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !user.guru) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const { status, tipe, keterangan } = await request.json();

    if (!status || !Object.values(StatusAbsensi).includes(status)) {
      return NextResponse.json({ message: 'Status absensi tidak valid' }, { status: 400 });
    }

    // Gunakan zona waktu Asia/Jakarta untuk tanggal hari ini
    const todayStr = new Intl.DateTimeFormat('sv', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const todayDate = new Date(todayStr);

    // Ambil tanda tangan dari data Guru
    const guru = await prisma.guru.findUnique({
      where: { id: user.guru.id },
      select: { tandaTangan: true }
    });

    // Jika guru memilih status HADIR, wajib mengunggah tanda tangan terlebih dahulu
    if (status === 'HADIR' && (!guru || !guru.tandaTangan)) {
      return NextResponse.json({ 
        message: 'Anda belum memiliki scan tanda tangan di profil. Silakan unggah tanda tangan Anda terlebih dahulu.' 
      }, { status: 400 });
    }

    const now = new Date();

    let record;

    if (status === 'HADIR') {
      if (tipe === 'PULANG') {
        // Absen Pulang
        record = await prisma.absensiGuru.upsert({
          where: {
            guruId_tanggal: {
              guruId: user.guru.id,
              tanggal: todayDate
            }
          },
          update: {
            status: 'HADIR',
            waktuPulang: now,
            ttdPulang: guru?.tandaTangan || null
          },
          create: {
            guruId: user.guru.id,
            tanggal: todayDate,
            status: 'HADIR',
            waktuPulang: now,
            ttdPulang: guru?.tandaTangan || null
          }
        });
      } else {
        // Absen Datang (Default)
        record = await prisma.absensiGuru.upsert({
          where: {
            guruId_tanggal: {
              guruId: user.guru.id,
              tanggal: todayDate
            }
          },
          update: {
            status: 'HADIR',
            waktuDatang: now,
            ttdDatang: guru?.tandaTangan || null
          },
          create: {
            guruId: user.guru.id,
            tanggal: todayDate,
            status: 'HADIR',
            waktuDatang: now,
            ttdDatang: guru?.tandaTangan || null
          }
        });
      }
    } else {
      // Sakit / Izin / Alpa - kosongkan waktu datang & pulang serta tanda tangan
      record = await prisma.absensiGuru.upsert({
        where: {
          guruId_tanggal: {
            guruId: user.guru.id,
            tanggal: todayDate
          }
        },
        update: {
          status,
          keterangan: keterangan || null,
          waktuDatang: null,
          waktuPulang: null,
          ttdDatang: null,
          ttdPulang: null
        },
        create: {
          guruId: user.guru.id,
          tanggal: todayDate,
          status,
          keterangan: keterangan || null,
          waktuDatang: null,
          waktuPulang: null,
          ttdDatang: null,
          ttdPulang: null
        }
      });
    }

    return NextResponse.json({
      message: 'Absensi mandiri berhasil disimpan',
      record
    });
  } catch (error) {
    console.error('Save absensi mandiri error:', error);
    return NextResponse.json({ message: 'Gagal merekam absensi' }, { status: 500 });
  }
}
