import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { csvText } = await request.json();

    if (!csvText) {
      return NextResponse.json({ message: 'Data CSV kosong' }, { status: 400 });
    }

    // Split baris
    const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim() !== '');
    if (lines.length <= 1) {
      return NextResponse.json({ message: 'CSV tidak memiliki data baris' }, { status: 400 });
    }

    // Deteksi pembatas kolom secara dinamis (koma atau titik-koma)
    let delimiter = ',';
    if (lines[0].includes(';')) {
      delimiter = ';';
    }

    // Validasi Header (nisn, nama, kelas, kontak orang tua)
    const headers = lines[0].split(delimiter).map((h: string) => h.trim().toLowerCase());
    
    const nisnIdx = headers.indexOf('nisn');
    const namaIdx = headers.indexOf('nama');
    const kelasIdx = headers.indexOf('kelas');
    
    // Cari index kontak orang tua atau kontak
    let kontakIdx = headers.indexOf('kontak orang tua');
    if (kontakIdx === -1) kontakIdx = headers.indexOf('kontak');

    // Deteksi index no_absen (opsional)
    let noAbsenIdx = headers.indexOf('no absen');
    if (noAbsenIdx === -1) noAbsenIdx = headers.indexOf('no_absen');
    if (noAbsenIdx === -1) noAbsenIdx = headers.indexOf('absen');

    if (nisnIdx === -1 || namaIdx === -1 || kelasIdx === -1 || kontakIdx === -1) {
      return NextResponse.json({ 
        message: 'Format header salah. Pastikan terdapat kolom: nisn, nama, kelas, kontak orang tua' 
      }, { status: 400 });
    }

    // Ambil tahun ajaran aktif
    const activeTahunAjaran = await prisma.tahunAjaran.findFirst({
      where: { aktif: true }
    });

    if (!activeTahunAjaran) {
      return NextResponse.json({ message: 'Tahun ajaran aktif belum ditentukan. Buat dahulu tahun ajaran aktif!' }, { status: 400 });
    }

    // Cache kelas di memori
    const allClassMap = new Map<string, string>();
    const classes = await prisma.kelas.findMany({
      where: { tahunAjaranId: activeTahunAjaran.id }
    });
    classes.forEach(c => allClassMap.set(c.nama.toLowerCase().trim(), c.id));

    // Pre-hash passwords once to avoid high CPU usage during loop
    const studentPasswordHash = await bcrypt.hash('siswa123', 10);
    const parentPasswordHash = await bcrypt.hash('ortu123', 10);

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Olah data baris demi baris
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(delimiter).map((c: string) => c.trim().replace(/^["']|["']$/g, ''));
      
      const nisn = cells[nisnIdx];
      const nama = cells[namaIdx];
      const kelasNama = cells[kelasIdx];
      const kontak = cells[kontakIdx];

      const noAbsenRaw = noAbsenIdx !== -1 ? cells[noAbsenIdx] : '';
      const noAbsen = noAbsenRaw && !isNaN(Number(noAbsenRaw)) ? parseInt(noAbsenRaw, 10) : null;

      if (!nisn || !nama || !kelasNama || !kontak) {
        errors.push(`Baris ${i + 1}: Data tidak lengkap.`);
        skippedCount++;
        continue;
      }

      if (nisn.length !== 10 || isNaN(Number(nisn))) {
        errors.push(`Baris ${i + 1}: NISN (${nisn}) harus 10 digit angka.`);
        skippedCount++;
        continue;
      }

      try {
        // Cari kelas atau buat otomatis jika tidak ada
        let kelasId = allClassMap.get(kelasNama.toLowerCase());
        if (!kelasId) {
          const newKelas = await prisma.kelas.create({
            data: {
              nama: kelasNama,
              tahunAjaranId: activeTahunAjaran.id
            }
          });
          kelasId = newKelas.id;
          allClassMap.set(kelasNama.toLowerCase(), kelasId);
        }

        // Cek NISN unik
        const existingSiswa = await prisma.siswa.findUnique({
          where: { nisn }
        });

        if (existingSiswa) {
          errors.push(`Baris ${i + 1}: NISN (${nisn}) sudah terdaftar (Siswa: ${existingSiswa.nama}).`);
          skippedCount++;
          continue;
        }

        // Simpan siswa & User logins secara transaksional
        await prisma.$transaction(async (tx) => {
          // 1. Buat User Siswa
          const studentUser = await tx.user.create({
            data: {
              username: nisn,
              password: studentPasswordHash,
              role: 'SISWA'
            }
          });

          // 2. Buat User Orang Tua
          const parentUser = await tx.user.create({
            data: {
              username: `ortu.${nisn}`,
              password: parentPasswordHash,
              role: 'ORANG_TUA'
            }
          });

          // 3. Simpan data Siswa yang terhubung
          await tx.siswa.create({
            data: {
              nisn,
              nama,
              kelasId,
              kontakOrangTua: kontak,
              userId: studentUser.id,
              orangTuaUserId: parentUser.id,
              noAbsen: noAbsen
            }
          });
        });

        importedCount++;
      } catch (err) {
        errors.push(`Baris ${i + 1}: Gagal menyimpan ke database.`);
        skippedCount++;
      }
    }

    return NextResponse.json({
      message: 'Proses impor selesai',
      importedCount,
      skippedCount,
      errors
    });
  } catch (error) {
    console.error('Import CSV error:', error);
    return NextResponse.json({ message: 'Gagal mengimpor data siswa' }, { status: 500 });
  }
}
