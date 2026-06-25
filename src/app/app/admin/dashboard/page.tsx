import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Users, GraduationCap, School, BookOpen, ChevronRight, Calendar } from 'lucide-react';

export const revalidate = 0; // Disable caching to ensure real-time data

export default async function AdminDashboardPage() {
  // Fetch stats directly in server component
  const guruCount = await prisma.guru.count();
  const siswaCount = await prisma.siswa.count();
  const kelasCount = await prisma.kelas.count();
  const activeYear = await prisma.tahunAjaran.findFirst({
    where: { aktif: true }
  });

  // Fetch overall student attendance stats
  const totalStudentAbsensi = await prisma.absensi.count();
  const studentHadir = await prisma.absensi.count({ where: { status: 'HADIR' } });
  const studentSakit = await prisma.absensi.count({ where: { status: 'SAKIT' } });
  const studentIzin = await prisma.absensi.count({ where: { status: 'IZIN' } });
  const studentAlpa = await prisma.absensi.count({ where: { status: 'ALPA' } });

  // Fetch overall teacher attendance stats
  const totalTeacherAbsensi = await prisma.absensiGuru.count();
  const teacherHadir = await prisma.absensiGuru.count({ where: { status: 'HADIR' } });
  const teacherSakit = await prisma.absensiGuru.count({ where: { status: 'SAKIT' } });
  const teacherIzin = await prisma.absensiGuru.count({ where: { status: 'IZIN' } });
  const teacherAlpa = await prisma.absensiGuru.count({ where: { status: 'ALPA' } });

  const studentHadirPct = totalStudentAbsensi > 0 ? Math.round((studentHadir / totalStudentAbsensi) * 100) : 0;
  const studentSakitPct = totalStudentAbsensi > 0 ? Math.round((studentSakit / totalStudentAbsensi) * 100) : 0;
  const studentIzinPct = totalStudentAbsensi > 0 ? Math.round((studentIzin / totalStudentAbsensi) * 100) : 0;
  const studentAlpaPct = totalStudentAbsensi > 0 ? Math.round((studentAlpa / totalStudentAbsensi) * 100) : 0;

  const teacherHadirPct = totalTeacherAbsensi > 0 ? Math.round((teacherHadir / totalTeacherAbsensi) * 100) : 0;
  const teacherSakitPct = totalTeacherAbsensi > 0 ? Math.round((teacherSakit / totalTeacherAbsensi) * 100) : 0;
  const teacherIzinPct = totalTeacherAbsensi > 0 ? Math.round((teacherIzin / totalTeacherAbsensi) * 100) : 0;
  const teacherAlpaPct = totalTeacherAbsensi > 0 ? Math.round((teacherAlpa / totalTeacherAbsensi) * 100) : 0;


  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Selamat Datang di SIAKAD</h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Kelola data guru, data siswa, dan pantau administrasi sekolah dengan mudah dari dashboard Tata Usaha.
        </p>
      </div>

      {/* Grid Status / Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Guru */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Guru</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{guruCount}</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <Link href="/admin/guru" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 select-none">
              Kelola Guru <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card Siswa */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-violet-500/10 blur-xl group-hover:bg-violet-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{siswaCount}</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <Link href="/admin/siswa" className="text-xs text-violet-400 font-semibold hover:text-violet-300 flex items-center gap-1 select-none">
              Kelola Siswa <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card Kelas */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700/50 group">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <School size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kelas</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{kelasCount}</h3>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Tahun Ajaran Aktif:</p>
            <span className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Calendar size={10} />
              {activeYear ? activeYear.tahun : 'Belum Ada'}
            </span>
          </div>
        </div>

      </div>

      {/* Diagram Presentasi Kehadiran Siswa & Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card Presentasi Siswa */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Presentasi Kehadiran Siswa</h2>
              <p className="text-xs text-slate-500">Distribusi statistik absensi harian siswa</p>
            </div>
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl text-slate-400 border border-slate-850">
              Total Catatan: {totalStudentAbsensi}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Big Circular Indicator */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-950/40 rounded-2xl border border-slate-850 col-span-1 text-center">
              <span className="text-4xl font-black text-indigo-400">{studentHadirPct}%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Rata-rata Hadir</span>
            </div>

            {/* Individual Progress Bars */}
            <div className="col-span-2 space-y-3">
              {/* Hadir */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir</span>
                  <span className="text-slate-200 font-bold">{studentHadir} ({studentHadirPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${studentHadirPct}%` }} />
                </div>
              </div>

              {/* Sakit */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Sakit</span>
                  <span className="text-slate-200 font-bold">{studentSakit} ({studentSakitPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${studentSakitPct}%` }} />
                </div>
              </div>

              {/* Izin */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Izin</span>
                  <span className="text-slate-200 font-bold">{studentIzin} ({studentIzinPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${studentIzinPct}%` }} />
                </div>
              </div>

              {/* Alpa */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Alpa</span>
                  <span className="text-slate-200 font-bold">{studentAlpa} ({studentAlpaPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${studentAlpaPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Presentasi Guru & Staf */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Presentasi Kehadiran Guru & Staf</h2>
              <p className="text-xs text-slate-500">Distribusi statistik absensi harian guru & staf</p>
            </div>
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl text-slate-400 border border-slate-850">
              Total Catatan: {totalTeacherAbsensi}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Big Circular Indicator */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-950/40 rounded-2xl border border-slate-850 col-span-1 text-center">
              <span className="text-4xl font-black text-violet-400">{teacherHadirPct}%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Rata-rata Hadir</span>
            </div>

            {/* Individual Progress Bars */}
            <div className="col-span-2 space-y-3">
              {/* Hadir */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir</span>
                  <span className="text-slate-200 font-bold">{teacherHadir} ({teacherHadirPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${teacherHadirPct}%` }} />
                </div>
              </div>

              {/* Sakit */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Sakit</span>
                  <span className="text-slate-200 font-bold">{teacherSakit} ({teacherSakitPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${teacherSakitPct}%` }} />
                </div>
              </div>

              {/* Izin */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Izin</span>
                  <span className="text-slate-200 font-bold">{teacherIzin} ({teacherIzinPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${teacherIzinPct}%` }} />
                </div>
              </div>

              {/* Alpa */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Alpa</span>
                  <span className="text-slate-200 font-bold">{teacherAlpa} ({teacherAlpaPct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${teacherAlpaPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

