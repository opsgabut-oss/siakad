import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

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

    if (nip) {
      const existingNip = await prisma.guru.findFirst({
        where: {
          nip,
          NOT: { id }
        }
      });
      if (existingNip) {
        return NextResponse.json({ message: 'NIP sudah digunakan oleh guru lain' }, { status: 400 });
      }
    }

    if (nik) {
      const existingNik = await prisma.guru.findFirst({
        where: {
          nik,
          NOT: { id }
        }
      });
      if (existingNik) {
        return NextResponse.json({ message: 'NIK sudah digunakan oleh guru lain' }, { status: 400 });
      }
    }

    const updatedGuru = await prisma.guru.update({
      where: { id },
      data: { 
        nip: nip || null, 
        nik: nik || null, 
        nama, 
        kontak,
        noAbsen: noAbsen ? parseInt(noAbsen, 10) : null,
        pangkat: pangkat || null,
        golongan: golongan || null
      }
    });

    return NextResponse.json(updatedGuru);
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memperbarui data guru' }, { status: 500 });
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

    const guru = await prisma.guru.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!guru) {
      return NextResponse.json({ message: 'Data guru tidak ditemukan' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.guru.delete({ where: { id } });
      if (guru.userId) {
        await tx.user.delete({ where: { id: guru.userId } });
      }
    });

    return NextResponse.json({ message: 'Data guru berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus data guru' }, { status: 500 });
  }
}
