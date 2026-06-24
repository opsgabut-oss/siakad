import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ siswaId?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function KelayakanKelulusanPrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { siswaId } = params;

  if (!siswaId) {
    return notFound();
  }

  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: {
      kelas: {
        include: { tahunAjaran: true },
      },
      pelanggaran: true,
      absensi: true,
      nilai: {
        include: { mataPelajaran: true }
      }
    },
  });

  if (!siswa) {
    return notFound();
  }

  // Fetch School Profile
  const profil = await prisma.profilSekolah.findFirst();

  // 1. Hitung Statistik Absensi
  const totalHariAbsen = siswa.absensi.length;
  const hariHadir = siswa.absensi.filter((a) => a.status === 'HADIR').length;
  const persentaseHadir = totalHariAbsen > 0 
    ? Math.round((hariHadir / totalHariAbsen) * 100) 
    : 100; // default 100 jika belum ada data absensi

  // 2. Hitung Poin Pelanggaran BK
  const totalPoinPelanggaran = siswa.pelanggaran.reduce((sum, p) => sum + p.poin, 0);

  // 3. Rekap Akademik (Nilai Rapor)
  const mapelList = await prisma.mataPelajaran.findMany();
  const rekapNilai = mapelList.map((mapel) => {
    const dbNilai = siswa.nilai.find((n) => n.mataPelajaranId === mapel.id);
    const rapor = dbNilai?.rapor ?? 75;

    return {
      nama: mapel.nama,
      kode: mapel.kode,
      rataRata: rapor,
    };
  });

  const rataRataAkademik = rekapNilai.length > 0
    ? Math.round(rekapNilai.reduce((sum, item) => sum + item.rataRata, 0) / rekapNilai.length)
    : 75;

  // 4. Kriteria Kelulusan Otomatis
  const kriteriaAkademik = rataRataAkademik >= 70;
  const kriteriaKehadiran = persentaseHadir >= 75;
  const kriteriaKedisiplinan = totalPoinPelanggaran < 50;

  const layakLulus = kriteriaAkademik && kriteriaKehadiran && kriteriaKedisiplinan;
  const tanggalLaporan = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-12 max-w-3xl mx-auto font-sans relative">
      {/* Tombol Cetak Manual */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Evaluasi
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
          margin: 2cm;
        }
      `}} />

      {/* Kop Dokumen */}
      <div className="border-b-2 border-black pb-3 text-center relative flex items-center justify-center min-h-[70px]">
        {isValidImageUrl(profil?.logoPemdaUrl) && (
          <img 
            src={profil!.logoPemdaUrl!} 
            alt="Logo Pemda" 
            className="w-14 h-14 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        {isValidImageUrl(profil?.logoSekolahUrl) && (
          <img 
            src={profil!.logoSekolahUrl!} 
            alt="Logo Sekolah" 
            className="w-14 h-14 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        <div className={`flex-1 text-center ${isValidImageUrl(profil?.logoPemdaUrl) ? 'pl-16' : ''} ${isValidImageUrl(profil?.logoSekolahUrl) ? 'pr-16' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider leading-none">
            {profil?.pemerintah || 'Pemerintah Kabupaten Pati'}
          </h3>
          <h3 className="text-xs font-bold uppercase tracking-wider leading-none mt-1">
            {profil?.dinas || 'Dinas Pendidikan dan Kebudayaan'}
          </h3>
          <h2 className="text-sm font-black uppercase tracking-wider leading-none mt-1">
            {profil?.namaSekolah || 'SD Negeri Wedusan'}
          </h2>
          <h1 className="text-base font-black uppercase tracking-wide leading-tight mt-2">
            Draf Kelayakan Administrasi Kelulusan
          </h1>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">
            Tahun Ajaran: {siswa.kelas.tahunAjaran.tahun}
          </p>
        </div>
      </div>

      {/* Detail Siswa */}
      <div className="mt-6 grid grid-cols-2 text-xs gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
        <div className="space-y-1">
          <p><span className="text-slate-500">Nama Lengkap</span>: <strong>{siswa.nama}</strong></p>
          <p><span className="text-slate-500">NISN</span>: <strong>{siswa.nisn}</strong></p>
        </div>
        <div className="space-y-1">
          <p><span className="text-slate-500">Kelas</span>: <strong>{siswa.kelas.nama}</strong></p>
          <p><span className="text-slate-500">Tanggal Analisis</span>: <strong>{tanggalLaporan}</strong></p>
        </div>
      </div>

      {/* STATUS KELAYAKAN UTAMA */}
      <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between ${
        layakLulus 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}>
        <div>
          <h2 className="text-sm font-bold">Rekomendasi Kelayakan Kelulusan</h2>
          <p className="text-[10px] mt-0.5 opacity-80">
            Dihitung otomatis berdasarkan data kehadiran, nilai rapor, dan catatan konseling BK.
          </p>
        </div>
        <div>
          <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${
            layakLulus 
              ? 'bg-emerald-250/20 text-emerald-700 border border-emerald-500/30' 
              : 'bg-rose-250/20 text-rose-700 border border-rose-500/30'
          }`}>
            {layakLulus ? 'LAYAK LULUS' : 'DITINJAU KEMBALI'}
          </span>
        </div>
      </div>

      {/* 1. Kriteria Absensi & BK */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-bold border-b pb-1">I. Kriteria Kehadiran & Tata Tertib BK</h3>
        <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="p-2.5 font-bold">Parameter Evaluasi</th>
              <th className="p-2.5 font-bold text-center">Standar Minimum</th>
              <th className="p-2.5 font-bold text-center">Realisasi Siswa</th>
              <th className="p-2.5 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-2.5">Persentase Kehadiran Kelas (Absensi)</td>
              <td className="p-2.5 text-center">Min. 75%</td>
              <td className="p-2.5 text-center">{persentaseHadir}%</td>
              <td className="p-2.5 text-right font-bold text-emerald-600">
                {kriteriaKehadiran ? '✓ Terpenuhi' : '✗ Belum Cukup'}
              </td>
            </tr>
            <tr>
              <td className="p-2.5">Poin Pelanggaran Kedisiplinan BK</td>
              <td className="p-2.5 text-center">Maks. 50 Poin</td>
              <td className="p-2.5 text-center">{totalPoinPelanggaran} Poin</td>
              <td className="p-2.5 text-right font-bold text-emerald-600">
                {kriteriaKedisiplinan ? '✓ Terpenuhi' : '✗ Perlu Pembinaan'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. Kriteria Akademik */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-bold border-b pb-1">II. Rekapitulasi Rata-rata Nilai Akademik</h3>
        <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="p-2.5 font-bold">Mata Pelajaran</th>
              <th className="p-2.5 font-bold text-center">Kategori</th>
              <th className="p-2.5 font-bold text-right">Nilai Rata-rata (Tugas/UTS/UAS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rekapNilai.map((item) => (
              <tr key={item.kode}>
                <td className="p-2.5">{item.nama} ({item.kode})</td>
                <td className="p-2.5 text-center text-slate-500">Pokok</td>
                <td className="p-2.5 text-right font-bold">{item.rataRata}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <td className="p-2.5" colSpan={2}>Rata-rata Akumulatif</td>
              <td className="p-2.5 text-right text-indigo-700">{rataRataAkademik}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Kolom Tanda Tangan */}
      <div className="mt-16 grid grid-cols-2 text-center text-xs gap-8">
        <div>
          <p>Disetujui Oleh,</p>
          <p>Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500">NIP. {profil.nipKepsek}</p>
          )}
        </div>
        <div>
          <p>Dianalisis Oleh,</p>
          <p>Guru BK / Wali Kelas</p>
          <div className="h-16" />
          <p className="font-bold underline">Budi Santoso, S.Pd.</p>
          <p className="text-[10px] text-slate-500">NIP. 198503152010011002</p>
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
