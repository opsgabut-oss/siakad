'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  X, 
  Calendar,
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';

interface Kelas {
  id: string;
  nama: string;
}

interface Mapel {
  id: string;
  nama: string;
  kode: string;
}

interface JurnalHarian {
  id: string;
  tanggal: string;
  kelasId: string;
  mataPelajaranId: string;
  materi: string;
  catatan: string | null;
  kelas: { nama: string };
  mataPelajaran: { nama: string; kode: string };
}

export default function GuruJurnalPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kelasId, setKelasId] = useState('');
  const [mataPelajaranId, setMataPelajaranId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [materi, setMateri] = useState('');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const resKelas = await fetch('/api/admin/kelas');
      const resMapel = await fetch('/api/admin/mapel');
      const resJurnal = await fetch('/api/guru/jurnal');

      if (!resKelas.ok) throw new Error('Gagal mengambil data kelas');
      if (!resMapel.ok) throw new Error('Gagal mengambil data mata pelajaran');
      if (!resJurnal.ok) throw new Error('Gagal mengambil data jurnal');

      const dataKelas = await resKelas.json();
      const dataMapel = await resMapel.json();
      const dataJurnal = await resJurnal.json();

      setKelasList(dataKelas);
      setMapelList(dataMapel);
      setJurnalList(dataJurnal);

      if (dataKelas.length > 0) setKelasId(dataKelas[0].id);
      if (dataMapel.length > 0) setMataPelajaranId(dataMapel[0].id);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setMateri('');
    setCatatan('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: JurnalHarian) => {
    setEditingId(item.id);
    setKelasId(item.kelasId);
    setMataPelajaranId(item.mataPelajaranId);
    setTanggal(new Date(item.tanggal).toISOString().split('T')[0]);
    setMateri(item.materi);
    setCatatan(item.catatan || '');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasId || !mataPelajaranId || !tanggal || !materi) {
      setError('Semua kolom wajib diisi');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = '/api/guru/jurnal';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, kelasId, mataPelajaranId, tanggal, materi, catatan }
        : { kelasId, mataPelajaranId, tanggal, materi, catatan };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan jurnal');

      setSuccess(editingId ? 'Jurnal mengajar berhasil diperbarui' : 'Jurnal mengajar berhasil ditambahkan');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan jurnal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurnal harian mengajar ini?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/guru/jurnal?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus jurnal');

      setSuccess('Jurnal harian mengajar berhasil dihapus');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus jurnal');
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 select-none">
            <BookOpen className="text-indigo-400" />
            Buku Jurnal Harian Mengajar
          </h1>
          <p className="text-slate-400 mt-1 text-xs">Catat agenda mengajar, materi pembelajaran, dan catatan kelas harian.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {jurnalList.length > 0 && (
            <a
              href="/guru/cetak-jurnal"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs transition-all w-full sm:w-auto justify-center"
            >
              <Printer size={14} />
              Cetak Jurnal
            </a>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus size={14} />
            Tambah Jurnal Harian
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs font-semibold select-none">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold select-none">
          {success}
        </div>
      )}

      {/* Jurnal List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
        </div>
      ) : jurnalList.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center my-auto">
          <FileText className="mx-auto text-slate-700 mb-3" size={36} />
          <p className="text-slate-450 text-xs font-semibold">Anda belum mencatat jurnal mengajar apa pun.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {jurnalList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-800 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{item.materi}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    {item.kelas.nama} • {item.mataPelajaran.nama} ({item.mataPelajaran.kode})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Edit Jurnal"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Jurnal"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {item.catatan && (
                <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-950 text-xs text-slate-400 leading-relaxed">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Catatan Kelas</span>
                  {item.catatan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BookOpen className="text-indigo-400" size={18} />
                {editingId ? 'Edit Jurnal Harian' : 'Tambah Jurnal Harian'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Kelas</label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mata Pelajaran</label>
                <select
                  value={mataPelajaranId}
                  onChange={(e) => setMataPelajaranId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Materi Pokok Pembelajaran</label>
                <input
                  type="text"
                  value={materi}
                  onChange={(e) => setMateri(e.target.value)}
                  placeholder="Misalnya: Penjumlahan Pecahan, Struktur Kalimat..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan / Kejadian Penting (Opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Andi tidak memperhatikan materi, kelas berisik..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-355 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-linear-to-r from-indigo-500 to-violet-650 hover:from-indigo-600 hover:to-violet-750 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : editingId ? 'Simpan Perubahan' : 'Catat Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
