import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { JenisSurat } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id } = await params;
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

        const exists = await prisma.arsipSurat.findFirst({
          where: {
            nomorSurat: finalNomorSurat,
            NOT: { id },
          },
        });
        if (!exists) {
          isUnique = true;
        }
      }
    } else {
      // Check unique nomorSurat if manually supplied (excluding current record)
      const existingSurat = await prisma.arsipSurat.findFirst({
        where: {
          nomorSurat: finalNomorSurat,
          NOT: { id },
        },
      });

      if (existingSurat) {
        return NextResponse.json({ message: 'Nomor surat/dokumen sudah digunakan oleh dokumen lain' }, { status: 400 });
      }
    }

    const updatedSurat = await prisma.arsipSurat.update({
      where: { id },
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

    return NextResponse.json(updatedSurat);
  } catch (error) {
    console.error('Update surat error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui data surat/dokumen' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.arsipSurat.delete({ where: { id } });
    return NextResponse.json({ message: 'Arsip surat/dokumen berhasil dihapus' });
  } catch (error) {
    console.error('Delete surat error:', error);
    return NextResponse.json({ message: 'Gagal menghapus arsip surat/dokumen' }, { status: 500 });
  }
}
