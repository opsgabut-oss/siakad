'use client';

import { useState, useEffect } from 'react';
import { School, UserPlus, X, Loader2, Award, User, RefreshCw, AlertCircle } from 'lucide-react';

interface Guru {
  id: string;
  nama: string;
  nip: string;
}

interface Kelas {
  id: string;
  nama: string;
  tahunAjaran: {
    tahun: string;
    aktif: boolean;
  };
  waliKelasId: string | null;
  waliKelas: Guru | null;
}

export default function AdminKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [selectedGuruId, setSelectedGuruId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchKelas();
    fetchGuru();
  }, []);

  const fetchKelas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kelas');
      if (!res.ok) throw new Error('Gagal mengambil data kelas');
      const data = await res.json();
      setKelasList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuru = async () => {
    try {
      const res = await fetch('/api/admin/guru');
      if (!res.ok) throw new Error('Gagal mengambil data guru');
      const data = await res.json();
      setGuruList(data);
    } catch (err: any) {
      console.error('Error fetching guru:', err);
    }
  };

  const handleOpenAssign = (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setSelectedGuruId(kelas.waliKelasId || '');
    setFormError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedKelas(null);
    setSelectedGuruId('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelas) return;

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/admin/kelas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelasId: selectedKelas.id,
          waliKelasId: selectedGuruId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengatur Wali Kelas');
      }

      fetchKelas(); // Refresh data
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <School className="text-indigo-400" />
          Manajemen Kelas & Wali Kelas
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Kelola kelas sekolah (Kelas 1 - Kelas 6) dan tugaskan Guru sebagai Wali Kelas (Homeroom Teacher).
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Grid Kelas Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={24} />
          Memuat data kelas...
        </div>
      ) : kelasList.length === 0 ? (
        <div className="text-center p-12 text-slate-500 text-sm">
          Tidak ada data kelas ditemukan. Hubungi database administrator.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelasList.map((kelas) => (
            <div 
              key={kelas.id} 
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/50 group"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {kelas.nama}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tahun Ajaran: {kelas.tahunAjaran.tahun}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  kelas.tahunAjaran.aktif 
                    ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400' 
                    : 'bg-slate-950 border border-slate-850 text-slate-500'
                }`}>
                  {kelas.tahunAjaran.aktif ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>

              {/* Status Wali Kelas */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <Award size={14} className="text-indigo-400" />
                  Wali Kelas
                </div>
                
                {kelas.waliKelas ? (
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{kelas.waliKelas.nama}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">NIP: {kelas.waliKelas.nip}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Belum ada Wali Kelas ditugaskan</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-850 flex justify-end">
                <button
                  onClick={() => handleOpenAssign(kelas)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={14} />
                  {kelas.waliKelas ? 'Ubah Wali Kelas' : 'Tentukan Wali Kelas'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Assign Wali Kelas */}
      {isOpen && selectedKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Atur Wali Kelas</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{selectedKelas.nama} • TA {selectedKelas.tahunAjaran.tahun}</p>
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-3 py-2 rounded-xl text-xs flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>⚠️ {formError}</span>
                </div>
              )}

              <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-2xl text-xs text-indigo-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle size={12} />
                  Aturan Jabatan Wali Kelas
                </p>
                <p className="leading-relaxed">
                  Setiap guru hanya dapat menjadi Wali Kelas untuk <strong>satu kelas saja</strong>. Jika Anda memilih guru yang sudah memimpin kelas lain, jabatannya di kelas sebelumnya akan otomatis dilepas.
                </p>
              </div>

              {/* Guru Select Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Pilih Guru Wali Kelas
                </label>
                <div className="relative">
                  <select
                    value={selectedGuruId}
                    onChange={(e) => setSelectedGuruId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Tanpa Wali Kelas / Lepaskan Jabatan --</option>
                    {guruList.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.nama} (NIP: {g.nip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold select-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
