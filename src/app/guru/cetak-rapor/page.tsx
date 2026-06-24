import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ kelasId?: string; siswaId?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function CetakRaporPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { kelasId, siswaId } = params;

  if (!kelasId || !siswaId) {
    return notFound();
  }

  // Ambil data profil sekolah
  const profil = await prisma.profilSekolah.findFirst();

  const hasPemdaLogo = isValidImageUrl(profil?.logoPemdaUrl);
  const hasSekolahLogo = isValidImageUrl(profil?.logoSekolahUrl);
  const leftLogoUrl = hasPemdaLogo ? profil?.logoPemdaUrl : (hasSekolahLogo ? profil?.logoSekolahUrl : null);
  const rightLogoUrl = (hasPemdaLogo && hasSekolahLogo) ? profil?.logoSekolahUrl : null;

  // Ambil data siswa
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: {
      kelas: { include: { tahunAjaran: true, waliKelas: true } }
    }
  });

  if (!siswa) {
    return notFound();
  }

  // Ambil semua mata pelajaran dan join nilai + TPs untuk siswa ini
  const subjects = await prisma.mataPelajaran.findMany({
    include: {
      nilai: { where: { siswaId } },
      tujuanPembelajaran: {
        include: { capaianSiswa: { where: { siswaId } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  // Ambil data absensi siswa
  const absensiRecords = await prisma.absensi.findMany({
    where: { siswaId }
  });
  const hadir = absensiRecords.filter(r => r.status === 'HADIR').length;
  const sakit = absensiRecords.filter(r => r.status === 'SAKIT').length;
  const izin = absensiRecords.filter(r => r.status === 'IZIN').length;
  const alpa = absensiRecords.filter(r => r.status === 'ALPA').length;
  const totalHariAbsensi = absensiRecords.length;

  // Catatan Wali Kelas dinamis berdasarkan rata-rata rapor
  let totalNilaiRapor = 0;
  let mapelDenganNilaiCount = 0;
  
  const subjectsWithGrades = subjects.map((subject) => {
    const gradeRecord = subject.nilai[0] || null;
    const raporNilai = gradeRecord?.rapor ?? null;
    
    if (raporNilai !== null) {
      totalNilaiRapor += raporNilai;
      mapelDenganNilaiCount++;
    }

    // Generate Capaian Kompetensi (Kurikulum Merdeka Deskripsi Dinamis)
    const tps = subject.tujuanPembelajaran;
    let deskripsiKetercapaian = 'Peserta didik menunjukkan perkembangan yang baik dalam pembelajaran.';
    
    if (tps.length > 0) {
      const tercapaiList = tps.filter(tp => {
        const cRecord = tp.capaianSiswa[0];
        return cRecord ? cRecord.tercapai : true; // Default true jika belum ada rekam data
      });
      const belumTercapaiList = tps.filter(tp => {
        const cRecord = tp.capaianSiswa[0];
        return cRecord ? !cRecord.tercapai : false;
      });

      if (belumTercapaiList.length === 0) {
        // Semua tuntas
        const topTpDesc = tps[0]?.deskripsi || '';
        deskripsiKetercapaian = `Menunjukkan penguasaan yang sangat baik dalam seluruh materi pembelajaran, terutama dalam hal ${topTpDesc.toLowerCase()}.`;
      } else if (tercapaiList.length === 0) {
        // Semua belum tuntas
        const firstTpDesc = tps[0]?.deskripsi || '';
        deskripsiKetercapaian = `Perlu bimbingan lebih intensif dan latihan mandiri secara berkala, terutama dalam hal ${firstTpDesc.toLowerCase()}.`;
      } else {
        // Sebagian tuntas sebagian belum
        const tercapaiDesc = tercapaiList.map(t => t.deskripsi.toLowerCase()).slice(0, 2).join(', ');
        const belumTercapaiDesc = belumTercapaiList.map(t => t.deskripsi.toLowerCase()).slice(0, 2).join(', ');
        deskripsiKetercapaian = `Menunjukkan penguasaan yang baik dalam hal ${tercapaiDesc}. Perlu bimbingan dan peningkatan kompetensi dalam hal ${belumTercapaiDesc}.`;
      }
    }

    return {
      nama: subject.nama,
      kode: subject.kode,
      raporNilai,
      deskripsi: deskripsiKetercapaian
    };
  });

  const rataRataRapor = mapelDenganNilaiCount > 0 
    ? Math.round(totalNilaiRapor / mapelDenganNilaiCount) 
    : 0;

  let catatanWaliKelas = 'Pertahankan motivasi belajarmu dan teruslah aktif dalam kegiatan sekolah.';
  if (rataRataRapor >= 85) {
    catatanWaliKelas = 'Sangat baik! Pertahankan prestasi yang luar biasa ini, teruslah belajar dengan tekun dan rendah hati.';
  } else if (rataRataRapor >= 70) {
    catatanWaliKelas = 'Hasil yang cukup memuaskan. Tingkatkan fokus belajarmu di kelas dan perbanyak latihan soal di rumah.';
  } else if (rataRataRapor > 0) {
    catatanWaliKelas = 'Perlu bimbingan dan dukungan ekstra. Kurangi waktu bermain, mulailah fokus belajar untuk memperbaiki nilai di semester depan.';
  }

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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Rapor
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

      <div className="text-center mt-4">
        <h2 className="text-sm font-bold uppercase tracking-wide">LAPORAN HASIL BELAJAR (RAPOR)</h2>
        <h3 className="text-xs font-semibold uppercase mt-0.5">KURIKULUM MERDEKA</h3>
      </div>

      {/* Detail Siswa */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-[10px] border border-black p-3 bg-slate-50/50">
        <div className="space-y-1">
          <p>Nama Peserta Didik: <strong>{siswa.nama}</strong></p>
          <p>NISN: <strong>{siswa.nisn}</strong></p>
          <p>Sekolah: <strong>{profil?.namaSekolah || 'SD Negeri Wedusan'}</strong></p>
        </div>
        <div className="space-y-1 text-right">
          <p>Kelas: <strong>{siswa.kelas.nama}</strong></p>
          <p>Fase: <strong>C</strong></p>
          <p>Tahun Pelajaran: <strong>{siswa.kelas.tahunAjaran.tahun}</strong></p>
        </div>
      </div>

      {/* Tabel Nilai & Capaian */}
      <table className="w-full mt-6 border-collapse border border-black text-left text-[10px]">
        <thead>
          <tr className="bg-slate-100 border-b border-black text-center font-bold">
            <th className="p-2 border-r border-black w-8">No</th>
            <th className="p-2 border-r border-black w-48 text-left">Mata Pelajaran</th>
            <th className="p-2 border-r border-black w-14 text-center">Nilai Rapor</th>
            <th className="p-2">Capaian Kompetensi (Deskripsi)</th>
          </tr>
        </thead>
        <tbody>
          {subjectsWithGrades.map((subject, idx) => (
            <tr key={subject.kode} className="border-b border-black/40 h-14">
              <td className="p-2 border-r border-black text-center font-bold">{idx + 1}</td>
              <td className="p-2 border-r border-black font-semibold">
                <div>{subject.nama}</div>
                <div className="text-[8px] text-slate-500 font-mono font-normal mt-0.5">{subject.kode}</div>
              </td>
              <td className="p-2 border-r border-black text-center font-bold text-xs bg-slate-50/10">
                {subject.raporNilai !== null ? subject.raporNilai : '-'}
              </td>
              <td className="p-2 text-justify-custom leading-normal text-slate-700 font-medium">{subject.deskripsi}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rekap Absensi & Catatan */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] break-inside-avoid">
        {/* Absensi */}
        <table className="border-collapse border border-black text-left w-full h-fit">
          <thead>
            <tr className="bg-slate-100 border-b border-black font-bold">
              <th className="p-2 border-r border-black" colSpan={2}>Ketidakhadiran (Absensi)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/30">
              <td className="p-2 border-r border-black w-36">Sakit (S)</td>
              <td className="p-2 font-bold text-center">{sakit} Hari</td>
            </tr>
            <tr className="border-b border-black/30">
              <td className="p-2 border-r border-black">Izin (I)</td>
              <td className="p-2 font-bold text-center">{izin} Hari</td>
            </tr>
            <tr className="border-b border-black/30">
              <td className="p-2 border-r border-black">Alpa (Tanpa Keterangan)</td>
              <td className="p-2 font-bold text-center text-rose-600">{alpa} Hari</td>
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td className="p-2 border-r border-black">Total Tidak Hadir</td>
              <td className="p-2 text-center">{sakit + izin + alpa} Hari</td>
            </tr>
          </tbody>
        </table>

        {/* Catatan Wali Kelas */}
        <div className="border border-black p-3 flex flex-col justify-between">
          <div>
            <h4 className="font-bold border-b border-black pb-1 uppercase tracking-wider">Catatan Wali Kelas</h4>
            <p className="mt-2 text-justify-custom leading-relaxed italic text-slate-800">
              "{catatanWaliKelas}"
            </p>
          </div>
          <div className="text-right text-[8px] text-slate-500 font-bold uppercase mt-4">
            Rata-rata Nilai Rapor Siswa: {rataRataRapor}%
          </div>
        </div>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-12 grid grid-cols-3 text-center text-xs gap-4 break-inside-avoid">
        <div>
          <p>Orang Tua / Wali Murid,</p>
          <div className="h-16" />
          <p className="font-bold underline text-slate-400">________________________</p>
        </div>
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
          <p>Wali Kelas,</p>
          <div className="h-16" />
          <p className="font-bold underline">{siswa.kelas.waliKelas?.nama || 'Budiono, S.Pd.'}</p>
          {siswa.kelas.waliKelas?.nip && (
            <p className="text-[10px] text-slate-500 font-mono">NIP. {siswa.kelas.waliKelas.nip}</p>
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
