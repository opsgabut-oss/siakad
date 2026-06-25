'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, User, Phone, Upload, AlertCircle, RefreshCw, Download } from 'lucide-react';


interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  kelasId: string;
  kelas: {
    nama: string;
  };
  kontakOrangTua: string;
  tanggalLahir: string | null;
  noAbsen: number | null;
}

interface Kelas {
  id: string;
  nama: string;
}

export default function AdminSiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State (Single Add/Edit)
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [kelasId, setKelasId] = useState('');
  const [kontakOrangTua, setKontakOrangTua] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [noAbsen, setNoAbsen] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State (Import CSV)
  const [csvFileContent, setCsvFileContent] = useState('');
  const [importReport, setImportReport] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    skippedCount?: number;
    errors?: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFFnisn;nama;kelas;kontak orang tua;no_absen\n1122334455;Dian Permana;Kelas 5;081234567890;1\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  const fetchSiswa = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/siswa');
      if (!res.ok) throw new Error('Gagal mengambil data siswa');
      const data = await res.json();
      setSiswaList(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const res = await fetch('/api/admin/kelas');
      if (!res.ok) throw new Error('Gagal mengambil data kelas');
      const data = await res.json();
      setKelasList(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const calculateAge = (birthDateStr: string | null) => {
    if (!birthDateStr) return '-';
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    let ageMonths = today.getMonth() - birthDate.getMonth();
    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
      ageMonths = 12 + ageMonths;
    }
    return `${ageYears} Thn ${ageMonths} Bln`;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNisn('');
    setNama('');
    setKelasId(kelasList[0]?.id || '');
    setKontakOrangTua('');
    setTanggalLahir('');
    setNoAbsen('');
    setFormError('');
    setIsOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setEditingId(siswa.id);
    setNisn(siswa.nisn);
    setNama(siswa.nama);
    setKelasId(siswa.kelasId);
    setKontakOrangTua(siswa.kontakOrangTua);
    setTanggalLahir(siswa.tanggalLahir ? new Date(siswa.tanggalLahir).toISOString().split('T')[0] : '');
    setNoAbsen(siswa.noAbsen !== null && siswa.noAbsen !== undefined ? siswa.noAbsen.toString() : '');
    setFormError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormError('');
  };

  const handleOpenImport = () => {
    setCsvFileContent('');
    setImportReport(null);
    setImportOpen(true);
  };

  const handleCloseImport = () => {
    setIsImportOpen(false);
    setImportReport(null);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn || !nama || !kelasId || !kontakOrangTua) {
      setFormError('Semua kolom wajib diisi');
      return;
    }

    if (nisn.length !== 10 || isNaN(Number(nisn))) {
      setFormError('NISN harus tepat 10 digit angka');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const url = editingId ? `/api/admin/siswa/${editingId}` : '/api/admin/siswa';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nisn, 
          nama, 
          kelasId, 
          kontakOrangTua, 
          tanggalLahir: tanggalLahir || null, 
          noAbsen: noAbsen || null 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan data');
      }

      fetchSiswa();
      setIsOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFileContent) {
      alert('Pilih file CSV terlebih dahulu');
      return;
    }

    setImporting(true);
    setImportReport(null);

    try {
      const res = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvFileContent }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses impor file');
      }

      setImportReport({
        success: true,
        message: data.message,
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
        errors: data.errors
      });

      fetchSiswa();
    } catch (err: any) {
      setImportReport({
        success: false,
        message: err.message || 'Gagal mengimpor file CSV'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${name}"?`)) {
      try {
        const res = await fetch(`/api/admin/siswa/${id}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Gagal menghapus data');
        }

        setSiswaList(siswaList.filter(s => s.id !== id));
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan');
      }
    }
  };

  // Filter Search
  const filteredSiswa = siswaList.filter(s =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nisn.includes(searchTerm) ||
    s.kelas.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State setter helper since setIsImportOpen is used
  const setImportOpen = (open: boolean) => {
    setIsImportOpen(open);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manajemen Data Siswa</h1>
          <p className="text-slate-400 mt-1 text-sm">Kelola data siswa, nomor absen manual, dan impor data massal lewat file CSV.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-350 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Download size={16} />
            Unduh Template Impor (CSV)
          </button>
          <a
            href="/api/admin/siswa/export"
            target="_blank"
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-350 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Download size={16} />
            Ekspor Data Siswa (Excel)
          </a>
          <button
            onClick={handleOpenImport}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Upload size={16} />
            Import Massal (CSV)
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Plus size={16} />
            Tambah Siswa Baru
          </button>
        </div>

      </div>

      {/* Filter Pencarian */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 items-center gap-3 w-full max-w-md">
        <Search className="text-slate-500 shrink-0" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari siswa berdasarkan nama, NISN, atau kelas..."
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

      {/* Tabel Data Siswa */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={24} />
            Memuat data siswa...
          </div>
        ) : filteredSiswa.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            Tidak ada data siswa ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-4 text-center w-16">Absen</th>
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">NISN (10 Digit)</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Tanggal Lahir / Usia</th>
                  <th className="px-6 py-4">Kontak Orang Tua</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300 text-sm">
                {filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold font-mono text-indigo-400">
                      {siswa.noAbsen !== null && siswa.noAbsen !== undefined ? siswa.noAbsen : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{siswa.nama}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{siswa.nisn}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-950/50 border border-slate-800 text-indigo-400 px-2.5 py-1 rounded-full text-xs font-medium">
                        {siswa.kelas.nama}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      {siswa.tanggalLahir ? (
                        <>
                          <p className="text-xs text-slate-300">
                            {new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">
                            Usia: {calculateAge(siswa.tanggalLahir)}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{siswa.kontakOrangTua}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(siswa.id, siswa.nama)}
                          className="p-2 text-rose-400 hover:text-white hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Siswa"
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

      {/* Modal Add / Edit Siswa */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h2>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-3 py-2 rounded-xl text-xs">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {/* No Absen */}
                <div className="col-span-1 space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase block">
                    No. Absen
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={noAbsen}
                    onChange={(e) => setNoAbsen(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1, 2..."
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-sm focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>

                {/* NISN */}
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase block">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10 digit NISN..."
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Nama */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Nama Lengkap Siswa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Rian Hidayat"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Tanggal Lahir Siswa
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Kelas */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Kelas Siswa
                </label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                >
                  {kelasList.length === 0 ? (
                    <option value="" disabled>Belum ada kelas aktif</option>
                  ) : (
                    kelasList.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Kontak Orang Tua */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Kontak HP / WA Orang Tua
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    value={kontakOrangTua}
                    onChange={(e) => setKontakOrangTua(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Contoh: 085222333444"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
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
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Import Data Siswa Masal via CSV</h2>
              <button onClick={handleCloseImport} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-6">
              
              {/* Petunjuk Format */}
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Aturan & Contoh Format File (CSV / Excel)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan format CSV dengan koma (`,`) atau titik-koma (`;`) sebagai pembatas kolom. Header baris pertama wajib berisi kolom:
                  <code className="mx-1 px-1 bg-slate-900 text-indigo-300 font-mono text-[10px] border border-slate-800 rounded">nisn, nama, kelas, kontak orang tua, no_absen</code>
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-indigo-500/20 select-none"
                  >
                    <Download size={12} /> Unduh File Template CSV
                  </button>
                </div>
                <pre className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto select-all">
                  {"nisn;nama;kelas;kontak orang tua;no_absen\n1234567890;Rian Hidayat;Kelas 6;085222333444;1\n0987654321;Laras Ati;Kelas 6;081333444555;2"}
                </pre>
              </div>


              {/* Upload File Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Pilih File CSV (.csv)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  disabled={importing}
                  className="w-full text-slate-400 text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 file:cursor-pointer hover:file:bg-slate-700"
                />
              </div>

              {/* Report Section */}
              {importReport && (
                <div className={`p-4 rounded-2xl border text-sm max-h-48 overflow-y-auto space-y-2 ${
                  importReport.success 
                    ? 'bg-indigo-950/20 border-indigo-900/60 text-indigo-200' 
                    : 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                }`}>
                  <p className="font-bold">{importReport.message}</p>
                  {importReport.success && (
                    <div className="text-xs space-y-1">
                      <p>✨ Berhasil diimpor: <strong className="text-white text-sm">{importReport.importedCount}</strong> siswa.</p>
                      <p>⚠️ Dilewati (karena error/duplikat): <strong className="text-white text-sm">{importReport.skippedCount}</strong> siswa.</p>
                      {importReport.errors && importReport.errors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-indigo-900/40 space-y-1 font-mono text-[10px] text-indigo-300">
                          <p className="font-semibold uppercase tracking-wider text-[9px] text-slate-400">Daftar Baris Error:</p>
                          {importReport.errors.map((err, index) => (
                            <p key={index}>✖ {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <p className="text-[10px] text-slate-500 font-medium">
                  *Kelas baru otomatis dibuat jika belum ada.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseImport}
                    className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold select-none cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !csvFileContent}
                    className="px-5 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {importing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Mengimpor Data...
                      </>
                    ) : (
                      'Mulai Impor Data'
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
