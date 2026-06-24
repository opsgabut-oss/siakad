'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw, BarChart3, Users, Percent, CheckCircle, Printer } from 'lucide-react';

interface Kelas {
  id: string;
  nama: string;
  tahunAjaran: { tahun: string };
}

interface LaporanAbsensiRow {
  siswaId: string;
  nisn: string;
  nama: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
  persentase: number;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

const getLastWorkingDayOfMonth = (bulanStr: string) => {
  if (!bulanStr) {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const [year, month] = bulanStr.split('-').map(Number);
  let date = new Date(year, month, 0);
  
  const day = date.getDay();
  if (day === 0) { // Sunday -> Saturday
    date.setDate(date.getDate() - 1);
  }
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BKMonitoringAbsensiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');
  const [profil, setProfil] = useState<any>(null);
  
  const [laporanRows, setLaporanRows] = useState<LaporanAbsensiRow[]>([]);
  const [statistik, setStatistik] = useState({
    totalSiswa: 0,
    rataRataKehadiran: 0,
    totalHadir: 0,
    totalHariEfektif: 0,
  });

  const [activeTab, setActiveTab] = useState<'siswa' | 'guru'>('siswa');

  const [guruBulan, setGuruBulan] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [guruLaporanRows, setGuruLaporanRows] = useState<any[]>([]);
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [errorGuru, setErrorGuru] = useState('');
  const [guruStatistik, setGuruStatistik] = useState({
    totalHariKerja: 0,
    totalGuru: 0,
  });
  const [tanggalCetak, setTanggalCetak] = useState('');
  const [selectedTanggalGuru, setSelectedTanggalGuru] = useState(() => {
    return new Intl.DateTimeFormat('sv', { timeZone: 'Asia/Jakarta' }).format(new Date());
  });

  useEffect(() => {
    fetchKelas();
    fetchSchoolProfile();
    setTanggalCetak(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  useEffect(() => {
    if (selectedKelasId && activeTab === 'siswa') {
      fetchLaporanData(selectedKelasId, selectedBulan);
    }
  }, [selectedKelasId, selectedBulan, activeTab]);

  useEffect(() => {
    if (activeTab === 'guru') {
      fetchGuruLaporanData(guruBulan);
    }
  }, [guruBulan, activeTab]);

  const fetchKelas = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/kelas');
      if (!res.ok) throw new Error('Gagal mengambil data kelas');
      const data = await res.json();
      setKelasList(data);
      if (data.length > 0) {
        setSelectedKelasId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar kelas');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      const res = await fetch('/api/admin/profil-sekolah');
      if (res.ok) {
        const data = await res.json();
        setProfil(data);
      }
    } catch (err) {
      console.error('Error fetching school profile:', err);
    }
  };

  const fetchLaporanData = async (kelasId: string, bulan: string) => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/admin/laporan/rekap?kelasId=${kelasId}`;
      if (bulan) {
        url += `&bulan=${bulan}`;
      }
      const resRekap = await fetch(url);
      if (!resRekap.ok) throw new Error('Gagal memuat rekap absensi');
      const data = await resRekap.json();
      
      setLaporanRows(data.rows);
      setStatistik({
        totalSiswa: data.statistik.totalSiswa,
        rataRataKehadiran: data.statistik.rataRataKehadiran,
        totalHadir: data.statistik.totalHadir,
        totalHariEfektif: data.statistik.totalHariEfektif,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data rekap absensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuruLaporanData = async (bulan: string) => {
    setLoadingGuru(true);
    setErrorGuru('');
    try {
      const res = await fetch(`/api/admin/laporan/absensi-guru?bulan=${bulan}`);
      if (!res.ok) throw new Error('Gagal memuat rekap absensi guru');
      const data = await res.json();
      setGuruLaporanRows(data.rows);
      setGuruStatistik(data.statistik);
    } catch (err: any) {
      setErrorGuru(err.message || 'Gagal memuat data rekap absensi guru');
    } finally {
      setLoadingGuru(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedKelasId) return;
    let url = `/api/admin/laporan/absensi?kelasId=${selectedKelasId}`;
    if (selectedBulan) {
      url += `&bulan=${selectedBulan}`;
    }
    window.open(url, '_blank');
  };

  const handleExportGuruCSV = () => {
    if (guruLaporanRows.length === 0) return;
    
    let csvContent = "\uFEFF";
    csvContent += "No;Nama Guru/Staf;NIP;NIK;Hadir;Izin;Sakit;Alpa;Hari Kerja;Persentase (%)\r\n";
    
    guruLaporanRows.forEach((row, idx) => {
      csvContent += `${idx + 1};${row.nama};${row.nip};${row.nik};${row.hadir};${row.izin};${row.sakit};${row.alpa};${row.total};${row.persentase}%\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Absensi_Guru_${guruBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSelectedKelasNama = () => {
    return kelasList.find(k => k.id === selectedKelasId)?.nama || '';
  };

  const getSelectedKelasTahun = () => {
    return kelasList.find(k => k.id === selectedKelasId)?.tahunAjaran.tahun || '';
  };

  const getSelectedBulanLabel = () => {
    if (!selectedBulan) return 'Semua Bulan';
    const [year, month] = selectedBulan.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  if (loadingConfig) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="animate-spin text-violet-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html { background-color: white !important; color: black !important; }
          aside, nav, header, footer, button, .no-print, [class*="no-print"] { display: none !important; }
          main, .flex-1, div[class*="flex-1"], div[class*="max-w-7xl"] { display: block !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-header { display: flex !important; align-items: center; justify-content: center; color: black !important; position: relative; }
          .print-table { border: 1px solid black !important; color: black !important; width: 100% !important; }
          .print-table th, .print-table td { border: 1px solid black !important; color: black !important; padding: 8px !important; }
        }
      `}} />

      <div className="hidden print-header text-center space-y-2 mb-6 text-black relative flex items-center justify-center min-h-[80px] border-b-2 border-black pb-4">
        {isValidImageUrl(profil?.logoPemdaUrl) && (
          <img src={profil.logoPemdaUrl} alt="Logo Pemda" className="w-14 h-14 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block animate-fade-in" />
        )}
        <div className={`flex-1 text-center ${isValidImageUrl(profil?.logoPemdaUrl) ? 'pl-16' : ''} ${isValidImageUrl(profil?.logoSekolahUrl) ? 'pr-16' : ''}`}>
          <h2 className="text-[10px] font-bold uppercase tracking-wider leading-none">{profil?.pemerintah || 'Pemerintah Kabupaten Pati'}</h2>
          <h3 className="text-xs font-bold uppercase tracking-wider leading-none mt-1">{profil?.dinas || 'Dinas Pendidikan dan Kebudayaan'}</h3>
          <h3 className="text-base font-black uppercase tracking-wide leading-tight mt-1">{profil?.namaSekolah || 'SD Negeri Wedusan'}</h3>
          <p className="text-[10px] mt-1">Laporan Rekapitulasi Absensi {activeTab === 'siswa' ? 'Siswa' : 'Guru & Staf'} • {activeTab === 'siswa' ? `Kelas: ${getSelectedKelasNama()} • ` : ''}Periode: {activeTab === 'siswa' ? getSelectedBulanLabel() : guruBulan} • TA: {activeTab === 'siswa' ? getSelectedKelasTahun() : '2025/2026'}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase">Dicetak pada tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {isValidImageUrl(profil?.logoSekolahUrl) && (
          <img src={profil.logoSekolahUrl} alt="Logo Sekolah" className="w-14 h-14 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block animate-fade-in" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="text-violet-400" />
            Monitoring Kehadiran {activeTab === 'siswa' ? 'Siswa' : 'Guru & Staf'}
          </h1>
          <p className="text-slate-400 mt-1">Pantau rekapitulasi kehadiran dan cetak laporan absensi.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'siswa' && selectedKelasId && laporanRows.length > 0 && (
            <>
              {selectedBulan ? (
                <a href={`/bk/cetak/rekap-absensi?kelasId=${selectedKelasId}&bulan=${selectedBulan}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-violet-500 to-indigo-600 text-white rounded-xl font-semibold text-xs shadow-lg transition-all">
                  <Printer size={14} /> Cetak Rekap Bulanan
                </a>
              ) : (
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition-all">
                  <Printer size={14} /> Cetak Layar
                </button>
              )}
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all">
                <Download size={14} /> Ekspor CSV
              </button>
            </>
          )}
          {activeTab === 'guru' && guruLaporanRows.length > 0 && (
            <>
              <a href={`/bk/cetak/absensi-guru-harian?tanggal=${selectedTanggalGuru}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-violet-500 to-indigo-600 text-white rounded-xl font-semibold text-xs shadow-lg transition-all">
                <Printer size={14} /> Cetak Absen Harian
              </a>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition-all">
                <Printer size={14} /> Cetak Rekap Layar
              </button>
              <button onClick={handleExportGuruCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all">
                <Download size={14} /> Ekspor CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-2 w-full max-w-md no-print">
        <button onClick={() => setActiveTab('siswa')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'siswa' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
          <Users size={15} /> Absensi Siswa
        </button>
        <button onClick={() => setActiveTab('guru')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${activeTab === 'guru' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
          <Users size={15} /> Absensi Guru & Staf
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium no-print">
          {error}
        </div>
      )}

      {activeTab === 'siswa' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col lg:flex-row items-center justify-between gap-4 no-print">
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-semibold text-slate-300">Pilih Kelas:</label>
                <select value={selectedKelasId} onChange={(e) => setSelectedKelasId(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm">
                  {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-semibold text-slate-300">Pilih Bulan:</label>
                <input type="month" value={selectedBulan} onChange={(e) => setSelectedBulan(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm" />
              </div>
            </div>
          </div>

          {selectedKelasId && laporanRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 text-white print:text-black">
                <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400 no-print"><Users size={24} /></div>
                <div><p className="text-xs font-semibold text-slate-500">Total Siswa</p><h3 className="text-2xl font-black mt-1">{statistik.totalSiswa} Siswa</h3></div>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 text-white print:text-black">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 no-print"><Percent size={24} /></div>
                <div><p className="text-xs font-semibold text-slate-500">Rata-rata Kehadiran</p><h3 className="text-2xl font-black mt-1">{statistik.rataRataKehadiran}%</h3></div>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 text-white print:text-black">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 no-print"><CheckCircle size={24} /></div>
                <div><p className="text-xs font-semibold text-slate-500">Total Hari Efektif</p><h3 className="text-2xl font-black mt-1">{statistik.totalHariEfektif} Hari</h3></div>
              </div>
            </div>
          )}

          {!loading && laporanRows.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden print-table text-white print:text-black">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <th className="p-4 text-xs font-semibold uppercase">No</th>
                    <th className="p-4 text-xs font-semibold uppercase">NISN</th>
                    <th className="p-4 text-xs font-semibold uppercase">Nama Siswa</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Hadir</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Izin</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Sakit</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Alpa</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Total</th>
                    <th className="p-4 text-xs font-semibold uppercase text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {laporanRows.map((row, index) => (
                    <tr key={row.siswaId} className="border-t border-slate-800">
                      <td className="p-4 text-sm text-slate-500">{index + 1}</td>
                      <td className="p-4 text-sm font-semibold">{row.nisn}</td>
                      <td className="p-4 text-sm font-bold">{row.nama}</td>
                      <td className="p-4 text-sm font-bold text-center text-emerald-400">{row.hadir}</td>
                      <td className="p-4 text-sm font-bold text-center text-sky-400">{row.izin}</td>
                      <td className="p-4 text-sm font-bold text-center text-amber-400">{row.sakit}</td>
                      <td className="p-4 text-sm font-bold text-center text-rose-400">{row.alpa}</td>
                      <td className="p-4 text-sm font-medium text-center">{row.total}</td>
                      <td className="p-4 text-sm font-extrabold text-right text-violet-400">{row.persentase}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'guru' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-semibold text-slate-300">Pilih Bulan Rekap:</label>
                <input type="month" value={guruBulan} onChange={(e) => setGuruBulan(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm" />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-semibold text-slate-300">Tanggal Cetak Harian:</label>
                <input type="date" value={selectedTanggalGuru} onChange={(e) => setSelectedTanggalGuru(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm" />
              </div>
            </div>
          </div>
          {guruLaporanRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 text-white print:text-black">
                <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400 no-print"><Users size={24} /></div>
                <div><p className="text-xs font-semibold text-slate-500">Total Guru</p><h3 className="text-2xl font-black mt-1">{guruStatistik.totalGuru}</h3></div>
              </div>
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 text-white print:text-black">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 no-print"><CheckCircle size={24} /></div>
                <div><p className="text-xs font-semibold text-slate-500">Total Hari Kerja</p><h3 className="text-2xl font-black mt-1">{guruStatistik.totalHariKerja}</h3></div>
              </div>
            </div>
          )}
          {!loadingGuru && guruLaporanRows.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden print-table text-white print:text-black">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <th className="p-4 text-xs font-semibold uppercase">No</th>
                    <th className="p-4 text-xs font-semibold uppercase">Nama / NIP</th>
                    <th className="p-4 text-xs font-semibold uppercase">Pangkat / Golongan</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Hadir</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Izin</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Sakit</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Alpa</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center">Total</th>
                    <th className="p-4 text-xs font-semibold uppercase text-right">Persentase</th>
                    <th className="p-4 text-xs font-semibold uppercase text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {guruLaporanRows.map((row, index) => (
                    <tr key={row.guruId} className="border-t border-slate-800">
                      <td className="p-4 text-sm">{index + 1}</td>
                      <td className="p-4 text-sm font-bold">
                        <div>{row.nama}</div>
                        {row.nip && row.nip !== '-' && (
                          <div className="text-xs text-slate-400 font-mono font-normal mt-0.5">NIP. {row.nip}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        {row.pangkat !== '-' || row.golongan !== '-' ? (
                          <span>
                            {row.pangkat !== '-' ? row.pangkat : '-'} {row.golongan !== '-' ? `(${row.golongan})` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-emerald-400">{row.hadir}</td>
                      <td className="p-4 text-center font-bold text-sky-400">{row.izin}</td>
                      <td className="p-4 text-center font-bold text-amber-400">{row.sakit}</td>
                      <td className="p-4 text-center font-bold text-rose-400">{row.alpa}</td>
                      <td className="p-4 text-center font-medium">{row.total}</td>
                      <td className="p-4 text-right font-extrabold text-violet-400">{row.persentase}%</td>
                      <td className="p-4 text-center no-print">
                        <a 
                          href={`/bk/cetak/absensi-guru-bulanan?guruId=${row.guruId}&bulan=${guruBulan}`} 
                          target="_blank" 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
                        >
                          <Printer size={12} /> Cetak Kartu
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Kolom Tanda Tangan (Hanya Tampil Saat Cetak) */}
      <div className="hidden print:grid grid-cols-3 text-xs mt-12 text-black">
        <div className="col-span-2"></div>
        <div className="text-center">
          <p>{profil?.namaSekolah?.split(' ')[2] || 'Wedusan'}, {getLastWorkingDayOfMonth(activeTab === 'siswa' ? selectedBulan : guruBulan)}</p>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-[10px] text-slate-500">NIP. {profil.nipKepsek}</p>
          )}
        </div>
      </div>
    </div>
  );
}
