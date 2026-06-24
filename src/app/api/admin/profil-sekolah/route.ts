import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    let profil = await prisma.profilSekolah.findFirst();
    if (!profil) {
      // Buat profil default
      profil = await prisma.profilSekolah.create({
        data: {
          id: 'single-profile',
          pemerintah: 'Pemerintah Kabupaten Pati',
          dinas: 'Dinas Pendidikan dan Kebudayaan',
          namaSekolah: 'SD Negeri Wedusan',
          npsn: '20338123',
          alamat: 'Jl. Puncel - Ngablak KM. 05 Desa Wedusan, Kec. Dukuhseti, Kab. Pati (59158)',
          telepon: '081234567890',
          email: 'sdnwedusan@gmail.com',
          website: 'www.sdnwedusan.sch.id',
          logoPemdaUrl: null,
          logoSekolahUrl: null,
          namaKepsek: 'Sudarto, S.Pd',
          nipKepsek: '197408122005011002'
        }
      });
    }

    const activeTA = await prisma.tahunAjaran.findFirst({
      where: { aktif: true }
    });

    return NextResponse.json({
      ...profil,
      tahunAjaranAktif: activeTA ? activeTA.tahun : ''
    });
  } catch (error) {
    console.error('Fetch profil error:', error);
    return NextResponse.json({ message: 'Gagal memuat profil sekolah' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      pemerintah, 
      dinas, 
      namaSekolah, 
      npsn, 
      alamat, 
      telepon, 
      email, 
      website, 
      logoPemdaUrl,
      logoSekolahUrl,
      namaKepsek, 
      nipKepsek,
      tahunAjaranAktif 
    } = body;

    if (!pemerintah || !dinas || !namaSekolah || !alamat || !namaKepsek) {
      return NextResponse.json({ message: 'Kolom utama wajib diisi' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Profil Sekolah
      const profil = await tx.profilSekolah.upsert({
        where: { id: 'single-profile' },
        update: {
          pemerintah,
          dinas,
          namaSekolah,
          npsn,
          alamat,
          telepon,
          email,
          website,
          logoPemdaUrl,
          logoSekolahUrl,
          namaKepsek,
          nipKepsek
        },
        create: {
          id: 'single-profile',
          pemerintah,
          dinas,
          namaSekolah,
          npsn,
          alamat,
          telepon,
          email,
          website,
          logoPemdaUrl,
          logoSekolahUrl,
          namaKepsek,
          nipKepsek
        }
      });
 
      // 2. Sinkronisasi Data Guru/User Kepala Sekolah
      if (namaKepsek) {
        // Cari user dengan role KEPALA_SEKOLAH
        let kepsekUser = await tx.user.findFirst({
          where: { role: 'KEPALA_SEKOLAH' },
          include: { guru: true }
        });

        // Jika tidak ditemukan berdasarkan role, cari guru berdasarkan NIP (jika NIP disediakan)
        if (!kepsekUser && nipKepsek) {
          const existingGuruByNip = await tx.guru.findFirst({
            where: { nip: nipKepsek },
            include: { user: true }
          });
          
          if (existingGuruByNip) {
            if (existingGuruByNip.user) {
              kepsekUser = { ...existingGuruByNip.user, guru: existingGuruByNip } as any;
            } else {
              // Jika guru ada tapi belum punya user, buatkan user Kepsek dan hubungkan
              const hashedPassword = await bcrypt.hash('kepsek123', 10);
              const newUser = await tx.user.create({
                data: {
                  username: nipKepsek,
                  password: hashedPassword,
                  role: 'KEPALA_SEKOLAH'
                }
              });
              const updatedGuru = await tx.guru.update({
                where: { id: existingGuruByNip.id },
                data: {
                  nama: namaKepsek,
                  userId: newUser.id
                }
              });
              kepsekUser = { id: newUser.id, username: nipKepsek, role: 'KEPALA_SEKOLAH', guru: updatedGuru } as any;
            }
          }
        }

        if (kepsekUser) {
          // Update username user Kepsek (jika ada NIP baru)
          if (nipKepsek && kepsekUser.username !== nipKepsek) {
            const usernameCollision = await tx.user.findUnique({ where: { username: nipKepsek } });
            if (!usernameCollision) {
              await tx.user.update({
                where: { id: kepsekUser.id },
                data: { username: nipKepsek, role: 'KEPALA_SEKOLAH' }
              });
            }
          } else {
            await tx.user.update({
              where: { id: kepsekUser.id },
              data: { role: 'KEPALA_SEKOLAH' }
            });
          }

          if (kepsekUser.guru) {
            await tx.guru.update({
              where: { id: kepsekUser.guru.id },
              data: {
                nama: namaKepsek,
                nip: nipKepsek || null
              }
            });
          } else {
            await tx.guru.create({
              data: {
                nip: nipKepsek || null,
                nama: namaKepsek,
                kontak: '-',
                userId: kepsekUser.id
              }
            });
          }
        } else {
          // Buat baru jika belum ada
          const hashedPassword = await bcrypt.hash('kepsek123', 10);
          const targetUsername = nipKepsek || 'kepsek';
          const usernameCollision = await tx.user.findUnique({ where: { username: targetUsername } });
          const finalUsername = usernameCollision ? `kepsek_${Date.now()}` : targetUsername;

          const newUser = await tx.user.create({
            data: {
              username: finalUsername,
              password: hashedPassword,
              role: 'KEPALA_SEKOLAH'
            }
          });

          await tx.guru.create({
            data: {
              nip: nipKepsek || null,
              nama: namaKepsek,
              kontak: '-',
              userId: newUser.id
            }
          });
        }
      }

      // 2. Update Tahun Ajaran Aktif jika ada
      if (tahunAjaranAktif) {
        const trimmedTA = tahunAjaranAktif.trim();
        let ta = await tx.tahunAjaran.findFirst({
          where: { tahun: trimmedTA }
        });

        if (!ta) {
          ta = await tx.tahunAjaran.create({
            data: {
              tahun: trimmedTA,
              aktif: true
            }
          });
        }

        // Matikan keaktifan tahun ajaran lain
        await tx.tahunAjaran.updateMany({
          where: {
            NOT: { id: ta.id }
          },
          data: {
            aktif: false
          }
        });

        // Nyalakan keaktifan tahun ajaran target
        await tx.tahunAjaran.update({
          where: { id: ta.id },
          data: { aktif: true }
        });

        // Pindahkan semua kelas ke Tahun Ajaran yang baru aktif ini
        await tx.kelas.updateMany({
          data: {
            tahunAjaranId: ta.id
          }
        });
      }

      return profil;
    });

    const activeTA = await prisma.tahunAjaran.findFirst({
      where: { aktif: true }
    });

    return NextResponse.json({
      ...result,
      tahunAjaranAktif: activeTA ? activeTA.tahun : ''
    });
  } catch (error) {
    console.error('Update profil error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan profil sekolah' }, { status: 500 });
  }
}

