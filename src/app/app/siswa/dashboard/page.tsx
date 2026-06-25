'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Calendar, BookOpen, Clock, Award, AlertCircle, CheckCircle2, FileText, User } from 'lucide-react';

interface SiswaData {
  nisn: string;
  nama: string;
  kelas: string;
  tahunAjaran: string;
}

interface StatistikAbsensi {
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALPA: number;
  TOTAL: number;
}

interface Jadwal {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mataPelajaran: { nama: string; kode: string };
  guru: { nama: string };
}

interface RekapNilai {
  mapelId: string;
  namaMapel: string;
  kodeMapel: string;
  harian1: number | string;
  harian2: number | string;
  harian3: number | string;
  harian4: number | string;
  harian5: number | string;
  harian6: number | string;
  uts: number | string;
  uas: number | string;
  rapor: number | string;
}

const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

export default function SiswaDashboard() {
  const [activeTab, setActiveTab] = useState<'absensi' | 'jadwal' | 'nilai'>('absensi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [siswa, setSiswa] = useState<SiswaData | null>(null);
  const [absensi, setAbsensi] = useState<StatistikAbsensi | null>(null);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [nilaiList, setNilaiList] = useState<RekapNilai[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/siswa/dashboard');
      if (!res.ok) {
        throw new Error('Gagal mengambil data portal');
      }
      const data = await res.json();
      setSiswa(data.siswa);
      setAbsensi(data.statistikAbsensi);
      setJadwalList(data.jadwal);
      setNilaiList(data.nilai);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 flex-1">
        <RefreshCw className="animate-spin text-indigo-400" size={28} />
      </div>
    );
  }

  if (error || !siswa || !absensi) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center my-auto space-y-4">
        <Award className="mx-auto text-rose-500" size={40} />
        <p className="text-slate-200 text-sm font-semibold">Gagal memuat portal akademik Anda.</p>
        <p className="text-xs text-slate-500">{error || 'Silakan coba beberapa saat lagi.'}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Hitung persentase kehadiran
  const persentaseHadir = absensi.TOTAL > 0 
    ? Math.round((absensi.HADIR / absensi.TOTAL) * 100) 
    : 0;

  // Group jadwal by day
  const groupedJadwal = HARI_LIST.reduce((acc, hari) => {
    acc[hari] = jadwalList.filter((j) => j.hari === hari);
    return acc;
  }, {} as Record<string, Jadwal[]>);

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Profil Banner Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-36 h-36 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
        <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg">
          <User size={24} />
        </div>
        <div className="text-center sm:text-left min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-100 truncate">{siswa.nama}</h2>
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-semibold">
            <span>NISN: {siswa.nisn}</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Kelas: {siswa.kelas}</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>TA: {siswa.tahunAjaran}</span>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all w-fit"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-1.5 flex gap-1">
        <button
          onClick={() => setActiveTab('absensi')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'absensi'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle size={14} />
          Kehadiran
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'jadwal'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar size={14} />
          Jadwal
        </button>
        <button
          onClick={() => setActiveTab('nilai')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'nilai'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={14} />
          Nilai Rapor
        </button>
      </div>

      {/* Tab Content Areas */}
      <div className="flex-1 flex flex-col">
        {/* TAB 1: ABSENSI */}
        {activeTab === 'absensi' && (
          <div className="space-y-6">
            {/* Visual Ring Donut / Progress */}
            <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500 transition-all duration-500 ease-in-out"
                    strokeDasharray={`${persentaseHadir}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{persentaseHadir}%</span>
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Hadir</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Persentase Kehadiran Kelas</h3>
                <p className="text-slate-500 text-xs mt-0.5">Dihitung dari total hari aktif belajar mengajar.</p>
              </div>
            </div>

            {/* Grid Kartu Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hadir</span>
                  <h4 className="text-lg font-black text-slate-200">{absensi.HADIR} Hari</h4>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Izin</span>
                  <h4 className="text-lg font-black text-slate-200">{absensi.IZIN} Hari</h4>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sakit</span>
                  <h4 className="text-lg font-black text-slate-200">{absensi.SAKIT} Hari</h4>
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alpa</span>
                  <h4 className="text-lg font-black text-slate-200">{absensi.ALPA} Hari</h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JADWAL */}
        {activeTab === 'jadwal' && (
          <div className="space-y-4">
            {jadwalList.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center my-auto">
                <Calendar className="mx-auto text-slate-650 mb-3" size={36} />
                <p className="text-slate-400 text-xs font-semibold">Jadwal pelajaran kelas belum diinput oleh Admin.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {HARI_LIST.map((hari) => {
                  const jadwalHari = groupedJadwal[hari] || [];
                  if (jadwalHari.length === 0) return null; // Sembunyikan hari kosong

                  return (
                    <div key={hari} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
                      <h4 className="font-extrabold text-xs tracking-wider text-slate-350 uppercase pb-2 border-b border-slate-800/60">
                        {hari}
                      </h4>
                      <div className="space-y-2.5">
                        {jadwalHari.map((j) => (
                          <div
                            key={j.id}
                            className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex justify-between items-center"
                          >
                            <div className="space-y-1">
                              <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                                <Clock size={11} />
                                {j.jamMulai} - {j.jamSelesai}
                              </div>
                              <h5 className="text-sm font-bold text-slate-250">
                                {j.mataPelajaran.nama} ({j.mataPelajaran.kode})
                              </h5>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                Guru: {j.guru.nama}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NILAI RAPOR */}
        {activeTab === 'nilai' && (
          <div className="space-y-4">
            {nilaiList.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center my-auto">
                <Award className="mx-auto text-slate-650 mb-3" size={36} />
                <p className="text-slate-400 text-xs font-semibold">Belum ada nilai pelajaran yang dirilis oleh Guru.</p>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-3">Mata Pelajaran</th>
                        <th className="p-3 text-center">H1</th>
                        <th className="p-3 text-center">H2</th>
                        <th className="p-3 text-center">H3</th>
                        <th className="p-3 text-center">H4</th>
                        <th className="p-3 text-center">H5</th>
                        <th className="p-3 text-center">H6</th>
                        <th className="p-3 text-center">UTS</th>
                        <th className="p-3 text-center">UAS</th>
                        <th className="p-3 text-right bg-indigo-950/10 text-indigo-400">Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {nilaiList.map((row) => (
                        <tr key={row.mapelId} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-3">
                            <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md mr-2">
                              {row.kodeMapel}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{row.namaMapel}</span>
                          </td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian1}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian2}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian3}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian4}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian5}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.harian6}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.uts}</td>
                          <td className="p-3 text-xs font-bold text-center text-slate-350">{row.uas}</td>
                          <td className="p-3 text-xs font-extrabold text-right bg-indigo-950/5 text-indigo-350">
                            {row.rapor}
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
    </div>
  );
}
