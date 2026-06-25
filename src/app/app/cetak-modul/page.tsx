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

const getFase = (kelasNama: string): string => {
  const k = kelasNama.toUpperCase();
  if (k.includes('KELAS 1') || k.includes('KELAS I') || k.includes('KELAS 2') || k.includes('KELAS II')) {
    return 'Fase A';
  }
  if (k.includes('KELAS 3') || k.includes('KELAS III') || k.includes('KELAS 4') || k.includes('KELAS IV')) {
    return 'Fase B';
  }
  if (k.includes('KELAS 5') || k.includes('KELAS V') || k.includes('KELAS 6') || k.includes('KELAS VI')) {
    return 'Fase C';
  }
  return 'Fase A/B/C';
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
        <h1 className="text-sm font-black uppercase tracking-wider">MODUL AJAR KURIKULUM MERDEKA (SEKOLAH DASAR)</h1>
      </div>

      {/* I. INFORMASI UMUM */}
      <div className="mt-6">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-3">I. INFORMASI UMUM</h3>
        <div className="text-xs space-y-1.5 pl-2">
          <div className="flex"><span className="w-36 font-bold">Nama Penyusun</span><span>: {modul.guru.nama}</span></div>
          <div className="flex"><span className="w-36 font-bold">Institusi</span><span>: {profil?.namaSekolah || 'SD Negeri Wedusan'}</span></div>
          <div className="flex"><span className="w-36 font-bold">Tahun</span><span>: 2026</span></div>
          <div className="flex"><span className="w-36 font-bold">Jenjang/Kelas</span><span>: Sekolah Dasar (SD) / Kelas {modul.kelas?.nama || '-'}</span></div>
          <div className="flex"><span className="w-36 font-bold">Fase</span><span>: {getFase(modul.kelas?.nama || '')}</span></div>
          <div className="flex"><span className="w-36 font-bold">Mata Pelajaran</span><span>: {modul.mataPelajaran.nama}</span></div>
          <div className="flex"><span className="w-36 font-bold">Alokasi Waktu</span><span>: {infoUmum?.alokasiWaktu || '-'}</span></div>
          <div className="flex"><span className="w-36 font-bold">Model</span><span>: {infoUmum?.modelPembelajaran || '-'}</span></div>
          <div className="flex"><span className="w-36 font-bold">Moda</span><span>: Tatap Muka</span></div>
        </div>

        <div className="mt-4 pl-2 text-xs">
          <h4 className="font-bold mb-1">A. Kompetensi Awal</h4>
          <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
            {infoUmum?.kompetensiAwal || '-'}
          </div>
        </div>

        <div className="mt-4 pl-2 text-xs">
          <h4 className="font-bold mb-1">B. Sarana dan Prasarana</h4>
          <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
            {infoUmum?.saranaPrasarana || '-'}
          </div>
        </div>

        <div className="mt-4 pl-2 text-xs">
          <h4 className="font-bold mb-1">C. Target Peserta Didik</h4>
          <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
            {infoUmum?.targetPeserta || 'Peserta didik reguler'}
          </div>
        </div>
      </div>

      {/* II. INTEGRASI 8 PROFIL LULUSAN (KEMENDIKDASMEN 2026) */}
      <div className="mt-6 break-inside-avoid">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-2">II. INTEGRASI 8 PROFIL LULUSAN (KEMENDIKDASMEN 2026)</h3>
        <p className="text-[10px] text-slate-500 italic mb-2 pl-2">
          (Pilih beberapa profil lulusan di bawah ini yang paling dominan dan relevan dengan fokus pembelajaran hari ini)*
        </p>
        <div className="text-xs space-y-2 pl-2">
          {[
            'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
            'Berkebinekaan Global',
            'Gotong Royong',
            'Mandiri',
            'Bernalar Kritis',
            'Kreatif',
            'Literasi dan Numerasi Berkelanjutan',
            'Adaptif dan Berkelanjutan'
          ].map((dimensi, idx) => {
            const isSelected = infoUmum?.profilLulusan?.includes(dimensi);
            const realisasi = infoUmum?.profilLulusanRealisasi?.[dimensi];
            return (
              <div key={idx} className={`leading-relaxed ${isSelected ? 'text-black font-medium' : 'text-slate-400'}`}>
                <span className="font-bold">{idx + 1}. {dimensi}: </span>
                {isSelected ? (
                  <span className="text-black">{realisasi || 'Diwujudkan melalui aktivitas pembelajaran.'}</span>
                ) : (
                  <span className="italic font-normal text-slate-400">(Tidak dominan/Tidak dipilih)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* III. KOMPONEN INTI */}
      <div className="mt-6">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-3">III. KOMPONEN INTI</h3>
        
        <div className="mt-3 pl-2 text-xs space-y-4">
          <div>
            <h4 className="font-bold mb-1">A. Tujuan Pembelajaran (TP)</h4>
            <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed font-semibold">
              {kompInti?.tujuanPembelajaran || '-'}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-1">B. Pemahaman Bermakna</h4>
            <div className="pl-4 text-justify-custom leading-relaxed italic text-slate-800">
              {kompInti?.pemahamanBermakna || '-'}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-1">C. Pertanyaan Pemantik</h4>
            <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
              {kompInti?.pertanyaanPemantik || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* IV. LANGKAH-LANGKAH PEMBELAJARAN */}
      <div className="mt-6">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-3">IV. LANGKAH-LANGKAH PEMBELAJARAN</h3>
        
        <div className="mt-3 pl-2 text-xs space-y-4">
          {kompInti?.kegiatanPendahuluan && (
            <div>
              <h4 className="font-bold mb-1">1. Kegiatan Pendahuluan</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed border-l-2 border-slate-350 text-slate-800">
                {kompInti.kegiatanPendahuluan}
              </div>
            </div>
          )}

          {kompInti?.kegiatanInti && (
            <div>
              <h4 className="font-bold mb-1">2. Kegiatan Inti</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed border-l-2 border-slate-350 text-slate-800">
                {kompInti.kegiatanInti}
              </div>
            </div>
          )}

          {kompInti?.kegiatanPenutup && (
            <div>
              <h4 className="font-bold mb-1">3. Kegiatan Penutup</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed border-l-2 border-slate-350 text-slate-800">
                {kompInti.kegiatanPenutup}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* V. ASESMEN (PENILAIAN) */}
      <div className="mt-6 break-inside-avoid">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-3">V. ASESMEN (PENILAIAN)</h3>
        <div className="text-xs space-y-2 pl-4 text-slate-800">
          <div><strong>1. Asesmen Diagnostik (Sebelum Belajar):</strong> {kompInti?.asesmenDiagnostik || '-'}</div>
          <div><strong>2. Asesmen Formatif (Selama Proses Belajar):</strong> {kompInti?.asesmenFormatif || '-'}</div>
          <div><strong>3. Asesmen Sumatif (Akhir Bab):</strong> {kompInti?.asesmenSumatif || '-'}</div>
        </div>
      </div>

      {/* VI. LAMPIRAN */}
      <div className="mt-6 pt-4 border-t border-black">
        <h3 className="text-xs font-extrabold uppercase border-b-2 border-black pb-1 mb-3">VI. LAMPIRAN</h3>
        
        <div className="text-xs space-y-6 pl-2">
          {lampiran?.lkpd && (
            <div className="break-inside-avoid">
              <h4 className="font-bold mb-2">A. Lembar Kerja Peserta Didik (LKPD)</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
                {lampiran.lkpd}
              </div>
            </div>
          )}

          {lampiran?.bahanAjar && (
            <div className="break-inside-avoid">
              <h4 className="font-bold mb-2">B. Bahan Ajar / Materi Pembelajaran (Untuk Guru dan Siswa)</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
                {lampiran.bahanAjar}
              </div>
            </div>
          )}

          {lampiran?.soalAsesmen && (
            <div className="break-inside-avoid">
              <h4 className="font-bold mb-2">C. Rubrik Penilaian</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
                {lampiran.soalAsesmen}
              </div>
            </div>
          )}

          {lampiran?.glosarium && (
            <div className="break-inside-avoid">
              <h4 className="font-bold mb-2">D. Glosarium</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
                {lampiran.glosarium}
              </div>
            </div>
          )}

          {lampiran?.daftarPustaka && (
            <div className="break-inside-avoid">
              <h4 className="font-bold mb-2">E. Daftar Pustaka</h4>
              <div className="pl-4 text-justify-custom whitespace-pre-line leading-relaxed text-slate-800">
                {lampiran.daftarPustaka}
              </div>
            </div>
          )}
        </div>
      </div>

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
