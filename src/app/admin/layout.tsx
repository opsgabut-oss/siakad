import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import Link from 'next/link';
import { Users, GraduationCap, LayoutDashboard, LogOut, ShieldAlert, BookOpen, Calendar, FileSpreadsheet, School, FolderOpen, Settings } from 'lucide-react';
import { prisma } from '@/lib/db';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Validasi peran admin di server side
  if (!user || user.role !== 'ADMIN') {
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
              <h2 className="font-extrabold text-white text-sm tracking-wide uppercase truncate max-w-[140px]" title={profil?.namaSekolah || 'SIAKAD ADMIN'}>
                {profil?.namaSekolah || 'SIAKAD ADMIN'}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Portal Admin</p>
            </div>
          </div>

          {/* Sesi User */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center gap-3 w-full overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 flex-none">
              TU
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping shrink-0" />
                Admin TU
              </p>
            </div>
          </div>

          {/* Menu Link */}
          <nav className="p-4 space-y-1.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              href="/admin/profil"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <Settings size={18} />
              Identitas Sekolah
            </Link>
            <Link
              href="/admin/kelas"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <School size={18} />
              Data Kelas
            </Link>
            <Link
              href="/admin/guru"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <Users size={18} />
              Data Guru
            </Link>
            <Link
              href="/admin/siswa"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <GraduationCap size={18} />
              Data Siswa
            </Link>
            <Link
              href="/admin/mapel"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <BookOpen size={18} />
              Mata Pelajaran
            </Link>
            <Link
              href="/admin/jadwal"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <Calendar size={18} />
              Jadwal Pelajaran
            </Link>
            <Link
              href="/admin/laporan"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <FileSpreadsheet size={18} />
              Laporan Absensi
            </Link>
            <Link
              href="/admin/kenaikan"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <GraduationCap size={18} className="text-violet-400" />
              Kenaikan & Kelulusan
            </Link>
            <Link
              href="/admin/surat"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <FolderOpen size={18} />
              Arsip Dokumen
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

// Client Component Logout Button
import ClientLogoutButton from './LogoutButton';
function LogoutButton() {
  return <ClientLogoutButton />;
}
