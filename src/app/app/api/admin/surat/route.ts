import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { JenisSurat } from '@prisma/client';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'KEPALA_SEKOLAH')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis'); // MASUK or KELUAR
    const kategori = searchParams.get('kategori'); // SURAT_MASUK, RAPOR, etc.
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (jenis === 'MASUK' || jenis === 'KELUAR') {
      whereClause.jenis = jenis;
    }

    if (kategori && kategori !== 'SEMUA') {
      whereClause.kategori = kategori;
    }

    if (search) {
      whereClause.OR = [
        { nomorSurat: { contains: search, mode: 'insensitive' } },
        { perihal: { contains: search, mode: 'insensitive' } },
        { pengirim: { contains: search, mode: 'insensitive' } },
        { penerima: { contains: search, mode: 'insensitive' } },
      ];
    }

    const surat = await prisma.arsipSurat.findMany({
      where: whereClause,
      orderBy: { tanggalSurat: 'desc' },
    });

    return NextResponse.json(surat);
  } catch (error) {
    console.error('Fetch surat error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data surat/dokumen' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const {
      nomorSurat,
      tanggalSurat,
      tanggalDiterima,
      pengirim,
      penerima,
      perihal,
      jenis,
      tautanBerkas,
      keterangan,
      kategori,
    } = await request.json();

    if (!tanggalSurat || !perihal) {
      return NextResponse.json({ message: 'Tanggal dan Perihal wajib diisi' }, { status: 400 });
    }

    // Default values for missing properties
    const finalPengirim = pengirim || '-';
    const finalPenerima = penerima || '-';
    const finalJenis = (jenis as JenisSurat) || JenisSurat.MASUK;
    const finalKategori = kategori || 'SURAT_MASUK';

    // Auto-generate nomorSurat if blank/null
    let finalNomorSurat = nomorSurat?.trim();
    if (!finalNomorSurat) {
      let isUnique = false;
      while (!isUnique) {
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        finalNomorSurat = `ARC-${todayStr}-${randomStr}`;

        const exists = await prisma.arsipSurat.findUnique({
          where: { nomorSurat: finalNomorSurat },
        });
        if (!exists) {
          isUnique = true;
        }
      }
    } else {
      // Check unique nomorSurat if manually supplied
      const existingSurat = await prisma.arsipSurat.findUnique({
        where: { nomorSurat: finalNomorSurat },
      });

      if (existingSurat) {
        return NextResponse.json({ message: 'Nomor surat/dokumen sudah terdaftar' }, { status: 400 });
      }
    }

    const newSurat = await prisma.arsipSurat.create({
      data: {
        nomorSurat: finalNomorSurat,
        tanggalSurat: new Date(tanggalSurat),
        tanggalDiterima: tanggalDiterima ? new Date(tanggalDiterima) : null,
        pengirim: finalPengirim,
        penerima: finalPenerima,
        perihal,
        jenis: finalJenis,
        tautanBerkas,
        keterangan,
        kategori: finalKategori,
      },
    });

    return NextResponse.json(newSurat, { status: 201 });
  } catch (error) {
    console.error('Create surat error:', error);
    return NextResponse.json({ message: 'Gagal mengarsipkan surat/dokumen' }, { status: 500 });
  }
}
