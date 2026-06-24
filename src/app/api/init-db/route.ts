import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { Hari } from '@prisma/client';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ message: 'Silakan login terlebih dahulu' }, { status: 401 });
  }

  try {
    // 1. Dapatkan atau buat Tahun Ajaran aktif
    let tahunAjaran = await prisma.tahunAjaran.findFirst({
      where: { aktif: true }
    });

    if (!tahunAjaran) {
      tahunAjaran = await prisma.tahunAjaran.create({
        data: {
          tahun: '2025/2026',
          aktif: true
        }
      });
    }

    // 2. Dapatkan atau buat Kelas 1 sampai Kelas 6
    const kelasNames = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    const kelasMap: Record<string, any> = {};

    for (const name of kelasNames) {
      let kl = await prisma.kelas.findFirst({
        where: { nama: name, tahunAjaranId: tahunAjaran.id }
      });
      if (!kl) {
        kl = await prisma.kelas.create({
          data: { nama: name, tahunAjaranId: tahunAjaran.id }
        });
      }
      kelasMap[name] = kl;
    }

    // 3. Dapatkan atau buat 9 Mata Pelajaran
    const mapelData = [
      { kode: 'MTK', nama: 'Matematika' },
      { kode: 'IPAS', nama: 'Ilmu Pengetahuan Alam dan Sosial' },
      { kode: 'IND', nama: 'Bahasa Indonesia' },
      { kode: 'PP', nama: 'Pendidikan Pancasila' },
      { kode: 'PAI', nama: 'Pendidikan Agama Islam' },
      { kode: 'PJOK', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' },
      { kode: 'SRI', nama: 'Seni Rupa' },
      { kode: 'ING', nama: 'Bahasa Inggris' },
      { kode: 'JAWA', nama: 'Bahasa Jawa' }
    ];

    const mapelMap: Record<string, any> = {};
    for (const m of mapelData) {
      let mapel = await prisma.mataPelajaran.findUnique({
        where: { kode: m.kode }
      });
      if (!mapel) {
        mapel = await prisma.mataPelajaran.create({
          data: { nama: m.nama, kode: m.kode }
        });
      }
      mapelMap[m.kode] = mapel;
    }

    // 4. Cari atau hubungkan Guru Profile ke User
    let guru = await prisma.guru.findUnique({
      where: { userId: user.id }
    });

    if (!guru) {
      const isNip = user.username.match(/^\d+$/);
      guru = await prisma.guru.create({
        data: {
          nip: isNip ? user.username : '198309052021212004',
          nama: user.username === '198309052021212004' ? 'Widyaningsih, S.Pd. SD.' : 'Guru Pengajar',
          kontak: '08123456789',
          userId: user.id
        }
      });
    }

    // 5. Bersihkan jadwal lama guru ini untuk inisialisasi ulang yang bersih
    await prisma.jadwalPelajaran.deleteMany({
      where: { guruId: guru.id }
    });

    const createdJadwals = [];

    // Mengisi jadwal untuk semua kelas (1 s.d. 6) sesuai struktur Kurikulum Merdeka
    for (const kName of kelasNames) {
      const kl = kelasMap[kName];
      const isLowGrade = kName === 'Kelas 1' || kName === 'Kelas 2'; // Kelas 1 & 2 tidak ada IPAS

      // Matematika (MTK) - Kelas 1: 4 JP, Kelas 2-6: 5 JP
      const mtkJP = kName === 'Kelas 1' ? '07:30-09:50' : '07:30-10:25'; // 4 JP vs 5 JP
      const mtkSelesai = kName === 'Kelas 1' ? '09:50' : '10:25';
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['MTK'].id,
          guruId: guru.id,
          hari: Hari.SENIN,
          jamMulai: '07:30',
          jamSelesai: mtkSelesai
        }
      });
      createdJadwals.push(`${kName} - Matematika (${kName === 'Kelas 1' ? '4' : '5'} JP)`);

      // IPAS (Hanya Kelas 3 s.d. 6) - 5 JP
      if (!isLowGrade) {
        await prisma.jadwalPelajaran.create({
          data: {
            kelasId: kl.id,
            mataPelajaranId: mapelMap['IPAS'].id,
            guruId: guru.id,
            hari: Hari.SELASA,
            jamMulai: '07:30',
            jamSelesai: '10:25'
          }
        });
        createdJadwals.push(`${kName} - IPAS (5 JP)`);
      }

      // Bahasa Indonesia (IND) - Kelas 1 & 2: 7 JP, Kelas 3-6: 6 JP
      // Untuk Kelas 1-2 dipecah jadi 2 pertemuan: Selasa 2 JP (07:30-08:40), Rabu 5 JP (07:30-10:25)
      if (isLowGrade) {
        await prisma.jadwalPelajaran.create({
          data: {
            kelasId: kl.id,
            mataPelajaranId: mapelMap['IND'].id,
            guruId: guru.id,
            hari: Hari.SELASA,
            jamMulai: '07:30',
            jamSelesai: '08:40'
          }
        });
        await prisma.jadwalPelajaran.create({
          data: {
            kelasId: kl.id,
            mataPelajaranId: mapelMap['IND'].id,
            guruId: guru.id,
            hari: Hari.RABU,
            jamMulai: '07:30',
            jamSelesai: '10:25'
          }
        });
        createdJadwals.push(`${kName} - Bahasa Indonesia (7 JP - 2 Pertemuan)`);
      } else {
        await prisma.jadwalPelajaran.create({
          data: {
            kelasId: kl.id,
            mataPelajaranId: mapelMap['IND'].id,
            guruId: guru.id,
            hari: Hari.RABU,
            jamMulai: '07:30',
            jamSelesai: '11:00' // 6 JP
          }
        });
        createdJadwals.push(`${kName} - Bahasa Indonesia (6 JP)`);
      }

      // Pendidikan Pancasila (PP) - 4 JP
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['PP'].id,
          guruId: guru.id,
          hari: Hari.KAMIS,
          jamMulai: '07:30',
          jamSelesai: '09:50'
        }
      });
      createdJadwals.push(`${kName} - Pendidikan Pancasila (4 JP)`);

      // Pendidikan Agama Islam (PAI) - 3 JP
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['PAI'].id,
          guruId: guru.id,
          hari: Hari.JUMAT,
          jamMulai: '07:30',
          jamSelesai: '09:15'
        }
      });
      createdJadwals.push(`${kName} - Pendidikan Agama Islam (3 JP)`);

      // PJOK - 3 JP
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['PJOK'].id,
          guruId: guru.id,
          hari: Hari.JUMAT,
          jamMulai: '09:15',
          jamSelesai: '11:00'
        }
      });
      createdJadwals.push(`${kName} - PJOK (3 JP)`);

      // Seni Rupa (SRI) - 3 JP
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['SRI'].id,
          guruId: guru.id,
          hari: Hari.SABTU,
          jamMulai: '07:30',
          jamSelesai: '09:15'
        }
      });
      createdJadwals.push(`${kName} - Seni Rupa (3 JP)`);

      // Bahasa Inggris (ING) (Hanya Kelas 3 s.d. 6) - 2 JP
      if (!isLowGrade) {
        await prisma.jadwalPelajaran.create({
          data: {
            kelasId: kl.id,
            mataPelajaranId: mapelMap['ING'].id,
            guruId: guru.id,
            hari: Hari.SABTU,
            jamMulai: '09:15',
            jamSelesai: '10:25'
          }
        });
        createdJadwals.push(`${kName} - Bahasa Inggris (2 JP)`);
      }

      // Bahasa Jawa (JAWA) - 2 JP
      // Untuk Kelas 1-2, Bahasa Jawa dimajukan ke jam 09:15 karena tidak ada Bahasa Inggris
      const jawaMulai = isLowGrade ? '09:15' : '10:25';
      const jawaSelesai = isLowGrade ? '10:25' : '11:35';
      await prisma.jadwalPelajaran.create({
        data: {
          kelasId: kl.id,
          mataPelajaranId: mapelMap['JAWA'].id,
          guruId: guru.id,
          hari: Hari.SABTU,
          jamMulai: jawaMulai,
          jamSelesai: jawaSelesai
        }
      });
      createdJadwals.push(`${kName} - Bahasa Jawa (2 JP)`);
    }

    // 6. Buat data siswa tiruan untuk semua kelas (1 s.d. 6)
    const mockSiswa: Record<string, string[]> = {
      'Kelas 1': ['Alif Pratama', 'Bella Saputri', 'Candra Wijaya', 'Dina Lestari'],
      'Kelas 2': ['Eko Prasetyo', 'Fitriani', 'Galang Ramadhan', 'Hana Nabila'],
      'Kelas 3': ['Indra Lesmana', 'Jamilah', 'Kiki Amelia', 'Lutfi Hakim'],
      'Kelas 4': ['Ahmad Syarif', 'Siti Rahma', 'Budi Wijaya', 'Dinda Lestari'],
      'Kelas 5': ['Dian Permana', 'Eka Putri', 'Fajar Kurnia', 'Gita Ayu'],
      'Kelas 6': ['Muhammad Rizky', 'Nadia Safitri', 'Oki Setiawan', 'Putri Rahayu']
    };

    let totalSiswaCreated = 0;
    for (const [kName, siswaNames] of Object.entries(mockSiswa)) {
      const kl = kelasMap[kName];
      // Hapus siswa lama di kelas ini agar tidak menumpuk/duplikat
      await prisma.siswa.deleteMany({
        where: { kelasId: kl.id }
      });

      const dataSiswa = siswaNames.map((name, idx) => {
        const classDigit = kName.replace('Kelas ', '');
        return {
          nisn: `${classDigit}00${idx + 1}123456`,
          nama: name,
          kelasId: kl.id,
          kontakOrangTua: `08123456789${idx}`
        };
      });

      await prisma.siswa.createMany({
        data: dataSiswa
      });
      totalSiswaCreated += dataSiswa.length;
    }

    return NextResponse.json({
      success: true,
      message: `Inisialisasi database berhasil untuk Guru: ${guru.nama}.`,
      detail: {
        tahunAjaran: tahunAjaran.tahun,
        guru: guru.nama,
        totalKelas: kelasNames.length,
        totalMapel: mapelData.length,
        totalJadwalDibuat: createdJadwals.length,
        totalSiswaDibuat: totalSiswaCreated
      }
    });

  } catch (error: any) {
    console.error('Init DB error:', error);
    return NextResponse.json({ success: false, message: 'Gagal inisialisasi database', error: error.message }, { status: 500 });
  }
}
