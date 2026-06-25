import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'KEPALA_SEKOLAH' && user.role !== 'ADMIN' && user.role !== 'GURU_BK')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mataPelajaranId = searchParams.get('mataPelajaranId');
    const semesterStr = searchParams.get('semester') || '1';
    const semester = parseInt(semesterStr, 10);

    if (!mataPelajaranId) {
      return NextResponse.json({ message: 'mataPelajaranId wajib disertakan' }, { status: 400 });
    }

    const tps = await prisma.tujuanPembelajaran.findMany({
      where: {
        mataPelajaranId,
        semester,
      },
      orderBy: { createdAt: 'asc' }
    });

    const promes = await prisma.promesMinggu.findMany({
      where: {
        tujuanPembelajaranId: { in: tps.map((tp) => tp.id) }
      }
    });

    return NextResponse.json({ tps, promes });
  } catch (error) {
    console.error('Fetch Promes error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data Promes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tujuanPembelajaranId, bulan, mingguKe, active } = body;

    if (!tujuanPembelajaranId || bulan === undefined || mingguKe === undefined || active === undefined) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const b = parseInt(bulan, 10);
    const m = parseInt(mingguKe, 10);

    if (active) {
      await prisma.promesMinggu.upsert({
        where: {
          tujuanPembelajaranId_bulan_mingguKe: {
            tujuanPembelajaranId,
            bulan: b,
            mingguKe: m,
          }
        },
        update: {},
        create: {
          tujuanPembelajaranId,
          bulan: b,
          mingguKe: m,
        }
      });
    } else {
      try {
        await prisma.promesMinggu.delete({
          where: {
            tujuanPembelajaranId_bulan_mingguKe: {
              tujuanPembelajaranId,
              bulan: b,
              mingguKe: m,
            }
          }
        });
      } catch (err) {
        // Abaikan jika data tidak ditemukan (sudah terhapus)
      }
    }

    return NextResponse.json({ message: 'Data Promes berhasil diperbarui' });
  } catch (error: any) {
    console.error('Save Promes error:', error);
    return NextResponse.json({ message: error.message || 'Gagal memperbarui data Promes' }, { status: 500 });
  }
}
