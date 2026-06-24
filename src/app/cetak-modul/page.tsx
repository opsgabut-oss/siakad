import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function CetakModulAjarPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'GURU_BK' && user.role !== 'KEPALA_SEKOLAH' && user.role !== 'ADMIN')) {
    redirect('/login');
  }

  const params = await searchParams;
  const { id } = params;

  if (!id) {
    return notFound();
  }

  // Ambil data modul
  const modul = await prisma.modulAjar.findUnique({
    where: { id },
    include: {
      mataPelajaran: true,
      kelas: { include: { tahunAjaran: true } },
      guru: true
    }
  });

  if (!modul) {
    return notFound();
  }

  // Ambil profil sekolah untuk kop
  const profil = await prisma.profilSekolah.findFirst();

  const hasPemdaLogo = isValidImageUrl(profil?.logoPemdaUrl);
  const hasSekolahLogo = isValidImageUrl(profil?.logoSekolahUrl);
  const leftLogoUrl = hasPemdaLogo ? profil?.logoPemdaUrl : (hasSekolahLogo ? profil?.logoSekolahUrl : null);
  const rightLogoUrl = (hasPemdaLogo && hasSekolahLogo) ? profil?.logoSekolahUrl : null;

  // Parsing JSON data modul
  const infoUmum = modul.informasiUmum as any;
  const kompInti = modul.komponenInti as any;
  const lampiran = modul.lampiran as any;

  const tanggalCetakStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 w-full font-sans relative">
      {/* Tombol Cetak Manual & Kembali */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.history.back()" class="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors border border-slate-300">
            ← Kembali
          </button>
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors border-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Modul Ajar
          </button>
        `}}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 1.8cm;
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
        <h2 className="text-sm font-black uppercase tracking-wide">MODUL AJAR / RPP PLUS</h2>
        <h3 className="text-xs font-bold uppercase tracking-wide mt-1">KURIKULUM MERDEKA</h3>
        <p className="text-[11px] font-bold text-slate-600 mt-1">{modul.judul}</p>
      </div>

      {/* SECTION A: INFORMASI UMUM */}
      <div className="mt-6">
        <h3 className="text-xs font-extrabold uppercase bg-slate-100 p-1.5 border border-black">A. INFORMASI UMUM</h3>
        <table className="w-full mt-2 border-collapse border border-black text-left text-xs table-fixed">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black w-48 font-bold bg-slate-50/40">Penyusun / Instruktur</td>
              <td className="p-2">{modul.guru.nama}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Satuan Pendidikan</td>
              <td className="p-2">{profil?.namaSekolah || 'SD Negeri Wedusan'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Mata Pelajaran</td>
              <td className="p-2">{modul.mataPelajaran.nama} ({modul.mataPelajaran.kode})</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Kelas / Semester</td>
              <td className="p-2">{modul.kelas?.nama || 'V'} / {infoUmum?.semester || 'Ganjil'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Alokasi Waktu</td>
              <td className="p-2">{infoUmum?.alokasiWaktu || '2 JP (2 x 35 Menit)'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Kompetensi Awal</td>
              <td className="p-2 text-justify-custom">{infoUmum?.kompetensiAwal || '-'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Dimensi Profil Lulusan (Permendikdasmen 10/2025)</td>
              <td className="p-2">
                {infoUmum?.profilLulusan && Array.isArray(infoUmum.profilLulusan) && infoUmum.profilLulusan.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {infoUmum.profilLulusan.map((item: string, idx: number) => (
                      <li key={idx} className="font-semibold">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Sarana & Prasarana</td>
              <td className="p-2 text-justify-custom">{infoUmum?.saranaPrasarana || '-'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Target Peserta Didik</td>
              <td className="p-2">{infoUmum?.targetPeserta || 'Siswa Reguler'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black font-bold bg-slate-50/40">Model Pembelajaran</td>
              <td className="p-2">{infoUmum?.modelPembelajaran || 'Tatap Muka / Project-Based Learning'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION B: KOMPONEN INTI */}
      <div className="mt-6">
        <h3 className="text-xs font-extrabold uppercase bg-slate-100 p-1.5 border border-black">B. KOMPONEN INTI</h3>
        <div className="mt-3 space-y-4 text-xs">
          
          <div className="space-y-1">
            <h4 className="font-bold underline text-[11px]">1. Tujuan Pembelajaran (TP)</h4>
            <div className="pl-4 text-justify-custom whitespace-pre-line font-medium leading-relaxed">
              {kompInti?.tujuanPembelajaran || '-'}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold underline text-[11px]">2. Pemahaman Bermakna</h4>
            <p className="pl-4 text-justify-custom leading-relaxed italic">{kompInti?.pemahamanBermakna || '-'}</p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold underline text-[11px]">3. Pertanyaan Pemantik</h4>
            <div className="pl-4 text-justify-custom leading-relaxed">
              {kompInti?.pertanyaanPemantik ? (
                <ul className="list-disc pl-4 space-y-1">
                  {kompInti.pertanyaanPemantik.split('\n').filter((l: string) => l.trim()).map((l: string, idx: number) => (
                    <li key={idx}>{l}</li>
                  ))}
                </ul>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold underline text-[11px]">4. Kegiatan Pembelajaran</h4>
            <div className="pl-4 space-y-3">
              {kompInti?.kegiatanPendahuluan && (
                <div className="space-y-1">
                  <h5 className="font-bold text-indigo-950">a. Kegiatan Pendahuluan</h5>
                  <div className="pl-3 text-justify-custom leading-relaxed whitespace-pre-line border-l-2 border-slate-300">
                    {kompInti.kegiatanPendahuluan}
                  </div>
                </div>
              )}
              {kompInti?.kegiatanInti && (
                <div className="space-y-1">
                  <h5 className="font-bold text-indigo-950">b. Kegiatan Inti</h5>
                  <div className="pl-3 text-justify-custom leading-relaxed whitespace-pre-line border-l-2 border-slate-300">
                    {kompInti.kegiatanInti}
                  </div>
                </div>
              )}
              {kompInti?.kegiatanPenutup && (
                <div className="space-y-1">
                  <h5 className="font-bold text-indigo-950">c. Kegiatan Penutup</h5>
                  <div className="pl-3 text-justify-custom leading-relaxed whitespace-pre-line border-l-2 border-slate-300">
                    {kompInti.kegiatanPenutup}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold underline text-[11px]">5. Asesmen Penilaian</h4>
            <div className="pl-4 space-y-1">
              <p>• <strong>Asesmen Diagnostik</strong>: {kompInti?.asesmenDiagnostik || '-'}</p>
              <p>• <strong>Asesmen Formatif</strong>: {kompInti?.asesmenFormatif || '-'}</p>
              <p>• <strong>Asesmen Sumatif</strong>: {kompInti?.asesmenSumatif || '-'}</p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION C: LAMPIRAN */}
      {lampiran && (
        <div className="mt-6 pt-4 border-t border-black break-inside-avoid">
          <h3 className="text-xs font-extrabold uppercase bg-slate-100 p-1.5 border border-black">C. LAMPIRAN</h3>
          <div className="mt-3 space-y-4 text-xs">
            {lampiran.bahanAjar && (
              <div className="space-y-1">
                <h4 className="font-bold underline text-[11px]">1. Bahan Ajar</h4>
                <div className="pl-4 text-justify-custom leading-relaxed whitespace-pre-line">
                  {lampiran.bahanAjar}
                </div>
              </div>
            )}
            {lampiran.lkpd && (
              <div className="space-y-1">
                <h4 className="font-bold underline text-[11px]">{lampiran.bahanAjar ? '2' : '1'}. Lembar Kerja Peserta Didik (LKPD)</h4>
                <div className="pl-4 text-justify-custom leading-relaxed whitespace-pre-line">
                  {lampiran.lkpd}
                </div>
              </div>
            )}
            {lampiran.glosarium && (
              <div className="space-y-1">
                <h4 className="font-bold underline text-[11px]">{Number(!!lampiran.bahanAjar) + Number(!!lampiran.lkpd) + 1}. Glosarium</h4>
                <div className="pl-4 text-justify-custom leading-relaxed whitespace-pre-line">
                  {lampiran.glosarium}
                </div>
              </div>
            )}
            {lampiran.daftarPustaka && (
              <div className="space-y-1">
                <h4 className="font-bold underline text-[11px]">{Number(!!lampiran.bahanAjar) + Number(!!lampiran.lkpd) + Number(!!lampiran.glosarium) + 1}. Daftar Pustaka</h4>
                <div className="pl-4 text-justify-custom leading-relaxed whitespace-pre-line">
                  {lampiran.daftarPustaka}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kolom Tanda Tangan */}
      <div className="mt-12 grid grid-cols-2 text-center text-xs gap-8 break-inside-avoid">
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
          <p className="font-bold underline">{modul.guru.nama}</p>
          {modul.guru.nip && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {modul.guru.nip}</p>
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
