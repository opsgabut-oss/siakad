import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { School } from 'lucide-react';
import MiniLogoutButton from '../guru/MiniLogoutButton';

export default async function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Validasi peran siswa / ortu di server
  if (!user || (user.role !== 'SISWA' && user.role !== 'ORANG_TUA')) {
    redirect('/login');
  }

  // Ambil profil ringkas siswa
  let namaSiswa = '';
  let nisnSiswa = '';

  if (user.role === 'SISWA') {
    const siswa = await prisma.siswa.findUnique({
      where: { userId: user.id },
    });
    namaSiswa = siswa?.nama || user.username;
    nisnSiswa = siswa?.nisn || '-';
  } else if (user.role === 'ORANG_TUA') {
    const siswa = await prisma.siswa.findUnique({
      where: { orangTuaUserId: user.id },
    });
    namaSiswa = siswa?.nama || '';
    nisnSiswa = siswa?.nisn || '';
  }

  const profil = await prisma.profilSekolah.findFirst();

  return (
    <div className="flex-1 min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 select-none">
            {profil?.logoSekolahUrl ? (
              <img src={profil.logoSekolahUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-950/20" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                SK
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-sm text-white tracking-wide leading-none truncate max-w-[140px]" title={profil?.namaSekolah || 'SIAKAD PORTAL'}>
                {profil?.namaSekolah || 'SIAKAD PORTAL'}
              </h2>
              <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                {user.role === 'SISWA' ? 'Portal Siswa' : 'Portal Orang Tua'}
              </p>
            </div>
          </div>

          {/* User Sesi */}
          <div className="text-right overflow-hidden max-w-[150px] md:max-w-xs pr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">{namaSiswa}</p>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
              NISN: {nisnSiswa}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 py-6 max-w-3xl w-full mx-auto space-y-6 flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer Nav / Quick Actions (Mobile Bottom Bar) */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-4 sticky bottom-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-around gap-2 text-center">
          <Link
            href="/siswa/dashboard"
            className="flex flex-col items-center gap-1 text-[10px] font-semibold text-indigo-400 select-none hover:text-indigo-300 transition-colors"
          >
            <School size={18} />
            Dashboard
          </Link>
          <MiniLogoutButton />
        </div>
      </footer>
    </div>
  );
}
