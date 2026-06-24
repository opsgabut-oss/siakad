'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, BookOpen, MapPin } from 'lucide-react';

interface Jadwal {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  kelas: { nama: string };
  mataPelajaran: { nama: string; kode: string };
}

const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

export default function JadwalMengajarPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/jadwal?my=true');
      if (!res.ok) {
        throw new Error('Gagal memuat jadwal mengajar');
      }
      const data = await res.json();
      setJadwalList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Group by hari
  const groupedJadwal = HARI_LIST.reduce((acc, hari) => {
    acc[hari] = jadwalList.filter((j) => j.hari === hari);
    return acc;
  }, {} as Record<string, Jadwal[]>);

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Header Halaman */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="text-indigo-400" size={24} />
            Jadwal Mengajar
          </h1>
          <p className="text-xs text-slate-400 mt-1">Daftar jadwal kelas mengajar Anda minggu ini.</p>
        </div>
        <button
          onClick={fetchJadwal}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          title="Segarkan Jadwal"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tampilan Error */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Tampilan Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <RefreshCw className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : jadwalList.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center my-auto">
          <Calendar className="mx-auto text-slate-650 mb-3" size={36} />
          <p className="text-slate-400 text-xs font-semibold">Anda belum memiliki jadwal mengajar terdaftar.</p>
          <p className="text-[10px] text-slate-500 mt-1">Hubungi Admin TU untuk mendaftarkan jadwal pelajaran.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {HARI_LIST.map((hari) => {
            const jadwalHari = groupedJadwal[hari] || [];
            if (jadwalHari.length === 0) return null; // Sembunyikan hari kosong

            return (
              <div key={hari} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                  <h3 className="font-extrabold text-xs tracking-wider text-slate-300 uppercase">{hari}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-850 text-indigo-400 font-bold">
                    {jadwalHari.length} Sesi
                  </span>
                </div>

                <div className="space-y-2.5">
                  {jadwalHari.map((j) => (
                    <div
                      key={j.id}
                      className="bg-slate-950/50 border border-slate-900 hover:border-slate-850 rounded-xl p-3 flex justify-between items-center transition-all"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-indigo-400 flex items-center gap-1">
                          <Clock size={11} />
                          {j.jamMulai} - {j.jamSelesai}
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">
                          {j.mataPelajaran.nama} ({j.mataPelajaran.kode})
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                          <MapPin size={10} className="text-slate-500" />
                          Ruang: {j.kelas.nama}
                        </div>
                      </div>
                      <div className="text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/10">
                        {j.kelas.nama}
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
  );
}
