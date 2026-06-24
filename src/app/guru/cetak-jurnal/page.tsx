import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function CetakJurnalPage() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return notFound();
  }

  // Ambil profil guru
  const guru = await prisma.guru.findUnique({
    where: { userId: user.id }
  });

  if (!guru) {
    return notFound();
  }

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  const hasPemdaLogo = isValidImageUrl(profil?.logoPemdaUrl);
  const hasSekolahLogo = isValidImageUrl(profil?.logoSekolahUrl);
  const leftLogoUrl = hasPemdaLogo ? profil?.logoPemdaUrl : (hasSekolahLogo ? profil?.logoSekolahUrl : null);
  const rightLogoUrl = (hasPemdaLogo && hasSekolahLogo) ? profil?.logoSekolahUrl : null;

  // Ambil data jurnal guru ini
  const jurnalList = await prisma.jurnalHarian.findMany({
    where: { guruId: guru.id },
    include: {
      kelas: true,
      mataPelajaran: true
    },
    orderBy: { tanggal: 'desc' }
  });

  const tanggalCetakStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 w-full font-sans relative">
      {/* Tombol Cetak Manual */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Jurnal
          </button>
        `}}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 1.5cm;
        }
        .text-justify-custom {
          text-align: justify;
          text-justify: inter-word;
        }
      `}} />

      {/* Kop Laporan */}
      <div className="border-b-2 border-black pb-3 text-center relative flex items-center justify-center min-h-[70px]">
        {leftLogoUrl && (
          <img 
            src={leftLogoUrl} 
            alt="Logo" 
            className="w-14 h-14 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        {rightLogoUrl && (
          <img 
            src={rightLogoUrl} 
            alt="Logo" 
            className="w-14 h-14 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        <div className={`flex-1 text-center ${leftLogoUrl ? 'pl-16' : ''} ${rightLogoUrl ? 'pr-16' : ''}`}>
          <h2 className="text-xs font-bold uppercase tracking-wider leading-none">
            {profil?.pemerintah || 'Pemerintah Kabupaten Pati'}
          </h2>
          <h2 className="text-xs font-bold uppercase tracking-wider leading-none mt-1">
            {profil?.dinas || 'Dinas Pendidikan dan Kebudayaan'}
          </h2>
          <h1 className="text-base font-black uppercase tracking-wide leading-tight mt-1">
            {profil?.namaSekolah || 'SD Negeri Wedusan'}
          </h1>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">
            {profil?.alamat || 'Jl. Puncel - Ngablak KM. 05 Desa Wedusan, Kec. Dukuhseti, Kab. Pati (59158)'}
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide">JURNAL HARIAN MENGAJAR GURU</h2>
        <h3 className="text-xs font-semibold uppercase mt-1">TAHUN AJARAN 2025/2026</h3>
      </div>

      {/* Detail Guru */}
      <div className="mt-6 text-xs space-y-1.5 max-w-md">
        <div className="grid grid-cols-3">
          <span>Nama Guru</span>
          <span>:</span>
          <span className="font-bold">{guru.nama}</span>
        </div>
        {guru.nip && (
          <div className="grid grid-cols-3">
            <span>NIP</span>
            <span>:</span>
            <span className="font-bold font-mono">{guru.nip}</span>
          </div>
        )}
        <div className="grid grid-cols-3">
          <span>Pangkat / Golongan</span>
          <span>:</span>
          <span>{guru.pangkat || '-'} {guru.golongan ? `(${guru.golongan})` : ''}</span>
        </div>
      </div>

      {/* Tabel Jurnal */}
      <table className="w-full mt-6 border-collapse border border-black text-left text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-black text-center font-bold">
            <th className="p-2 border-r border-black w-8">No</th>
            <th className="p-2 border-r border-black w-28">Hari / Tanggal</th>
            <th className="p-2 border-r border-black w-24">Kelas & Mapel</th>
            <th className="p-2 border-r border-black">Materi Pembelajaran</th>
            <th className="p-2">Catatan Kejadian / Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody>
          {jurnalList.length === 0 ? (
            <tr>
              <td className="p-4 text-center italic text-slate-400" colSpan={5}>
                Belum ada catatan jurnal harian mengajar.
              </td>
            </tr>
          ) : (
            jurnalList.map((item, idx) => {
              const formattedDate = new Date(item.tanggal).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
              return (
                <tr key={item.id} className="border-b border-black/40">
                  <td className="p-2 border-r border-black text-center font-bold">{idx + 1}</td>
                  <td className="p-2 border-r border-black">{formattedDate}</td>
                  <td className="p-2 border-r border-black">
                    <div className="font-bold">{item.kelas.nama}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.mataPelajaran.nama}</div>
                  </td>
                  <td className="p-2 border-r border-black text-justify-custom font-semibold">{item.materi}</td>
                  <td className="p-2 text-justify-custom text-slate-700 italic">{item.catatan || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Kolom Tanda Tangan */}
      <div className="mt-12 grid grid-cols-2 text-center text-xs gap-8">
        <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {profil.nipKepsek}</p>
          )}
        </div>
        <div>
          <p>{profil?.namaSekolah?.split(' ')[2] || 'Wedusan'}, {tanggalCetakStr}</p>
          <p>Guru Kelas,</p>
          <div className="h-16" />
          <p className="font-bold underline">{guru.nama}</p>
          {guru.nip && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {guru.nip}</p>
          )}
        </div>
      </div>

      {/* Script Auto Print */}
      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(() => {
          window.print();
        }, 500);
      `}} />
    </div>
  );
}
