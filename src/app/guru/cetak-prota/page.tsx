import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ kelasId?: string; mapelId?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function CetakProtaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { kelasId, mapelId } = params;

  if (!kelasId || !mapelId) {
    return notFound();
  }

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  const hasPemdaLogo = isValidImageUrl(profil?.logoPemdaUrl);
  const hasSekolahLogo = isValidImageUrl(profil?.logoSekolahUrl);
  const leftLogoUrl = hasPemdaLogo ? profil?.logoPemdaUrl : (hasSekolahLogo ? profil?.logoSekolahUrl : null);
  const rightLogoUrl = (hasPemdaLogo && hasSekolahLogo) ? profil?.logoSekolahUrl : null;

  // Ambil data kelas
  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: { tahunAjaran: true, waliKelas: true }
  });

  // Ambil data mapel
  const mapel = await prisma.mataPelajaran.findUnique({
    where: { id: mapelId }
  });

  if (!kelas || !mapel) {
    return notFound();
  }

  // Ambil list TP untuk mapel dan kelas tersebut
  const tps = await prisma.tujuanPembelajaran.findMany({
    where: { mataPelajaranId: mapelId, kelasId },
    orderBy: [
      { semester: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  const tpSemester1 = tps.filter(tp => tp.semester === 1);
  const tpSemester2 = tps.filter(tp => tp.semester === 2);

  const totalJP1 = tpSemester1.reduce((sum, tp) => sum + tp.alokasiJP, 0);
  const totalJP2 = tpSemester2.reduce((sum, tp) => sum + tp.alokasiJP, 0);
  const grandTotalJP = totalJP1 + totalJP2;

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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Prota
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
        <h2 className="text-sm font-bold uppercase tracking-wide">PROGRAM TAHUNAN (PROTA)</h2>
        <h3 className="text-xs font-semibold uppercase mt-1">KURIKULUM MERDEKA</h3>
      </div>

      {/* Detail Prota */}
      <div className="mt-6 text-xs space-y-1.5 max-w-md">
        <div className="grid grid-cols-3">
          <span>Satuan Pendidikan</span>
          <span>:</span>
          <span className="font-bold">{profil?.namaSekolah || 'SD Negeri Wedusan'}</span>
        </div>
        <div className="grid grid-cols-3">
          <span>Mata Pelajaran</span>
          <span>:</span>
          <span className="font-bold">{mapel.nama}</span>
        </div>
        <div className="grid grid-cols-3">
          <span>Kelas</span>
          <span>:</span>
          <span className="font-bold">{kelas.nama}</span>
        </div>
        <div className="grid grid-cols-3">
          <span>Tahun Ajaran</span>
          <span>:</span>
          <span className="font-bold">{kelas.tahunAjaran.tahun}</span>
        </div>
      </div>

      {/* Tabel Prota */}
      <table className="w-full mt-6 border-collapse border border-black text-left text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-black text-center font-bold">
            <th className="p-2 border-r border-black w-24">Semester</th>
            <th className="p-2 border-r border-black w-12">No</th>
            <th className="p-2 border-r border-black">Tujuan Pembelajaran (TP)</th>
            <th className="p-2 border-r border-black w-28 text-center">Alokasi Waktu (JP)</th>
            <th className="p-2 w-20 text-center">KKTP</th>
          </tr>
        </thead>
        <tbody>
          {/* Semester 1 */}
          {tpSemester1.length === 0 ? (
            <tr className="border-b border-black/40">
              <td className="p-2 border-r border-black text-center font-semibold" rowSpan={1}>Semester I (Ganjil)</td>
              <td className="p-2 border-r border-black text-center">-</td>
              <td className="p-2 border-r border-black text-slate-400 italic">Belum ada Tujuan Pembelajaran yang diinput untuk Semester 1</td>
              <td className="p-2 border-r border-black text-center">-</td>
              <td className="p-2 text-center">-</td>
            </tr>
          ) : (
            tpSemester1.map((tp, idx) => (
              <tr key={tp.id} className="border-b border-black/40">
                {idx === 0 && (
                  <td className="p-2 border-r border-black text-center font-semibold vertical-align-middle" rowSpan={tpSemester1.length}>
                    Semester I (Ganjil)
                  </td>
                )}
                <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                <td className="p-2 border-r border-black text-justify-custom">{tp.deskripsi}</td>
                <td className="p-2 border-r border-black text-center font-medium">{tp.alokasiJP} JP</td>
                <td className="p-2 text-center font-semibold">{tp.kktp}</td>
              </tr>
            ))
          )}
          <tr className="bg-slate-50 border-b border-black font-bold text-center">
            <td className="p-2 border-r border-black" colSpan={3}>Jumlah Alokasi Waktu Semester I</td>
            <td className="p-2 border-r border-black">{totalJP1} JP</td>
            <td className="p-2"></td>
          </tr>

          {/* Semester 2 */}
          {tpSemester2.length === 0 ? (
            <tr className="border-b border-black/40">
              <td className="p-2 border-r border-black text-center font-semibold" rowSpan={1}>Semester II (Genap)</td>
              <td className="p-2 border-r border-black text-center">-</td>
              <td className="p-2 border-r border-black text-slate-400 italic">Belum ada Tujuan Pembelajaran yang diinput untuk Semester 2</td>
              <td className="p-2 border-r border-black text-center">-</td>
              <td className="p-2 text-center">-</td>
            </tr>
          ) : (
            tpSemester2.map((tp, idx) => (
              <tr key={tp.id} className="border-b border-black/40">
                {idx === 0 && (
                  <td className="p-2 border-r border-black text-center font-semibold vertical-align-middle" rowSpan={tpSemester2.length}>
                    Semester II (Genap)
                  </td>
                )}
                <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                <td className="p-2 border-r border-black text-justify-custom">{tp.deskripsi}</td>
                <td className="p-2 border-r border-black text-center font-medium">{tp.alokasiJP} JP</td>
                <td className="p-2 text-center font-semibold">{tp.kktp}</td>
              </tr>
            ))
          )}
          <tr className="bg-slate-50 border-b-2 border-black font-bold text-center">
            <td className="p-2 border-r border-black" colSpan={3}>Jumlah Alokasi Waktu Semester II</td>
            <td className="p-2 border-r border-black">{totalJP2} JP</td>
            <td className="p-2"></td>
          </tr>

          {/* Grand Total */}
          <tr className="bg-slate-100 border-b border-black font-black text-center text-xs">
            <td className="p-2.5 border-r border-black" colSpan={3}>TOTAL ALOKASI WAKTU SATU TAHUN</td>
            <td className="p-2.5 border-r border-black">{grandTotalJP} JP</td>
            <td className="p-2.5"></td>
          </tr>
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
          <p>Guru Mata Pelajaran,</p>
          <div className="h-16" />
          <p className="font-bold underline">{kelas.waliKelas?.nama || 'Budiono, S.Pd.'}</p>
          {kelas.waliKelas?.nip && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {kelas.waliKelas.nip}</p>
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
