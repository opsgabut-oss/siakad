import { NextResponse } from 'next/server';
import { BUKU_PAKET_DATABASE } from '@/lib/bukuPaket';
import { prisma } from '@/lib/db';

export async function GET() {
  const summary: Record<string, any> = {};

  BUKU_PAKET_DATABASE.forEach((item) => {
    const key = `${item.kelas} - ${item.mapelKode}`;
    if (!summary[key]) {
      summary[key] = { ganjil: 0, genap: 0, other: 0, total: 0 };
    }
    const sem = item.semester.toLowerCase();
    if (sem.includes('ganjil') || sem.includes('1')) {
      summary[key].ganjil++;
    } else if (sem.includes('genap') || sem.includes('2')) {
      summary[key].genap++;
    } else {
      summary[key].other++;
    }
    summary[key].total++;
  });

  return NextResponse.json({
    summary,
    totalChapters: BUKU_PAKET_DATABASE.length
  });
}
