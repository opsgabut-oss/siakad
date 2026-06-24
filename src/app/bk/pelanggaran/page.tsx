'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle,
  X
} from 'lucide-react';

interface Siswa {
  id: string;
  nama: string;
  nisn: string;
  kelas: { nama: string };
}

interface PelanggaranSiswa {
  id: string;
  siswaId: string;
  tanggal: string;
  namaPelanggaran: string;
  poin: number;
  keterangan: string;
  dilaporkanOleh: string;
  siswa: {
    nama: string;
    nisn: string;
    kelas: { nama: string };
  };
}

export default function BKPelanggaranPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [pelanggaranList, setPelanggaranList] = useState<PelanggaranSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [namaPelanggaran, setNamaPelanggaran] = useState('');
  const [poin, setPoin] = useState('5');
  const [keterangan, setKeterangan] = useState('');
  const [dilaporkanOleh, setDilaporkanOleh] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch siswa list
      const resSiswa = await fetch('/api/admin/siswa');
      if (!resSiswa.ok) throw new Error('Gagal mengambil data siswa');
      const dataSiswa = await resSiswa.json();
      setSiswaList(dataSiswa);

      // Fetch pelanggaran list
      const resPelanggaran = await fetch('/api/bk/pelanggaran');
      if (!resPelanggaran.ok) throw new Error('Gagal mengambil data pelanggaran');
      const dataPelanggaran = await resPelanggaran.json();
      setPelanggaranList(dataPelanggaran);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setSiswaId(siswaList[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setNamaPelanggaran('');
    setPoin('5');
    setKeterangan('');
    setDilaporkanOleh('Guru Piket');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: PelanggaranSiswa) => {
    setEditingId(item.id);
    setSiswaId(item.siswaId);
    setTanggal(new Date(item.tanggal).toISOString().split('T')[0]);
    setNamaPelanggaran(item.namaPelanggaran);
    setPoin(item.poin.toString());
    setKeterangan(item.keterangan);
    setDilaporkanOleh(item.dilaporkanOleh);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || !tanggal || !namaPelanggaran || !poin || !keterangan || !dilaporkanOleh) {
      setError('Semua kolom wajib diisi');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = '/api/bk/pelanggaran';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, siswaId, tanggal, namaPelanggaran, poin: parseInt(poin, 10), keterangan, dilaporkanOleh }
        : { siswaId, tanggal, namaPelanggaran, poin: parseInt(poin, 10), keterangan, dilaporkanOleh };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal memproses data');

      setSuccess(editingId ? 'Data pelanggaran berhasil diperbarui' : 'Pelanggaran siswa berhasil ditambahkan');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/bk/pelanggaran?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus data');
      
      setSuccess('Pelanggaran siswa berhasil dihapus');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data');
    }
  };

  const filteredPelanggaran = pelanggaranList.filter((item) =>
    item.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.namaPelanggaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.siswa.kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="text-rose-400" />
            Poin Pelanggaran Siswa
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="text-emerald-400 shrink-0" size={16} />
            Data Kasus Terenkripsi AES-256 (Tingkat Database)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Catat Pelanggaran
        </button>
      </div>

      {/* Success/Error Notifications */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-sm font-medium">
          {success}
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
        <Search className="text-slate-500 shrink-0" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama siswa, kelas, atau jenis pelanggaran..."
          className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-hidden"
        />
      </div>

      {/* Table/List View */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-rose-400" size={32} />
        </div>
      ) : filteredPelanggaran.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <ShieldAlert className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Belum ada catatan pelanggaran siswa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPelanggaran.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700/50 transition-all shadow-md space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{item.siswa.nama}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
                    Kelas: {item.siswa.kelas.nama} • NISN: {item.siswa.nisn}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-950/40 border border-rose-800/65 text-rose-400 px-3 py-1.5 rounded-full text-xs font-black">
                    +{item.poin} Poin
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/40 text-sm space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pelanggaran</span>
                  <p className="text-slate-200 font-semibold">{item.namaPelanggaran}</p>
                </div>
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Keterangan Tambahan (Terenkripsi)</span>
                  <p className="text-slate-300 leading-relaxed mt-0.5">{item.keterangan}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-semibold">
                <div className="flex flex-col text-slate-500">
                  <span>Tanggal: {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="text-[10px] text-slate-600 mt-0.5">Dilaporkan Oleh: {item.dilaporkanOleh}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Edit Pelanggaran"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Pelanggaran"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-rose-400" />
                {editingId ? 'Edit Catatan Pelanggaran' : 'Catat Pelanggaran Siswa'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Select Siswa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Siswa</label>
                <select
                  value={siswaId}
                  onChange={(e) => setSiswaId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500 disabled:opacity-50"
                >
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas.nama})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tanggal Kejadian</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sanksi Poin</label>
                  <select
                    value={poin}
                    onChange={(e) => setPoin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="2">2 Poin (Pelanggaran Ringan - Rambut panjang/Baju tidak rapi)</option>
                    <option value="5">5 Poin (Ringan-Sedang - Terlambat masuk sekolah)</option>
                    <option value="10">10 Poin (Sedang - Bolos mata pelajaran/keluar gerbang)</option>
                    <option value="25">25 Poin (Berat - Merokok/Berkelahi/Perundungan)</option>
                    <option value="50">50 Poin (Sangat Berat - Narkoba/Mencuri)</option>
                  </select>
                </div>
              </div>

              {/* Pelanggaran */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jenis Pelanggaran</label>
                <input
                  type="text"
                  value={namaPelanggaran}
                  onChange={(e) => setNamaPelanggaran(e.target.value)}
                  placeholder="Misalnya: Terlambat masuk sekolah, atribut tidak lengkap..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kronologi / Keterangan Kasus (Terenkripsi)</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Deskripsi rinci mengenai kronologi kejadian pelanggaran..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              {/* Dilaporkan Oleh */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dilaporkan Oleh</label>
                <input
                  type="text"
                  value={dilaporkanOleh}
                  onChange={(e) => setDilaporkanOleh(e.target.value)}
                  placeholder="Nama guru piket, wali kelas, atau saksi..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-linear-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pelanggaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
