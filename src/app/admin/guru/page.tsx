'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, User, Phone, Check } from 'lucide-react';

interface Guru {
  id: string;
  nip: string | null;
  nik: string | null;
  nama: string;
  kontak: string;
  user: {
    username: string;
  } | null;
  noAbsen: number | null;
  pangkat: string | null;
  golongan: string | null;
}

export default function AdminGuruPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [nip, setNip] = useState('');
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [noAbsen, setNoAbsen] = useState('');
  const [pangkat, setPangkat] = useState('');
  const [golongan, setGolongan] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGuru();
  }, []);

  const fetchGuru = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/guru');
      if (!res.ok) throw new Error('Gagal mengambil data guru');
      const data = await res.json();
      setGuruList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNip('');
    setNik('');
    setNama('');
    setKontak('');
    setNoAbsen('');
    setPangkat('');
    setGolongan('');
    setFormError('');
    setIsOpen(true);
  };

  const handleOpenEdit = (guru: Guru) => {
    setEditingId(guru.id);
    setNip(guru.nip || '');
    setNik(guru.nik || '');
    setNama(guru.nama);
    setKontak(guru.kontak);
    setNoAbsen(guru.noAbsen !== null && guru.noAbsen !== undefined ? guru.noAbsen.toString() : '');
    setPangkat(guru.pangkat || '');
    setGolongan(guru.golongan || '');
    setFormError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !kontak) {
      setFormError('Nama dan Kontak wajib diisi');
      return;
    }

    if (!nip && !nik) {
      setFormError('NIP atau NIK wajib diisi salah satu');
      return;
    }

    if (nip && (nip.length !== 18 || isNaN(Number(nip)))) {
      setFormError('NIP harus tepat 18 digit angka');
      return;
    }

    if (nik && (nik.length !== 16 || isNaN(Number(nik)))) {
      setFormError('NIK harus tepat 16 digit angka');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const url = editingId ? `/api/admin/guru/${editingId}` : '/api/admin/guru';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nip: nip || null, 
          nik: nik || null, 
          nama, 
          kontak,
          noAbsen: noAbsen || null,
          pangkat: pangkat || null,
          golongan: golongan || null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan data');
      }

      fetchGuru();
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus guru "${name}"? Akun user untuk guru ini juga akan terhapus otomatis.`)) {
      try {
        const res = await fetch(`/api/admin/guru/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Gagal menghapus data');
        }

        setGuruList(guruList.filter(g => g.id !== id));
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan');
      }
    }
  };

  // Filter Search
  const filteredGuru = guruList.filter(g =>
    g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.nip || '').includes(searchTerm) ||
    (g.nik || '').includes(searchTerm) ||
    (g.user?.username.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manajemen Data Guru</h1>
          <p className="text-slate-400 mt-1 text-sm">Kelola data kepegawaian guru dan pembuatan akun otomatis.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
        >
          <Plus size={16} />
          Tambah Guru Baru
        </button>
      </div>

      {/* Box Filter Pencarian */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 items-center gap-3 w-full max-w-md">
        <Search className="text-slate-500 shrink-0" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari guru berdasarkan nama, NIP, atau username..."
          className="bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-hidden w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Grid / Tabel Data Guru */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={24} />
            Memuat data guru...
          </div>
        ) : filteredGuru.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            Tidak ada data guru ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-4 text-center w-16">No. Urut</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Identitas (NIP / NIK)</th>
                  <th className="px-6 py-4">Pangkat / Golongan</th>
                  <th className="px-6 py-4">Kontak HP</th>
                  <th className="px-6 py-4">Username Akun</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm">
                {filteredGuru.map((guru) => (
                  <tr key={guru.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold font-mono text-indigo-400">
                      {guru.noAbsen !== null && guru.noAbsen !== undefined ? guru.noAbsen : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{guru.nama}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {guru.nip ? `${guru.nip} (NIP)` : guru.nik ? `${guru.nik} (NIK)` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {guru.pangkat || guru.golongan ? (
                        <span>
                          {guru.pangkat || '-'} {guru.golongan ? `(${guru.golongan})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{guru.kontak}</td>
                    <td className="px-6 py-4">
                      {guru.user ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/50 border border-slate-800 text-slate-300 text-xs font-medium">
                          <Check size={12} className="text-indigo-400" />
                          {guru.user.username}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs font-medium italic">Tidak ada akun</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(guru)}
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Edit Guru"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(guru.id, guru.nama)}
                          className="p-2 text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Guru */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h2>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-3 py-2 rounded-xl text-xs">
                  ⚠️ {formError}
                </div>
              )}

              {/* No Urut / Absen */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  No. Urut Absensi (Opsional)
                </label>
                <input
                  type="text"
                  value={noAbsen}
                  onChange={(e) => setNoAbsen(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan nomor urut guru (contoh: 1)..."
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* NIP */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  NIP (18 Digit - Opsional)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan NIP (jika PNS)..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* NIK */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  NIK (16 Digit - Opsional)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan NIK KTP..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Pangkat */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Pangkat (Opsional)
                </label>
                <input
                  type="text"
                  value={pangkat}
                  onChange={(e) => setPangkat(e.target.value)}
                  placeholder="Contoh: Pembina, Penata, Pembina Utama Muda..."
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Golongan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Golongan (Opsional)
                </label>
                <input
                  type="text"
                  value={golongan}
                  onChange={(e) => setGolongan(e.target.value)}
                  placeholder="Contoh: IV/a, III/b, III/c..."
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Nama */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Nama Lengkap & Gelar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Kontak */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Kontak HP / WA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                  <p className="text-[10px] text-indigo-400 font-medium leading-relaxed">
                    💡 <strong>Informasi Akun:</strong> Akun guru/staf akan dibuat otomatis. Username menggunakan **NIP** (atau **NIK** jika NIP kosong) sebagai kredensial login, dan password default disetel sebagai <strong>guru123</strong>.
                  </p>
                </div>
              )}

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
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Guru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
