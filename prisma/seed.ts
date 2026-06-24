import { PrismaClient, Role, Hari } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.nilai.deleteMany();
  await prisma.jadwalPelajaran.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.guru.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.tahunAjaran.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Hash passwords
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordGuru = await bcrypt.hash('guru123', 10);
  const passwordSiswa = await bcrypt.hash('siswa123', 10);
  const passwordOrtu = await bcrypt.hash('ortu123', 10);
  const passwordBK = await bcrypt.hash('bk123', 10);
  const passwordKepsek = await bcrypt.hash('kepsek123', 10);

  // 1. Create Admin TU User
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordAdmin,
      role: Role.ADMIN,
    },
  });
  console.log('Created Admin TU User:', adminUser.username);

  // Create BK User
  const bkUser = await prisma.user.create({
    data: {
      username: 'guru.bk',
      password: passwordBK,
      role: Role.GURU_BK,
    },
  });
  console.log('Created BK User:', bkUser.username);

  // Create Kepsek User
  const kepsekUser = await prisma.user.create({
    data: {
      username: 'kepsek',
      password: passwordKepsek,
      role: Role.KEPALA_SEKOLAH,
    },
  });
  console.log('Created Kepsek User:', kepsekUser.username);

  // 2. Create Tahun Ajaran
  const tahunAjaran = await prisma.tahunAjaran.create({
    data: {
      tahun: '2025/2026',
      aktif: true,
    },
  });
  console.log('Created Tahun Ajaran:', tahunAjaran.tahun);

  // 3. Create Guru Users and Guru Profiles (Seeded first so we can assign Wali Kelas)
  const userGuru1 = await prisma.user.create({
    data: {
      username: '198503152010011002',
      password: passwordGuru,
      role: Role.GURU,
    },
  });

  const guru1 = await prisma.guru.create({
    data: {
      nip: '198503152010011002',
      nama: 'Budi Santoso, S.Pd.',
      kontak: '081234567890',
      userId: userGuru1.id,
    },
  });

  const userGuru2 = await prisma.user.create({
    data: {
      username: '198907242015022003',
      password: passwordGuru,
      role: Role.GURU,
    },
  });

  const guru2 = await prisma.guru.create({
    data: {
      nip: '198907242015022003',
      nama: 'Siti Aminah, M.Pd.',
      kontak: '089876543210',
      userId: userGuru2.id,
    },
  });

  // Staf Tata Usaha / Tenaga Kependidikan (tanpa NIP, pakai NIK)
  const userGuru3 = await prisma.user.create({
    data: {
      username: '3318121508890001',
      password: passwordGuru,
      role: Role.GURU,
    },
  });

  const guru3 = await prisma.guru.create({
    data: {
      nik: '3318121508890001',
      nama: 'Eko Prasetyo (TU)',
      kontak: '085333444555',
      userId: userGuru3.id,
    },
  });

  console.log('Created Guru/Staff profiles for:', guru1.nama, ',', guru2.nama, ', and', guru3.nama);

  // Seed sample AbsensiGuru (Kehadiran Mandiri Guru & Staf)
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  await prisma.absensiGuru.createMany({
    data: [
      { guruId: guru1.id, tanggal: yesterday, status: 'HADIR' },
      { guruId: guru1.id, tanggal: twoDaysAgo, status: 'HADIR' },
      { guruId: guru2.id, tanggal: yesterday, status: 'HADIR' },
      { guruId: guru2.id, tanggal: twoDaysAgo, status: 'SAKIT', keterangan: 'Sakit Demam' },
      { guruId: guru3.id, tanggal: yesterday, status: 'HADIR' },
      { guruId: guru3.id, tanggal: twoDaysAgo, status: 'IZIN', keterangan: 'Izin Pernikahan Saudara' },
    ]
  });

  // 4. Create Kelas (Kelas 1 - 6)
  const kelas1 = await prisma.kelas.create({
    data: { nama: 'Kelas 1', tahunAjaranId: tahunAjaran.id },
  });
  const kelas2 = await prisma.kelas.create({
    data: { nama: 'Kelas 2', tahunAjaranId: tahunAjaran.id },
  });
  const kelas3 = await prisma.kelas.create({
    data: { nama: 'Kelas 3', tahunAjaranId: tahunAjaran.id },
  });
  const kelas4 = await prisma.kelas.create({
    data: { nama: 'Kelas 4', tahunAjaranId: tahunAjaran.id },
  });
  const kelas5 = await prisma.kelas.create({
    data: { nama: 'Kelas 5', tahunAjaranId: tahunAjaran.id, waliKelasId: guru2.id },
  });
  const kelas6 = await prisma.kelas.create({
    data: { nama: 'Kelas 6', tahunAjaranId: tahunAjaran.id, waliKelasId: guru1.id },
  });
  console.log('Created SD Classes 1-6. Wali Kelas Kelas 6:', guru1.nama, ', Kelas 5:', guru2.nama);

  // 5. Create Siswa & Orang Tua Users
  const userSiswa1 = await prisma.user.create({
    data: {
      username: '1234567890',
      password: passwordSiswa,
      role: Role.SISWA,
    },
  });
  const userOrtu1 = await prisma.user.create({
    data: {
      username: 'ortu.1234567890',
      password: passwordOrtu,
      role: Role.ORANG_TUA,
    },
  });
  const siswa1 = await prisma.siswa.create({
    data: {
      nisn: '1234567890',
      nama: 'Rian Hidayat',
      kelasId: kelas6.id,
      kontakOrangTua: '085222333444',
      userId: userSiswa1.id,
      orangTuaUserId: userOrtu1.id,
      tanggalLahir: new Date('2014-05-15'), // Usia ~12 tahun
    },
  });

  const userSiswa2 = await prisma.user.create({
    data: {
      username: '0987654321',
      password: passwordSiswa,
      role: Role.SISWA,
    },
  });
  const userOrtu2 = await prisma.user.create({
    data: {
      username: 'ortu.0987654321',
      password: passwordOrtu,
      role: Role.ORANG_TUA,
    },
  });
  const siswa2 = await prisma.siswa.create({
    data: {
      nisn: '0987654321',
      nama: 'Laras Ati',
      kelasId: kelas6.id,
      kontakOrangTua: '081333444555',
      userId: userSiswa2.id,
      orangTuaUserId: userOrtu2.id,
      tanggalLahir: new Date('2014-09-20'), // Usia ~11.5 tahun
    },
  });

  const userSiswa3 = await prisma.user.create({
    data: {
      username: '1122334455',
      password: passwordSiswa,
      role: Role.SISWA,
    },
  });
  const userOrtu3 = await prisma.user.create({
    data: {
      username: 'ortu.1122334455',
      password: passwordOrtu,
      role: Role.ORANG_TUA,
    },
  });
  const siswa3 = await prisma.siswa.create({
    data: {
      nisn: '1122334455',
      nama: 'Dian Permana',
      kelasId: kelas5.id,
      kontakOrangTua: '087888999000',
      userId: userSiswa3.id,
      orangTuaUserId: userOrtu3.id,
      tanggalLahir: new Date('2015-02-10'), // Usia ~11 tahun
    },
  });
  console.log('Created Siswa & Orang Tua profiles for:', siswa1.nama, ',', siswa2.nama, ',', siswa3.nama);

  // 6. Create Mata Pelajaran (Mapel)
  const mapelPABP = await prisma.mataPelajaran.create({
    data: { nama: 'Pendidikan Agama Islam dan Budi Pekerti', kode: 'PAI' },
  });
  const mapelPP = await prisma.mataPelajaran.create({
    data: { nama: 'Pendidikan Pancasila', kode: 'PP' },
  });
  const mapelIND = await prisma.mataPelajaran.create({
    data: { nama: 'Bahasa Indonesia', kode: 'IND' },
  });
  const mapelMTK = await prisma.mataPelajaran.create({
    data: { nama: 'Matematika', kode: 'MTK' },
  });
  const mapelIPAS = await prisma.mataPelajaran.create({
    data: { nama: 'Ilmu Pengetahuan Alam dan Sosial', kode: 'IPAS' },
  });
  const mapelSB = await prisma.mataPelajaran.create({
    data: { nama: 'Seni Rupa', kode: 'SRI' },
  });
  const mapelPJOK = await prisma.mataPelajaran.create({
    data: { nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kode: 'PJOK' },
  });
  const mapelING = await prisma.mataPelajaran.create({
    data: { nama: 'Bahasa Inggris', kode: 'ING' },
  });
  const mapelBJAW = await prisma.mataPelajaran.create({
    data: { nama: 'Bahasa Jawa', kode: 'JAWA' },
  });
  const mapelCOD = await prisma.mataPelajaran.create({
    data: { nama: 'Koding & AI', kode: 'KAI' },
  });
  const mapelP5 = await prisma.mataPelajaran.create({
    data: { nama: 'Kokurikuler (P5)', kode: 'P5' },
  });
  console.log('Created Merdeka Curriculum subjects (with Coding & P5)');

  // 7. Create Jadwal Pelajaran (Kelas 6)
  await prisma.jadwalPelajaran.createMany({
    data: [
      {
        kelasId: kelas6.id,
        mataPelajaranId: mapelMTK.id,
        guruId: guru1.id,
        hari: Hari.SENIN,
        jamMulai: '07:30',
        jamSelesai: '09:00',
      },
      {
        kelasId: kelas6.id,
        mataPelajaranId: mapelIND.id,
        guruId: guru2.id,
        hari: Hari.SENIN,
        jamMulai: '09:00',
        jamSelesai: '10:30',
      },
      {
        kelasId: kelas6.id,
        mataPelajaranId: mapelIPAS.id,
        guruId: guru1.id,
        hari: Hari.SELASA,
        jamMulai: '07:30',
        jamSelesai: '09:00',
      },
      {
        kelasId: kelas6.id,
        mataPelajaranId: mapelING.id,
        guruId: guru2.id,
        hari: Hari.RABU,
        jamMulai: '07:30',
        jamSelesai: '09:00',
      },
    ],
  });
  console.log('Created Jadwal Pelajaran for Kelas 6');

  // 8. Create Nilai Rapor (Rian Hidayat & Laras Ati)
  await prisma.nilai.createMany({
    data: [
      {
        siswaId: siswa1.id,
        mataPelajaranId: mapelMTK.id,
        harian1: 85,
        harian2: 90,
        harian3: 88,
        harian4: 80,
        harian5: 85,
        harian6: 90,
        uts: 80,
        uas: 88,
        rapor: 85, // (avgHarian=86.3 + uts=80 + uas=88)/3 = 84.7 => 85
      },
      {
        siswaId: siswa1.id,
        mataPelajaranId: mapelIND.id,
        harian1: 90,
        harian2: 85,
        harian3: 88,
        uts: 85,
        uas: 90,
        rapor: 88,
      },
      {
        siswaId: siswa2.id,
        mataPelajaranId: mapelMTK.id,
        harian1: 75,
        harian2: 80,
        uts: 70,
        uas: 78,
        rapor: 75,
      }
    ],
  });
  console.log('Created sample Grades for Rian Hidayat');


  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
