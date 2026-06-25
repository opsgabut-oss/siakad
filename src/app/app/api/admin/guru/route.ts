import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const guru = await prisma.guru.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: [
        { noAbsen: 'asc' },
        { nama: 'asc' }
      ]
    });
    return NextResponse.json(guru);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data guru' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { nip, nik, nama, kontak, noAbsen, pangkat, golongan } = await request.json();

    if (!nip && !nik) {
      return NextResponse.json({ message: 'NIP atau NIK wajib diisi' }, { status: 400 });
    }

    if (nip && (nip.length !== 18 || isNaN(Number(nip)))) {
      return NextResponse.json({ message: 'NIP harus 18 digit angka' }, { status: 400 });
    }

    if (nik && (nik.length !== 16 || isNaN(Number(nik)))) {
      return NextResponse.json({ message: 'NIK harus 16 digit angka' }, { status: 400 });
    }

    if (!nama || !kontak) {
      return NextResponse.json({ message: 'Nama dan kontak wajib diisi' }, { status: 400 });
    }

    // Cek keunikan NIP jika disediakan
    if (nip) {
      const existingNip = await prisma.guru.findUnique({
        where: { nip }
      });
      if (existingNip) {
        return NextResponse.json({ message: 'Guru dengan NIP ini sudah terdaftar' }, { status: 400 });
      }
    }

    // Cek keunikan NIK jika disediakan
    if (nik) {
      const existingNik = await prisma.guru.findUnique({
        where: { nik }
      });
      if (existingNik) {
        return NextResponse.json({ message: 'Guru dengan NIK ini sudah terdaftar' }, { status: 400 });
      }
    }

    // Username otomatis menggunakan NIP (jika ada), jika tidak pakai NIK
    const username = nip || nik;

    // Hash password default 'guru123'
    const hashedPassword = await bcrypt.hash('guru123', 10);
    
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          role: Role.GURU,
        }
      });

      const newGuru = await tx.guru.create({
        data: {
          nip: nip || null,
          nik: nik || null,
          nama,
          kontak,
          userId: newUser.id,
          noAbsen: noAbsen ? parseInt(noAbsen, 10) : null,
          pangkat: pangkat || null,
          golongan: golongan || null
        }
      });

      return newGuru;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create Guru error:', error);
    return NextResponse.json({ message: 'Gagal menambahkan data guru' }, { status: 500 });
  }
}
