import { prisma } from '@/lib/db';
import Link from 'next/link';
import { 
  HeartHandshake, 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export const revalidate = 0; // Disable caching to ensure real-time data

export default async function BKDashboardPage() {
  const totalKasus = await prisma.catatanBK.count();
  const totalPelanggaran = await prisma.pelanggaranSiswa.count();
  const totalSiswa = await prisma.siswa.count();

  // Ambil siswa dengan akumulasi poin pelanggaran tertinggi
  const siswaList = await prisma.siswa.findMany({
    include: {
      kelas: true,
      pelanggaran: {
        select: { poin: true }
      }
    }
  });

  const siswaPoin = siswaList.map((s) => ({
    id: s.id,
    nama: s.nama,
    nisn: s.nisn,
    kelas: s.kelas.nama,
    totalPoin: s.pelanggaran.reduce((sum, p) => sum + p.poin, 0)
  }))
  .sort((a, b) => b.totalPoin - a.totalPoin)
  .filter((s) => s.totalPoin > 0)
  .slice(0, 5);

  // Ambil kasus BK terbaru
  const recentBK = await prisma.catatanBK.findMany({
    include: {
      siswa: {
        select: {
          nama: true,
          kelas: { select: { nama: true } }
        }
      }
    },
    orderBy: { tanggal: 'desc' },
    take: 3
  });

  // Ambil pelanggaran terbaru
  const recentPelanggaran = await prisma.pelanggaranSiswa.findMany({
    include: {
      siswa: {
        select: {
          nama: true,
          kelas: { select: { nama: true } }
        }
      }
    },
    orderBy: { tanggal: 'desc' },
    take: 3
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Bimbingan & Kedisiplinan</h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Pantau perkembangan konseling siswa, rekam poin kedisiplinan, dan evaluasi kelayakan kelulusan di sini.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Kasus Konseling */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-violet-500/10 blur-xl group-hover:bg-violet-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
              <HeartHandshake size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catatan BK</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalKasus} Kasus</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <Link href="/bk/kasus" className="text-xs text-violet-400 font-semibold hover:text-violet-300 flex items-center gap-1 select-none">
              Lihat Kasus <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card Pelanggaran */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pelanggaran</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalPelanggaran} Kejadian</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <Link href="/bk/pelanggaran" className="text-xs text-rose-400 font-semibold hover:text-rose-300 flex items-center gap-1 select-none">
              Catat Pelanggaran <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card Rasio Aktif */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa Terdaftar</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalSiswa} Siswa</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Bimbingan Aktif Terpusat</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daftar Poin Tertinggi */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Poin Pelanggaran Siswa Tertinggi
          </h2>
          {siswaPoin.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada catatan pelanggaran siswa hari ini.</p>
          ) : (
            <div className="space-y-4">
              {siswaPoin.map((s, index) => (
                <div key={s.id} className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex justify-between items-center transition-all hover:border-slate-750">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 font-black text-sm flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{s.nama}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">{s.kelas} • NISN: {s.nisn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-950/40 border border-rose-800/60 text-rose-400 px-3 py-1 rounded-full text-xs font-black">
                      {s.totalPoin} Poin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ringkasan Kejadian Terbaru */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="text-violet-400" size={20} />
            Catatan Terkini BK & Kedisiplinan
          </h2>
          <div className="space-y-4">
            {/* Kasus BK Terbaru */}
            {recentBK.map((r) => (
              <div key={r.id} className="border-l-2 border-violet-500 pl-4 py-1 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                  <span>{r.siswa.nama} ({r.siswa.kelas.nama})</span>
                  <span>{new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-350">{r.kategori}</h4>
                <p className="text-[11px] text-slate-400">Status: <span className="text-emerald-400 font-bold">{r.status}</span></p>
              </div>
            ))}

            {/* Pelanggaran Terbaru */}
            {recentPelanggaran.map((p) => (
              <div key={p.id} className="border-l-2 border-rose-500 pl-4 py-1 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                  <span>{p.siswa.nama} ({p.siswa.kelas.nama})</span>
                  <span>{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-350">{p.namaPelanggaran}</h4>
                <p className="text-[11px] text-slate-400">Poin: <span className="text-rose-400 font-bold">+{p.poin} Poin</span></p>
              </div>
            ))}

            {recentBK.length === 0 && recentPelanggaran.length === 0 && (
              <p className="text-xs text-slate-500">Belum ada riwayat aktivitas bimbingan baru-baru ini.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
