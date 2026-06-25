import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PresensiBoard from './PresensiBoard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function GuruAbsensiPage({ params, searchParams }: Props) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    redirect('/login');
  }

  const { kelasId } = await params;
  const resolvedSearchParams = await searchParams;
  const tanggalStr = resolvedSearchParams.date || new Date().toLocaleDateString('sv');

  // Ambil data kelas
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      tahunAjaran: true
    }
  });

  if (!kelas || !user.guru || kelas.waliKelasId !== user.guru.id) {
    redirect('/guru/dashboard');
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Tombol Kembali & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/guru/dashboard"
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-2xl transition-colors select-none cursor-pointer"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">{kelas.nama}</h1>
          <p className="text-xs text-slate-400">
            Tahun Ajaran: {kelas.tahunAjaran.tahun}
          </p>
        </div>
      </div>

      {/* Sheet Presensi Interaktif */}
      <PresensiBoard kelasId={kelasId} tanggalStr={tanggalStr} />
    </div>
  );
}
