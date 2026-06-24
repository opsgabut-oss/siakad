'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2, FileText, Printer, User } from 'lucide-react';

interface ModulAjar {
  id: string;
  judul: string;
  mataPelajaranId: string;
  kelasId: string | null;
  mataPelajaran: { nama: string; kode: string };
  kelas: { nama: string } | null;
  guru: { nama: string };
  updatedAt: string;
}

export default function KepsekModulAjarMonitoringPage() {
  const [modulList, setModulList] = useState<ModulAjar[]>([]);
  const [filteredList, setFilteredList] = useState<ModulAjar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModulAjar();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredList(modulList);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredList(
        modulList.filter(
          (m) =>
            m.judul.toLowerCase().includes(q) ||
            m.guru.nama.toLowerCase().includes(q) ||
            m.mataPelajaran.nama.toLowerCase().includes(q) ||
            (m.kelas && m.kelas.nama.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, modulList]);

  const fetchModulAjar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/guru/modul-ajar');
      if (!res.ok) throw new Error('Gagal memuat daftar modul ajar');
      const data = await res.json();
      setModulList(data);
      setFilteredList(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat modul ajar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-violet-400" />
            Supervisi Modul Ajar (RPP Plus)
          </h1>
          <p className="text-slate-400 mt-1">Supervisi rancangan pembelajaran (Modul Ajar) yang disusun oleh pendidik.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Pencarian */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
        <Search className="text-slate-500 shrink-0" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan judul, nama guru, mata pelajaran, atau kelas..."
          className="w-full bg-transparent border-0 text-white text-sm focus:outline-hidden focus:ring-0 placeholder-slate-600"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-violet-400" size={32} />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Tidak ada data modul ajar ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-800 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                  <span>{item.mataPelajaran.nama} {item.kelas ? `• ${item.kelas.nama}` : ''}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 line-clamp-2">{item.judul}</h4>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-405 font-bold pt-1">
                  <User size={13} className="text-slate-500" />
                  <span>Guru: {item.guru.nama}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-850/60 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                <span>
                  Update: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <a
                  href={`/cetak-modul?id=${item.id}`}
                  className="px-3 py-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Printer size={12} /> Pratinjau & Cetak
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
