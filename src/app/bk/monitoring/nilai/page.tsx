'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Search, Loader2, BookOpen, AlertCircle, FileText, Printer } from 'lucide-react';

interface Kelas {
  id: string;
  nama: string;
}

interface Mapel {
  id: string;
  nama: string;
  kode: string;
}

interface SiswaNilai {
  siswaId: string;
  nisn: string;
  nama: string;
  harian1: number | null;
  harian2: number | null;
  harian3: number | null;
  harian4: number | null;
  harian5: number | null;
  harian6: number | null;
  uts: number | null;
  uas: number | null;
  rapor: number | null;
}

export default function KepsekNilaiMonitoringPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedMapelId, setSelectedMapelId] = useState('');
  
  const [nilaiRows, setNilaiRows] = useState<SiswaNilai[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [selectedKelasId, selectedMapelId]);

  const fetchConfigs = async () => {
    setLoadingConfig(true);
    try {
      const resKelas = await fetch('/api/admin/kelas');
      const resMapel = await fetch('/api/admin/mapel');

      if (!resKelas.ok) throw new Error('Gagal mengambil data kelas');
      if (!resMapel.ok) throw new Error('Gagal mengambil data mata pelajaran');

      const dataKelas = await resKelas.json();
      const dataMapel = await resMapel.json();

      setKelasList(dataKelas);
      setMapelList(dataMapel);

      if (dataKelas.length > 0) setSelectedKelasId(dataKelas[0].id);
      if (dataMapel.length > 0) setSelectedMapelId(dataMapel[0].id);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat konfigurasi');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchGrades = async () => {
    if (!selectedKelasId || !selectedMapelId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/nilai?kelasId=${selectedKelasId}&mataPelajaranId=${selectedMapelId}`);
      if (!res.ok) throw new Error('Gagal memuat rekapitulasi nilai');
      const data = await res.json();
      setNilaiRows(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };



  if (loadingConfig) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-violet-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="text-violet-400" />
            Monitoring Nilai Pembelajaran Siswa
          </h1>
          <p className="text-slate-400 mt-1">Supervisi nilai Tugas, UTS, dan UAS siswa secara berkala.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filter / Pemilihan Kelas & Mapel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">Pilih Kelas</label>
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 transition-colors"
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">Mata Pelajaran</label>
          <select
            value={selectedMapelId}
            onChange={(e) => setSelectedMapelId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 transition-colors"
          >
            {mapelList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama} ({m.kode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Rekap Nilai */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-violet-400" size={32} />
        </div>
      ) : nilaiRows.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Belum ada siswa terdaftar atau data nilai untuk filter ini.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">H1</th>
                  <th className="p-3 text-center">H2</th>
                  <th className="p-3 text-center">H3</th>
                  <th className="p-3 text-center">H4</th>
                  <th className="p-3 text-center">H5</th>
                  <th className="p-3 text-center">H6</th>
                  <th className="p-3 text-center">UTS</th>
                  <th className="p-3 text-center">UAS</th>
                  <th className="p-3 text-right bg-violet-950/10 text-violet-400">Nilai Rapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {nilaiRows.map((row) => {
                  return (
                    <tr key={row.siswaId} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3">
                        <h4 className="font-bold text-slate-200">{row.nama}</h4>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">NISN: {row.nisn}</p>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian1 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian2 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian3 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian4 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian5 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.harian6 ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.uts ?? '-'}</td>
                      <td className="p-3 text-center font-semibold text-slate-350">{row.uas ?? '-'}</td>
                      <td className="p-3 text-right font-extrabold bg-violet-950/5 text-violet-350">
                        {row.rapor ?? '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
