'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit2, X, RefreshCw, Search } from 'lucide-react';

interface Mapel {
  id: string;
  nama: string;
  kode: string;
}

export default function MataPelajaranPage() {
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);
  const [formData, setFormData] = useState({ nama: '', kode: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMapel();
  }, []);

  const fetchMapel = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/mapel');
      if (!res.ok) {
        throw new Error('Gagal memuat mata pelajaran');
      }
      const data = await res.json();
      setMapelList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMapel(null);
    setFormData({ nama: '', kode: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mapel: Mapel) => {
    setEditingMapel(mapel);
    setFormData({ nama: mapel.nama, kode: mapel.kode });
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/mapel?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus mata pelajaran');
      }

      setSuccess('Mata pelajaran berhasil dihapus!');
      fetchMapel();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus mata pelajaran');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const url = '/api/admin/mapel';
    const method = editingMapel ? 'PUT' : 'POST';
    const body = editingMapel
      ? { id: editingMapel.id, ...formData }
      : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan mata pelajaran');
      }

      setSuccess(editingMapel ? 'Mata pelajaran berhasil diperbarui!' : 'Mata pelajaran berhasil ditambahkan!');
      setIsModalOpen(false);
      fetchMapel();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan mata pelajaran');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMapel = mapelList.filter((m) =>
    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.kode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" />
            Manajemen Mata Pelajaran
          </h1>
          <p className="text-slate-400 mt-1">Kelola seluruh mata pelajaran kurikulum sekolah.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all duration-200"
        >
          <Plus size={16} />
          Tambah Mapel
        </button>
      </div>

      {/* Alert Notifikasi */}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-sm font-medium animate-pulse">
          {success}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Kontrol Pencarian & Reload */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau kode mapel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500 transition-all duration-200"
          />
        </div>
        <button
          onClick={fetchMapel}
          className="flex items-center justify-center p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          title="Reload Data"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid / Tabel Tampilan */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-indigo-400" size={32} />
        </div>
      ) : filteredMapel.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <BookOpen className="mx-auto text-slate-600 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Tidak ada data mata pelajaran ditemukan.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Kode Mapel</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Mata Pelajaran</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredMapel.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 text-sm font-bold text-indigo-400">{m.kode}</td>
                    <td className="p-4 text-sm font-semibold text-slate-200">{m.nama}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-2 bg-slate-800/40 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.nama)}
                          className="p-2 bg-slate-800/40 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-indigo-400" size={20} />
              {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
            </h2>

            {error && (
              <div className="p-3 mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Kode Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: MTK, IND, IPA"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                  disabled={submitting}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-hidden focus:border-indigo-500 transition-all uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-hidden focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
