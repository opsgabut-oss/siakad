'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw, BarChart3, Users, Percent, CheckCircle, GraduationCap } from 'lucide-react';

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

export default function LaporanAbsensiPage() {
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru'>('siswa');

  // Laporan Siswa State
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');
  const [laporanRows, setLaporanRows] = useState<LaporanAbsensiRow[]>([]);
  const [statistik, setStatistik] = useState({
    totalSiswa: 0,
    rataRataKehadiran: 0,
    totalHadir: 0,
    totalHariEfektif: 0,
  });

  // Laporan Guru State
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

  useEffect(() => {
    fetchKelas();
  }, []);

  useEffect(() => {
    if (selectedKelasId && activeTab === 'siswa') {
      fetchLaporanData(selectedKelasId);
    }
  }, [selectedKelasId, activeTab]);

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

  const fetchLaporanData = async (kelasId: string) => {
    setLoading(true);
    setError('');
    try {
      const resRekap = await fetch(`/api/admin/laporan/rekap?kelasId=${kelasId}`);
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
    window.open(`/api/admin/laporan/absensi?kelasId=${selectedKelasId}`, '_blank');
  };

  const handleExportGuruCSV = () => {
    if (guruLaporanRows.length === 0) return;
    
    let csvContent = "\uFEFF"; // BOM UTF-8
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

  if (loadingConfig) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tab Navigasi Utama */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-2 w-full max-w-md">
        <button
          onClick={() => setActiveTab('siswa')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'siswa'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap size={15} />
          Absensi Siswa
        </button>
        <button
          onClick={() => setActiveTab('guru')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'guru'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          Absensi Guru & Staf
        </button>
      </div>

      {/* ==================== TAB: LAPORAN SISWA ==================== */}
      {activeTab === 'siswa' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Laporan Siswa */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <FileSpreadsheet className="text-indigo-400" />
                Laporan Absensi Siswa
              </h1>
              <p className="text-slate-400 mt-1">Pantau rekapitulasi kehadiran dan unduh laporan kelas.</p>
            </div>
            {selectedKelasId && laporanRows.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer"
              >
                <Download size={16} />
                Ekspor Laporan (CSV)
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-955/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Filter Siswa */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Pilih Kelas:</label>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            {selectedKelasId && (
              <button
                onClick={() => fetchLaporanData(selectedKelasId)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Segarkan Rekap
              </button>
            )}
          </div>

          {/* Statistik Siswa */}
          {selectedKelasId && laporanRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa</p>
                  <h3 className="text-2xl font-black text-white mt-1">{statistik.totalSiswa} Siswa</h3>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Percent size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Kehadiran</p>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{statistik.rataRataKehadiran}%</h3>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Hari Efektif</p>
                  <h3 className="text-2xl font-black text-white mt-1">{statistik.totalHariEfektif} Hari Absensi</h3>
                </div>
              </div>
            </div>
          )}

          {/* Tabel Laporan Siswa */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : !selectedKelasId ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
              <FileSpreadsheet className="mx-auto text-slate-600 mb-3" size={40} />
              <p className="text-slate-400 text-sm font-medium">Silakan tambahkan data kelas dan siswa terlebih dahulu.</p>
            </div>
          ) : laporanRows.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
              <BarChart3 className="mx-auto text-slate-600 mb-3" size={40} />
              <p className="text-slate-400 text-sm font-medium">Belum ada riwayat absensi untuk kelas ini.</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">No</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">NISN</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Siswa</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-emerald-950/10 text-emerald-400">Hadir</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-sky-950/10 text-sky-400">Izin</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-amber-950/10 text-amber-450">Sakit</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-rose-950/10 text-rose-450">Alpa</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Total Hari</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {laporanRows.map((row, index) => (
                      <tr key={row.siswaId} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-sm text-slate-500 font-medium">{index + 1}</td>
                        <td className="p-4 text-sm font-semibold text-slate-400">{row.nisn}</td>
                        <td className="p-4 text-sm font-bold text-slate-200">{row.nama}</td>
                        <td className="p-4 text-sm font-bold text-center text-emerald-400 bg-emerald-950/5">{row.hadir}</td>
                        <td className="p-4 text-sm font-bold text-center text-sky-400 bg-sky-950/5">{row.izin}</td>
                        <td className="p-4 text-sm font-bold text-center text-amber-400 bg-amber-950/5">{row.sakit}</td>
                        <td className="p-4 text-sm font-bold text-center text-rose-400 bg-rose-950/5">{row.alpa}</td>
                        <td className="p-4 text-sm font-medium text-center text-slate-300">{row.total}</td>
                        <td className="p-4 text-sm font-extrabold text-right text-indigo-400">
                          {row.persentase}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: LAPORAN GURU ==================== */}
      {activeTab === 'guru' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Laporan Guru */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <FileSpreadsheet className="text-indigo-400" />
                Laporan Absensi Guru & Staf
              </h1>
              <p className="text-slate-400 mt-1">Pantau rekapitulasi kehadiran mandiri pendidik dan tenaga kependidikan.</p>
            </div>
            {guruLaporanRows.length > 0 && (
              <button
                onClick={handleExportGuruCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer"
              >
                <Download size={16} />
                Ekspor Laporan (CSV)
              </button>
            )}
          </div>

          {errorGuru && (
            <div className="p-4 bg-rose-955/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
              {errorGuru}
            </div>
          )}

          {/* Filter Bulan */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Pilih Bulan Rekap:</label>
              <input
                type="month"
                value={guruBulan}
                onChange={(e) => setGuruBulan(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>
            <button
              onClick={() => fetchGuruLaporanData(guruBulan)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto cursor-pointer"
            >
              <RefreshCw size={16} className={loadingGuru ? 'animate-spin' : ''} />
              Segarkan Rekap
            </button>
          </div>

          {/* Statistik Guru */}
          {guruLaporanRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Guru & Staf</p>
                  <h3 className="text-2xl font-black text-white mt-1">{guruStatistik.totalGuru} Orang</h3>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Hari Efektif Kerja</p>
                  <h3 className="text-2xl font-black text-white mt-1">{guruStatistik.totalHariKerja} Hari KBM</h3>
                </div>
              </div>
            </div>
          )}

          {/* Tabel Laporan Guru */}
          {loadingGuru ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : guruLaporanRows.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
              <BarChart3 className="mx-auto text-slate-650 mb-3" size={40} />
              <p className="text-slate-400 text-sm font-medium">Belum ada riwayat absensi guru untuk periode ini.</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">No</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Lengkap</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">NIP / NIK</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-emerald-950/10 text-emerald-400">Hadir</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-sky-950/10 text-sky-400">Izin</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-amber-950/10 text-amber-450">Sakit</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center bg-rose-950/10 text-rose-450">Alpa / Bolos</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Total Hari</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {guruLaporanRows.map((row, index) => (
                      <tr key={row.guruId} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4 text-sm text-slate-500 font-medium">{index + 1}</td>
                        <td className="p-4 text-sm font-bold text-slate-200">{row.nama}</td>
                        <td className="p-4 text-sm font-semibold text-slate-400">
                          {row.nip !== '-' ? `${row.nip} (NIP)` : row.nik !== '-' ? `${row.nik} (NIK)` : '-'}
                        </td>
                        <td className="p-4 text-sm font-bold text-center text-emerald-400 bg-emerald-950/5">{row.hadir}</td>
                        <td className="p-4 text-sm font-bold text-center text-sky-400 bg-sky-950/5">{row.izin}</td>
                        <td className="p-4 text-sm font-bold text-center text-amber-400 bg-amber-950/5">{row.sakit}</td>
                        <td className="p-4 text-sm font-bold text-center text-rose-400 bg-rose-955/5">{row.alpa}</td>
                        <td className="p-4 text-sm font-medium text-center text-slate-350">{row.total}</td>
                        <td className="p-4 text-sm font-extrabold text-right text-indigo-400">
                          {row.persentase}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
