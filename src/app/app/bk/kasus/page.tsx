'use client';

import { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Search, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  X
} from 'lucide-react';

interface Siswa {
  id: string;
  nama: string;
  nisn: string;
  kelas: { nama: string };
}

interface CatatanBK {
  id: string;
  siswaId: string;
  tanggal: string;
  kategori: string;
  permasalahan: string;
  tindakan: string;
  status: string;
  siswa: {
    nama: string;
    nisn: string;
    kelas: { nama: string };
  };
}

export default function BKKasusPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kasusList, setKasusList] = useState<CatatanBK[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('Bimbingan Pribadi');
  const [permasalahan, setPermasalahan] = useState('');
  const [tindakan, setTindakan] = useState('');
  const [status, setStatus] = useState('Proses Tindak Lanjut');

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

      // Fetch kasus BK list
      const resKasus = await fetch('/api/bk/kasus');
      if (!resKasus.ok) throw new Error('Gagal mengambil catatan BK');
      const dataKasus = await resKasus.json();
      setKasusList(dataKasus);
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
    setKategori('Bimbingan Pribadi');
    setPermasalahan('');
    setTindakan('');
    setStatus('Proses Tindak Lanjut');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: CatatanBK) => {
    setEditingId(item.id);
    setSiswaId(item.siswaId);
    setTanggal(new Date(item.tanggal).toISOString().split('T')[0]);
    setKategori(item.kategori);
    setPermasalahan(item.permasalahan);
    setTindakan(item.tindakan);
    setStatus(item.status);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || !tanggal || !kategori || !permasalahan || !tindakan || !status) {
      setError('Semua kolom wajib diisi');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = '/api/bk/kasus';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, siswaId, tanggal, kategori, permasalahan, tindakan, status }
        : { siswaId, tanggal, kategori, permasalahan, tindakan, status };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal memproses data');

      setSuccess(editingId ? 'Catatan BK berhasil diperbarui' : 'Catatan BK berhasil ditambahkan');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan konseling ini?')) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/bk/kasus?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus data');
      
      setSuccess('Catatan BK berhasil dihapus');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data');
    }
  };

  const filteredKasus = kasusList.filter((item) =>
    item.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.siswa.kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <HeartHandshake className="text-violet-400" />
            Catatan Bimbingan & Konseling
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="text-emerald-400 shrink-0" size={16} />
            Data Sensitif Terenkripsi AES-256 (Tingkat Database)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Tambah Catatan BK
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
          placeholder="Cari berdasarkan nama siswa, kelas, atau kategori bimbingan..."
          className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-hidden"
        />
      </div>

      {/* Table/List View */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-violet-400" size={32} />
        </div>
      ) : filteredKasus.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <HeartHandshake className="mx-auto text-slate-700 mb-3" size={40} />
          <p className="text-slate-400 text-sm font-medium">Belum ada catatan bimbingan yang sesuai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredKasus.map((item) => (
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
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'Selesai' 
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400' 
                      : 'bg-amber-950/40 border border-amber-800/60 text-amber-400'
                  }`}>
                    {item.status}
                  </span>
                  <span className="bg-slate-950/50 border border-slate-850 px-2.5 py-1 rounded-full text-[10px] text-slate-400 font-semibold uppercase">
                    {item.kategori}
                  </span>
                </div>
              </div>

              {/* Data Terenkripsi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 rounded-2xl p-4 border border-slate-800/40 text-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Permasalahan</span>
                  <p className="text-slate-300 leading-relaxed">{item.permasalahan}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tindakan / Rekomendasi BK</span>
                  <p className="text-slate-300 leading-relaxed">{item.tindakan}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 text-xs font-semibold">
                <span className="text-slate-500">
                  Tanggal: {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Edit Catatan"
                  >
                    <Edit3 size={15} />
                  </button>
                  <a
                    href={`/bk/cetak/surat-panggilan?id=${item.id}`}
                    target="_blank"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                    title="Cetak Surat Panggilan"
                  >
                    <Printer size={15} />
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Catatan"
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
                <HeartHandshake className="text-violet-400" />
                {editingId ? 'Edit Catatan BK' : 'Tambah Catatan BK'}
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
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 disabled:opacity-50"
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
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tanggal Kasus</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kategori Bimbingan</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500"
                  >
                    <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
                    <option value="Bimbingan Sosial">Bimbingan Sosial</option>
                    <option value="Bimbingan Belajar">Bimbingan Belajar</option>
                    <option value="Bimbingan Karir">Bimbingan Karir</option>
                  </select>
                </div>
              </div>

              {/* Permasalahan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Detail Permasalahan</label>
                <textarea
                  value={permasalahan}
                  onChange={(e) => setPermasalahan(e.target.value)}
                  placeholder="Ceritakan kronologi atau permasalahan yang dialami siswa..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 resize-none"
                />
              </div>

              {/* Tindakan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tindakan / Solusi BK</label>
                <textarea
                  value={tindakan}
                  onChange={(e) => setTindakan(e.target.value)}
                  placeholder="Rencana tindak lanjut, konseling, atau pemanggilan wali murid..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500 resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status Kasus</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-violet-500"
                >
                  <option value="Proses Tindak Lanjut">Proses Tindak Lanjut</option>
                  <option value="Selesai">Selesai</option>
                </select>
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
                  className="flex-1 py-3 px-4 bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Catatan'
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
