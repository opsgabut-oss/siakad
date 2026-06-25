'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, ArrowRightLeft, Users, CheckSquare, Square, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  nisn: string;
  nama: string;
}

interface Kelas {
  id: string;
  nama: string;
  tahunAjaran: { tahun: string; aktif: boolean };
}

export default function AdminKenaikanPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [sourceKelasId, setSourceKelasId] = useState('');
  const [targetKelasId, setTargetKelasId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [action, setAction] = useState<'PROMOTE' | 'GRADUATE'>('PROMOTE');

  // UI States
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchKelas();
  }, []);

  useEffect(() => {
    if (sourceKelasId) {
      fetchStudents(sourceKelasId);
    } else {
      setStudents([]);
      setSelectedSiswaIds([]);
    }
  }, [sourceKelasId]);

  const fetchKelas = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/kelas');
      if (!res.ok) throw new Error('Gagal memuat data kelas');
      const data = await res.json();
      setKelasList(data);
      if (data.length > 0) {
        setSourceKelasId(data[0].id);
        // Default target to second class if available
        if (data.length > 1) {
          setTargetKelasId(data[1].id);
        } else {
          setTargetKelasId('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data kelas');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchStudents = async (kelasId: string) => {
    setLoadingStudents(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/siswa');
      if (!res.ok) throw new Error('Gagal memuat data siswa');
      const data = await res.json();
      
      // Filter siswa based on selected class
      const filtered = data.filter((s: any) => s.kelasId === kelasId);
      setStudents(filtered);
      setSelectedSiswaIds(filtered.map((s: any) => s.id)); // Default to select all
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data siswa');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSiswaIds.length === students.length) {
      setSelectedSiswaIds([]);
    } else {
      setSelectedSiswaIds(students.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedSiswaIds.includes(id)) {
      setSelectedSiswaIds(selectedSiswaIds.filter((item) => item !== id));
    } else {
      setSelectedSiswaIds([...selectedSiswaIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSiswaIds.length === 0) {
      alert('Silakan pilih minimal satu siswa terlebih dahulu.');
      return;
    }

    if (action === 'PROMOTE' && !targetKelasId) {
      alert('Silakan tentukan kelas tujuan kenaikan kelas.');
      return;
    }

    if (action === 'PROMOTE' && sourceKelasId === targetKelasId) {
      alert('Kelas tujuan tidak boleh sama dengan kelas asal.');
      return;
    }

    const confirmMessage = action === 'GRADUATE' 
      ? `Apakah Anda yakin ingin MELULUSKAN ${selectedSiswaIds.length} siswa terpilih ke kelas Alumni?`
      : `Apakah Anda yakin ingin MEMINDAHKAN/MENAIKKAN ${selectedSiswaIds.length} siswa terpilih ke kelas tujuan?`;

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/siswa/promosi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaIds: selectedSiswaIds,
          targetKelasId: action === 'GRADUATE' ? null : targetKelasId,
          action
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memproses perubahan kelas');

      setSuccess(`✨ Berhasil memproses kenaikan kelas / kelulusan untuk ${selectedSiswaIds.length} siswa!`);
      fetchStudents(sourceKelasId);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses kenaikan kelas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 gap-3">
        <RefreshCw className="animate-spin text-indigo-400" size={24} />
        Memuat data konfigurasi kenaikan...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="text-indigo-400" size={32} />
          Kenaikan Kelas & Kelulusan Massal
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Pindahkan kelompok siswa secara massal ke kelas jenjang berikutnya atau nyatakan lulus (masuk ke kelas khusus Alumni).
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm flex items-start gap-2 animate-pulse">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
          <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri & Tengah: Kelas Asal & Daftar Siswa (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users size={18} className="text-indigo-400" />
              1. Pilih Kelas Asal & Siswa
            </h2>

            {/* Select Kelas Asal */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="text-sm font-semibold text-slate-350 whitespace-nowrap">Kelas Asal:</label>
              <select
                value={sourceKelasId}
                onChange={(e) => setSourceKelasId(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.tahunAjaran.tahun})
                  </option>
                ))}
              </select>
            </div>

            {/* List Siswa */}
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
              {loadingStudents ? (
                <div className="flex justify-center items-center py-16 text-slate-400 gap-2">
                  <RefreshCw className="animate-spin text-indigo-400" size={18} />
                  Memuat daftar siswa...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Tidak ada data siswa aktif di kelas asal ini.
                </div>
              ) : (
                <div>
                  {/* Select All Row */}
                  <div 
                    onClick={handleSelectAll}
                    className="flex items-center gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:bg-slate-900"
                  >
                    {selectedSiswaIds.length === students.length ? (
                      <CheckSquare className="text-indigo-400" size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                    <span>Pilih Semua Siswa ({selectedSiswaIds.length} / {students.length} Terpilih)</span>
                  </div>

                  {/* Student Rows */}
                  <div className="divide-y divide-slate-850 max-h-96 overflow-y-auto">
                    {students.map((s) => {
                      const isSelected = selectedSiswaIds.includes(s.id);
                      return (
                        <div 
                          key={s.id}
                          onClick={() => handleToggleSelect(s.id)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-900/30 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={isSelected ? 'text-indigo-400' : 'text-slate-600'}>
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-200">{s.nama}</h4>
                              <p className="text-[10px] font-mono text-slate-500">NISN: {s.nisn}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Aksi Kenaikan & Target (col-span-1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ArrowRightLeft size={18} className="text-indigo-400" />
              2. Tujuan & Tindakan
            </h2>

            {/* Aksi Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase block">Jenis Tindakan</label>
              <div className="grid grid-cols-2 bg-slate-950/80 p-1 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAction('PROMOTE')}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    action === 'PROMOTE' 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Naik Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setAction('GRADUATE')}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    action === 'GRADUATE' 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Kelulusan (Alumni)
                </button>
              </div>
            </div>

            {action === 'PROMOTE' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Select Kelas Tujuan */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-350 uppercase block">Kelas Tujuan Kenaikan</label>
                  <select
                    value={targetKelasId}
                    onChange={(e) => setTargetKelasId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="" disabled>-- Pilih Kelas Tujuan --</option>
                    {kelasList
                      .filter((k) => k.id !== sourceKelasId && k.nama !== 'Alumni')
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} ({k.tahunAjaran.tahun})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed flex gap-2">
                  <AlertCircle className="shrink-0 mt-0.5 text-indigo-400" size={14} />
                  <p>
                    Semua data absensi, nilai, dan rekap bimbingan siswa akan tetap tersimpan aman. Siswa hanya diubah tautan kelasnya saja.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="bg-amber-955/20 border border-amber-900/40 p-4 rounded-2xl text-xs text-amber-250 leading-relaxed flex gap-2">
                  <AlertCircle className="shrink-0 mt-0.5 text-amber-400" size={14} />
                  <p>
                    <strong>Tindakan Kelulusan:</strong> Seluruh siswa terpilih akan dipindahkan ke kelas khusus bernama <strong>"Alumni"</strong> di bawah Tahun Ajaran aktif.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={submitting || selectedSiswaIds.length === 0}
                className="w-full py-3 px-4 bg-linear-to-r from-indigo-500 to-violet-650 hover:from-indigo-650 hover:to-violet-700 text-white rounded-2xl font-bold text-xs hover:shadow-indigo-500/20 shadow-lg shadow-indigo-500/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses Perubahan...
                  </>
                ) : (
                  <>
                    <GraduationCap size={16} />
                    {action === 'GRADUATE' ? 'Proses Kelulusan Siswa' : 'Terapkan Kenaikan Kelas'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
