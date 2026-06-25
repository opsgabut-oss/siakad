import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardForm from './DashboardForm';
import PresensiMandiri from './PresensiMandiri';
import { Calendar, School, CheckSquare, Lock } from 'lucide-react';

export const revalidate = 0; // Disable cache for live stats

export default async function GuruDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    redirect('/login');
  }

  // Get active school year
  const activeTahunAjaran = await prisma.tahunAjaran.findFirst({
    where: { aktif: true }
  });

  // Get homeroom class for this teacher in active school year
  const classes = activeTahunAjaran && user.guru
    ? await prisma.kelas.findMany({
        where: { 
          tahunAjaranId: activeTahunAjaran.id,
          waliKelasId: user.guru.id
        },
        orderBy: { nama: 'asc' }
      })
    : [];

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-center">
      {/* Welcome Header */}
      <div className="space-y-1 text-center md:text-left">
        <span className="inline-flex items-center gap-1 bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🏫 PORTAL GURU & STAF
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Dashboard Portal</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Kelola kehadiran pribadi Anda, serta lakukan presensi kehadiran siswa harian.
        </p>
      </div>

      {/* Komponen Presensi Kehadiran Mandiri Guru */}
      <PresensiMandiri />

      {/* Absensi Siswa Section */}
      <div className="border-t border-slate-800/80 pt-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1">
          Input Presensi Siswa Harian
        </h3>
        
        {classes.length > 0 ? (
          <>
            {/* Stats Summary Guru */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <CheckSquare size={22} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Ajaran Aktif</h4>
                <p className="text-sm font-bold text-white mt-0.5">
                  {activeTahunAjaran ? activeTahunAjaran.tahun : 'Belum ditentukan'}
                </p>
              </div>
            </div>

            {/* Interactive Form Component */}
            <DashboardForm classes={classes} />
          </>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/40 text-slate-500 flex items-center justify-center font-bold mx-auto">
              <Lock size={20} className="text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">Modul Presensi Siswa Terkunci</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Modul input presensi harian siswa hanya dapat diakses oleh **Wali Kelas**. Anda saat ini tidak terdaftar sebagai Wali Kelas untuk kelas mana pun di tahun ajaran aktif ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
