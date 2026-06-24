'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Search, X, Loader2, Calendar, FileText, Link as LinkIcon, Download, AlertCircle } from 'lucide-react';

interface ArsipSurat {
  id: string;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalDiterima: string | null;
  pengirim: string;
  penerima: string;
  perihal: string;
  jenis: 'MASUK' | 'KELUAR';
  tautanBerkas: string | null;
  keterangan: string | null;
  kategori: string;
}

const CATEGORY_LABELS: { [key: string]: { label: string; style: string } } = {
  SURAT_MASUK: { label: 'Surat Masuk', style: 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-400' },
  SURAT_KELUAR: { label: 'Surat Keluar', style: 'bg-indigo-950/50 border border-indigo-800/60 text-indigo-400' },
  RAPOR: { label: 'Rapor', style: 'bg-rose-950/50 border border-rose-800/60 text-rose-400' },
  IJAZAH: { label: 'Ijazah', style: 'bg-amber-950/50 border border-amber-800/60 text-amber-450' },
  DOKUMEN_GURU: { label: 'Dokumen Guru', style: 'bg-violet-950/50 border border-violet-800/60 text-violet-400' },
  LAINNYA: { label: 'Lainnya', style: 'bg-slate-950/50 border border-slate-800/60 text-slate-400' },
};

export default function AdminSuratPage() {
  const [suratList, setSuratList] = useState<ArsipSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategoriTab, setSelectedKategoriTab] = useState<string>('SEMUA');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tanggalDiterima, setTanggalDiterima] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [penerima, setPenerima] = useState('');
  const [perihal, setPerihal] = useState('');
  const [jenis, setJenis] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [kategori, setKategori] = useState<string>('SURAT_MASUK');
  const [tautanBerkas, setTautanBerkas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSurat();
  }, [selectedKategoriTab, searchTerm]);

  const fetchSurat = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/surat?';
      if (selectedKategoriTab !== 'SEMUA') {
        url += `kategori=${selectedKategoriTab}&`;
      }
      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}&`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat arsip dokumen');
      const data = await res.json();
      setSuratList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNomorSurat('');
    setTanggalSurat(new Date().toISOString().split('T')[0]);
    setTanggalDiterima('');
    setPengirim('');
    setPenerima('');
    setPerihal('');
    setJenis('MASUK');
    setKategori('SURAT_MASUK');
    setTautanBerkas('');
    setKeterangan('');
    setFormError('');
    setSelectedFile(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (surat: ArsipSurat) => {
    setEditingId(surat.id);
    setNomorSurat(surat.nomorSurat);
    setTanggalSurat(new Date(surat.tanggalSurat).toISOString().split('T')[0]);
    setTanggalDiterima(surat.tanggalDiterima ? new Date(surat.tanggalDiterima).toISOString().split('T')[0] : '');
    setPengirim(surat.pengirim);
    setPenerima(surat.penerima);
    setPerihal(surat.perihal);
    setJenis(surat.jenis);
    setKategori(surat.kategori || 'SURAT_MASUK');
    setTautanBerkas(surat.tautanBerkas || '');
    setKeterangan(surat.keterangan || '');
    setFormError('');
    setSelectedFile(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('kategori', kategori);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Ukuran berkas terlalu besar. Maksimal ukuran berkas adalah 4.5 MB.');
        }
        let errMsg = 'Gagal mengunggah berkas';
        try {
          const data = await res.json();
          errMsg = data.message || errMsg;
        } catch (e) {
          errMsg = `Gagal mengunggah berkas (Status: ${res.status})`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setTautanBerkas(data.tautanBerkas || data.localUrl || '');
      setSelectedFile(null);
      alert('Berkas berhasil diunggah!');
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat mengunggah berkas');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalSurat || !perihal) {
      setFormError('Kolom Tanggal dan Perihal wajib diisi');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      let finalTautanBerkas = tautanBerkas;

      // Unggah berkas secara otomatis jika ada berkas yang dipilih tetapi belum di-upload
      if (selectedFile) {
        setFormError('Sedang mengunggah berkas...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('kategori', kategori);

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          if (uploadRes.status === 413) {
            throw new Error('Ukuran berkas terlalu besar. Maksimal ukuran berkas adalah 4.5 MB.');
          }
          let errMsg = 'Gagal mengunggah berkas';
          try {
            const uploadData = await uploadRes.json();
            errMsg = uploadData.message || errMsg;
          } catch (e) {
            errMsg = `Gagal mengunggah berkas (Status: ${uploadRes.status})`;
          }
          throw new Error(errMsg);
        }

        const uploadData = await uploadRes.json();
        finalTautanBerkas = uploadData.tautanBerkas || uploadData.localUrl || '';
      }

      const url = editingId ? `/api/admin/surat/${editingId}` : '/api/admin/surat';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorSurat: nomorSurat || null,
          tanggalSurat,
          tanggalDiterima: jenis === 'MASUK' && tanggalDiterima ? tanggalDiterima : null,
          pengirim: pengirim || null,
          penerima: penerima || null,
          perihal,
          jenis,
          kategori,
          tautanBerkas: finalTautanBerkas || null,
          keterangan: keterangan || null,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Gagal menyimpan arsip';
        try {
          const data = await res.json();
          errMsg = data.message || errMsg;
        } catch (e) {
          errMsg = `Gagal menyimpan arsip (Status: ${res.status})`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      fetchSurat();
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan arsip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nomor: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus arsip dokumen dengan nomor "${nomor}"?`)) {
      try {
        const res = await fetch(`/api/admin/surat/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Gagal menghapus arsip');
        }

        setSuratList(suratList.filter((s) => s.id !== id));
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="text-indigo-400" />
            Arsip Dokumen Sekolah
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Simpan, kelola, dan rekap arsip surat, rapor, ijazah, serta dokumen sekolah lainnya.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://drive.google.com/drive/folders/1yOhyQan0wlrmmeZbtg2uiZd5PuD98ymE?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-slate-900 border border-slate-805 hover:bg-slate-800 text-slate-200 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <FolderOpen size={16} className="text-amber-500" />
            Buka Google Drive Sekolah
          </a>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Plus size={16} />
            Tambah Arsip Dokumen
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4">
        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-850">
          <button
            onClick={() => setSelectedKategoriTab('SEMUA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedKategoriTab === 'SEMUA'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedKategoriTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedKategoriTab === key
                  ? 'bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex bg-slate-950/40 border border-slate-850 rounded-2xl px-4 py-2.5 items-center gap-3 w-full md:w-80">
          <Search className="text-slate-500 shrink-0" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor, perihal, pengirim..."
            className="bg-transparent border-0 text-white placeholder-slate-500 text-xs focus:outline-hidden w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-350">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Letters List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={24} />
            Memuat arsip dokumen...
          </div>
        ) : suratList.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            Tidak ada dokumen ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Kategori & No. Dokumen</th>
                  <th className="px-6 py-4">Perihal / Judul</th>
                  <th className="px-6 py-4">Asal / Penerima</th>
                  <th className="px-6 py-4">Tanggal Dokumen</th>
                  <th className="px-6 py-4">Berkas</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm">
                {suratList.map((surat) => {
                  const cat = CATEGORY_LABELS[surat.kategori] || CATEGORY_LABELS.LAINNYA;
                  return (
                    <tr key={surat.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 space-y-1.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${cat.style}`}>
                          {cat.label}
                        </span>
                        <h4 className="font-mono text-xs font-bold text-slate-200">{surat.nomorSurat}</h4>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-100">{surat.perihal}</p>
                        {surat.keterangan && (
                          <p className="text-[10px] text-slate-500 truncate max-w-xs">{surat.keterangan}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-0.5 text-xs">
                        <p><span className="text-slate-500">Pengirim/Asal:</span> <strong className="text-slate-300">{surat.pengirim || '-'}</strong></p>
                        <p><span className="text-slate-500">Penerima/Tujuan:</span> <strong className="text-slate-300">{surat.penerima || '-'}</strong></p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium space-y-0.5">
                        <p className="text-slate-300">
                          {new Date(surat.tanggalSurat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {surat.jenis === 'MASUK' && surat.tanggalDiterima && (
                          <p className="text-[9px] text-slate-500 font-bold uppercase">
                            Diterima: {new Date(surat.tanggalDiterima).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {surat.tautanBerkas ? (
                          <div className="flex gap-2">
                            <a
                              href={surat.tautanBerkas}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold select-none cursor-pointer"
                            >
                              <LinkIcon size={12} />
                              Lihat
                            </a>
                            <a
                              href={surat.tautanBerkas}
                              download
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold select-none cursor-pointer"
                            >
                              <Download size={12} />
                              Unduh
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No File</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(surat)}
                            className="p-2 text-indigo-405 hover:text-white hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Edit Arsip"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(surat.id, surat.nomorSurat)}
                            className="p-2 text-rose-455 hover:text-white hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Arsip"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Surat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Data Arsip' : 'Tambah Arsip Baru'}
              </h2>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-3 py-2 rounded-xl text-xs">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Kategori Dokumen */}
                <div className="space-y-2 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Kategori Dokumen</label>
                  <select
                    value={kategori}
                    onChange={(e) => {
                      const val = e.target.value;
                      setKategori(val);
                      if (val === 'SURAT_KELUAR') {
                        setJenis('KELUAR');
                      } else {
                        setJenis('MASUK');
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="SURAT_MASUK">Surat Masuk</option>
                    <option value="SURAT_KELUAR">Surat Keluar</option>
                    <option value="RAPOR">Arsip Rapor</option>
                    <option value="IJAZAH">Arsip Ijazah</option>
                    <option value="DOKUMEN_GURU">Dokumen Guru</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                {/* Jenis Surat */}
                <div className="space-y-2 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Jenis Aliran</label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as 'MASUK' | 'KELUAR')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="MASUK">Masuk / Internal</option>
                    <option value="KELUAR">Keluar / Eksternal</option>
                  </select>
                </div>
              </div>

              {/* Nomor Dokumen */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase block">
                  Nomor Surat / Arsip
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder={
                    kategori === 'SURAT_MASUK' || kategori === 'SURAT_KELUAR'
                      ? 'Contoh: 045/SD-TU/VI/2026'
                      : 'Boleh dikosongkan (otomatis digenerate)'
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                />
                {kategori !== 'SURAT_MASUK' && kategori !== 'SURAT_KELUAR' && (
                  <p className="text-[10px] text-slate-500">
                    Jika dikosongkan, sistem akan membuat nomor unik format ARC-YYYYMMDD-XXXX.
                  </p>
                )}
              </div>

              {/* Perihal / Judul */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Perihal / Judul Dokumen</label>
                <input
                  type="text"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Komite atau Rapor Siswa Ahmad"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pengirim */}
                <div className="space-y-2 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Pengirim / Asal</label>
                  <input
                    type="text"
                    value={pengirim}
                    onChange={(e) => setPengirim(e.target.value)}
                    placeholder="Contoh: Dinas Pendidikan / Wali Murid"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Penerima */}
                <div className="space-y-2 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Penerima / Tujuan</label>
                  <input
                    type="text"
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    placeholder="Contoh: Kepala Sekolah / Siswa"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal Surat */}
                <div className="space-y-2 col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase block">Tanggal Dokumen</label>
                  <input
                    type="date"
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Tanggal Diterima (Hanya Surat Masuk) */}
                <div className="space-y-2 col-span-1">
                  <label className={`text-xs font-semibold uppercase block ${jenis === 'KELUAR' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Tanggal Diterima
                  </label>
                  <input
                    type="date"
                    disabled={jenis === 'KELUAR'}
                    value={tanggalDiterima}
                    onChange={(e) => setTanggalDiterima(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white disabled:text-slate-600 text-sm focus:outline-hidden focus:border-indigo-500 disabled:border-slate-900 disabled:bg-slate-950/20"
                  />
                </div>
              </div>

              {/* Tautan Berkas (Manual) */}
              <div className="space-y-2 border border-slate-800 bg-slate-950/20 p-4 rounded-2xl">
                <label className="text-xs font-semibold text-slate-350 uppercase block">Tautan Berkas (Link Google Drive)</label>
                <p className="text-[10px] text-slate-500">
                  Unggah file Anda secara manual ke folder Google Drive Sekolah, lalu salin dan tempel (paste) link share-nya di bawah ini:
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="url"
                    value={tautanBerkas}
                    onChange={(e) => setTautanBerkas(e.target.value)}
                    placeholder="Contoh: https://drive.google.com/file/d/... atau link berkas lainnya"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white placeholder-slate-650 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Unggah Berkas Langsung */}
              <div className="space-y-2 border border-slate-800 bg-slate-950/20 p-4 rounded-2xl">
                <label className="text-xs font-semibold text-slate-350 uppercase block">Unggah Berkas Langsung ke Server</label>
                <p className="text-[10px] text-slate-500">
                  Pilih file PDF/Gambar dari komputer Anda untuk diunggah langsung ke server:
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    className="block w-full text-xs text-slate-400
                      file:mr-4 file:py-1.5 file:px-3
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-slate-800 file:text-slate-300
                      hover:file:bg-slate-700 cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadFile}
                      disabled={uploading}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Upload'}
                    </button>
                  )}
                </div>
                {tautanBerkas && tautanBerkas.startsWith('/uploads/') && (
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                    ✓ Berkas tersimpan di server: {tautanBerkas.split('/').pop()}
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Keterangan Tambahan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Isi ringkasan disposisi atau keterangan tambahan..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-855 rounded-xl text-white placeholder-slate-550 text-sm focus:outline-hidden focus:border-indigo-500 resize-none"
                />
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
                  {editingId ? 'Simpan Perubahan' : 'Arsipkan Dokumen'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
