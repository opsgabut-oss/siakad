'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2, Calendar, User, FileText, Printer } from 'lucide-react';

interface Kelas {
  id: string;
  nama: string;
}

interface JurnalHarian {
  id: string;
  tanggal: string;
  materi: string;
  catatan: string | null;
  kelas: { nama: string };
  guru: { nama: string };
  mataPelajaran: { nama: string; kode: string };
}

export default function KepsekJurnalMonitoringPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [jurnalList, setJurnalList] = useState<JurnalHarian[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchJurnalData();
  }, [selectedKelasId, selectedDate]);

  const fetchConfig = async () => {
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
      setError(err.message || 'Gagal memuat konfigurasi kelas');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchJurnalData = async () => {
    if (!selectedKelasId) return;
    setLoading(true);
    setError('');
    try {
      let url = `/api/guru/jurnal?kelasId=${selectedKelasId}`;
      if (selectedDate) {
        url += `&tanggal=${selectedDate}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat catatan jurnal mengajar');
      const data = await res.json();
      setJurnalList(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jurnal mengajar');
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
            <BookOpen className="text-violet-400" />
            Monitoring Jurnal Mengajar Harian
          </h1>
          <p className="text-slate-400 mt-1">Supervisi catatan materi dan aktivitas ajar Guru secara berkala.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Filter / Pemilihan Kelas & Tanggal */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
          <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">Filter Tanggal (Opsional)</label>
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 transition-colors"
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate('')}
                className="absolute right-3 text-xs text-slate-500 hover:text-slate-350 font-bold uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Jurnal View List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-violet-400" size={32} />
        </div>
      ) : jurnalList.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Belum ada jurnal mengajar dicatat untuk filter ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jurnalList.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700/50 transition-all shadow-md space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{item.materi}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
                    Mapel: {item.mataPelajaran.nama} ({item.mataPelajaran.kode}) • Kelas: {item.kelas.nama}
                  </p>
                </div>
                <span className="bg-slate-950/60 border border-slate-850 px-3 py-1.5 rounded-full text-[10px] text-violet-400 font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
                  <User size={10} />
                  {item.guru.nama}
                </span>
              </div>

              {item.catatan && (
                <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/40 text-sm text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Catatan Kejadian Kelas</span>
                  {item.catatan}
                </div>
              )}

              <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                <Calendar size={12} />
                Tanggal Ajar: {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
