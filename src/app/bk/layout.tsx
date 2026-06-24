import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import Link from 'next/link';
import { 
  Award, 
  Calendar, 
  FileSpreadsheet, 
  HeartHandshake, 
  LayoutDashboard, 
  LogOut, 
  ShieldAlert, 
  Users,
  BookOpen,
  GraduationCap,
  FolderOpen
} from 'lucide-react';
import ClientLogoutButton from '../admin/LogoutButton';
import BKLayoutWrapper from './BKLayoutWrapper';
import { prisma } from '@/lib/db';

export default async function BKLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Validasi peran BK / Kepala Sekolah di server side
  if (!user || (user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH')) {
    redirect('/login');
  }

  const isKepsek = user.role === 'KEPALA_SEKOLAH';
  const profil = await prisma.profilSekolah.findFirst();

  const sidebar = (
    <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 no-print">
      <div>
        {/* Logo Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          {profil?.logoSekolahUrl ? (
            <img src={profil.logoSekolahUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-950/20" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-violet-500/10 shrink-0">
              BK
            </div>
          )}
          <div className="overflow-hidden">
            <h2 className="font-extrabold text-white text-sm tracking-wide uppercase truncate max-w-[140px]" title={profil?.namaSekolah || 'SIAKAD BK'}>
              {profil?.namaSekolah || 'SIAKAD BK'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {isKepsek ? 'Kepala Sekolah' : 'Bimbingan Konseling'}
            </p>
          </div>
        </div>

        {/* Sesi User */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-violet-400">
            {isKepsek ? 'KS' : 'BK'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
            <p className="text-[9px] text-violet-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block animate-ping" />
              {isKepsek ? 'Kepala Sekolah' : 'Guru BK'}
            </p>
          </div>
        </div>

        {/* Menu Link */}
        <nav className="p-4 space-y-1.5">
          <Link
            href="/bk/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          
          <Link
            href="/bk/kasus"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
          >
            <HeartHandshake size={18} />
            Catatan Konseling
          </Link>

          <Link
            href="/bk/pelanggaran"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
          >
            <ShieldAlert size={18} />
            Poin Pelanggaran
          </Link>

          {!isKepsek && (
            <Link
              href="/bk/monitoring/absensi"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <FileSpreadsheet size={18} />
              Laporan Kehadiran
            </Link>
          )}

          <Link
            href="/bk/kelulusan"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
          >
            <Award size={18} />
            Kelayakan Kelulusan
          </Link>

          {isKepsek && (
            <>
              <div className="pt-4 pb-1 border-t border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4">
                Supervisi Kepala Sekolah
              </div>
              <Link
                href="/bk/monitoring/absensi"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                <FileSpreadsheet size={18} />
                Monitoring Absensi
              </Link>
              <Link
                href="/bk/monitoring/jurnal"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                <BookOpen size={18} />
                Monitoring Jurnal
              </Link>
              <Link
                href="/bk/monitoring/modul-ajar"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                <BookOpen size={18} />
                Supervisi Modul Ajar
              </Link>
              <Link
                href="/bk/monitoring/nilai"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                <GraduationCap size={18} />
                Monitoring Nilai
              </Link>
              <Link
                href="/bk/monitoring/surat"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                <FolderOpen size={18} />
                Monitoring Dokumen
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Action Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <ClientLogoutButton />
      </div>
    </aside>
  );

  return (
    <BKLayoutWrapper sidebar={sidebar}>
      {children}
    </BKLayoutWrapper>
  );
}
