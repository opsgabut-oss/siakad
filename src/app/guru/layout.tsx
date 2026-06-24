import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import Link from 'next/link';
import { School, Calendar, GraduationCap, BookOpen, CalendarRange, FileText, CheckSquare } from 'lucide-react';
import { prisma } from '@/lib/db';
import LogoutButton from './LogoutButton';

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Validasi peran guru di server
  if (!user || user.role !== 'GURU') {
    redirect('/login');
  }

  const profil = await prisma.profilSekolah.findFirst();

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigasi */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            {profil?.logoSekolahUrl ? (
              <img src={profil.logoSekolahUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-950/20" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/10 shrink-0">
                SK
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-white text-sm tracking-wide uppercase truncate max-w-[140px]" title={profil?.namaSekolah || 'SIAKAD GURU'}>
                {profil?.namaSekolah || 'SIAKAD GURU'}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Panel Mengajar</p>
            </div>
          </div>

          {/* Sesi User */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center gap-3 w-full overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 flex-none">
              GR
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.guru?.nama || user.username}</p>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 truncate max-w-[140px]" title={user.guru?.nip || ''}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping shrink-0" />
                NIP: {user.guru?.nip || '-'}
              </p>
            </div>
          </div>

          {/* Menu Link */}
          <nav className="p-4 space-y-1">
            <Link
              href="/guru/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <School size={16} />
              Absensi Kelas
            </Link>
            <Link
              href="/guru/jadwal"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <Calendar size={16} />
              Jadwal Pelajaran
            </Link>
            <Link
              href="/guru/nilai"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <GraduationCap size={16} />
              Penilaian Siswa
            </Link>
            <div className="h-[1px] bg-slate-800/60 my-2" />
            
            <Link
              href="/guru/tujuan-pembelajaran?tab=prota"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <CheckSquare size={16} className="text-violet-400" />
              Prota (Program Tahunan)
            </Link>
            <Link
              href="/guru/promes"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <CalendarRange size={16} className="text-indigo-400" />
              Promes (Prog. Semester)
            </Link>
            <Link
              href="/guru/tujuan-pembelajaran?tab=tp"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <BookOpen size={16} className="text-teal-400" />
              CP / TP (Capaian & Tujuan)
            </Link>
            <Link
              href="/guru/tujuan-pembelajaran?tab=atp"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <CheckSquare size={16} className="text-amber-400" />
              ATP (Alur Tujuan)
            </Link>
            <Link
              href="/guru/tujuan-pembelajaran?tab=kktp"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <CheckSquare size={16} className="text-emerald-400" />
              Ketercapaian (KKTP)
            </Link>
            <Link
              href="/guru/modul-ajar"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <FileText size={16} className="text-pink-400" />
              Modul Ajar
            </Link>
            <Link
              href="/guru/jurnal"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <BookOpen size={16} />
              Jurnal Mengajar
            </Link>
          </nav>
        </div>

        {/* Action Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
