'use client';

import { useState, useEffect } from 'react';
import { School, Save, Loader2, Link as LinkIcon, RefreshCw, AlertCircle, Building, Upload } from 'lucide-react';

export default function AdminProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form States
  const [pemerintah, setPemerintah] = useState('');
  const [dinas, setDinas] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [npsn, setNpsn] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoPemdaUrl, setLogoPemdaUrl] = useState('');
  const [logoSekolahUrl, setLogoSekolahUrl] = useState('');
  const [namaKepsek, setNamaKepsek] = useState('');
  const [nipKepsek, setNipKepsek] = useState('');
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState('');
  const [uploadingPemda, setUploadingPemda] = useState(false);
  const [uploadingSekolah, setUploadingSekolah] = useState(false);

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>, type: 'pemda' | 'sekolah') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasi ukuran file hingga 500KB agar tidak memberatkan database
    if (file.size > 500 * 1024) {
      setError('Ukuran logo terlalu besar! Silakan gunakan gambar di bawah 500 KB.');
      return;
    }

    const setterLoading = type === 'pemda' ? setUploadingPemda : setUploadingSekolah;
    const setterUrl = type === 'pemda' ? setLogoPemdaUrl : setLogoSekolahUrl;

    setterLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setterUrl(base64String);
      setterLoading(false);
    };
    reader.onerror = () => {
      setError('Gagal membaca file gambar');
      setterLoading(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/profil-sekolah');
      if (!res.ok) throw new Error('Gagal memuat profil sekolah');
      const data = await res.json();
      
      setPemerintah(data.pemerintah || '');
      setDinas(data.dinas || '');
      setNamaSekolah(data.namaSekolah || '');
      setNpsn(data.npsn || '');
      setAlamat(data.alamat || '');
      setTelepon(data.telepon || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      setLogoPemdaUrl(data.logoPemdaUrl || '');
      setLogoSekolahUrl(data.logoSekolahUrl || '');
      setNamaKepsek(data.namaKepsek || '');
      setNipKepsek(data.nipKepsek || '');
      setTahunAjaranAktif(data.tahunAjaranAktif || '');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pemerintah || !dinas || !namaSekolah || !alamat || !namaKepsek) {
      setError('Kolom utama (Instansi Pemerintah, Dinas, Nama Sekolah, Alamat, dan Kepala Sekolah) wajib diisi');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/profil-sekolah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pemerintah,
          dinas,
          namaSekolah,
          npsn,
          alamat,
          telepon,
          email,
          website,
          logoPemdaUrl: logoPemdaUrl || null,
          logoSekolahUrl: logoSekolahUrl || null,
          namaKepsek,
          nipKepsek: nipKepsek || null,
          tahunAjaranAktif
        }),
      });


      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan profil');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Halaman */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <School className="text-indigo-400" />
          Identitas & Profil Sekolah
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Kelola informasi resmi sekolah, logo, dan penandatangan dokumen (Kepala Sekolah) untuk Kop Surat cetak.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium flex items-start gap-2">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-sm font-medium">
          ✨ Profil sekolah berhasil disimpan! Seluruh kop surat laporan cetak otomatis diperbarui.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Seksi 1: Instansi & Sekolah */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building size={18} className="text-indigo-400" />
            1. Instansi & Nama Sekolah (Kop Surat Utama)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase block">Instansi Pemerintah (Baris 1)</label>
              <input
                type="text"
                value={pemerintah}
                onChange={(e) => setPemerintah(e.target.value)}
                placeholder="Contoh: Pemerintah Kabupaten Pati"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-350 uppercase block">Dinas Pendidikan (Baris 2)</label>
              <input
                type="text"
                value={dinas}
                onChange={(e) => setDinas(e.target.value)}
                placeholder="Contoh: Dinas Pendidikan dan Kebudayaan"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Nama Sekolah Resmi (Baris 3)</label>
              <input
                type="text"
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                placeholder="Contoh: SD Negeri Wedusan"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-355 uppercase block">NPSN</label>
              <input
                type="text"
                value={npsn || ''}
                onChange={(e) => setNpsn(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan NPSN..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Tahun Ajaran Aktif</label>
              <input
                type="text"
                value={tahunAjaranAktif}
                onChange={(e) => setTahunAjaranAktif(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>


          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-350 uppercase block">Alamat Sekolah Lengkap (Baris 4)</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Masukkan jalan, desa/kelurahan, kecamatan, kabupaten, kode pos..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Seksi 2: Kontak & Media */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building size={18} className="text-indigo-400" />
            2. Kontak & Media Informasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <label className="text-xs font-semibold text-slate-355 uppercase block">No. Telepon / HP</label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="Contoh: (0295) 123456"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Email Sekolah</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: sdnwedusan@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Website Sekolah</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Contoh: www.sdnwedusan.sch.id"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Logo URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Logo Pemerintah Daerah (Kiri Kop - Opsional)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="text"
                    value={logoPemdaUrl}
                    onChange={(e) => setLogoPemdaUrl(e.target.value)}
                    placeholder="Masukkan link gambar atau unggah file..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 select-none">
                  {uploadingPemda ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploadingPemda ? 'Unggah...' : 'Pilih File'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadLogo(e, 'pemda')}
                    disabled={uploadingPemda}
                    className="hidden"
                  />
                </label>
              </div>
              {logoPemdaUrl && (
                <div className="mt-2 flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoPemdaUrl} 
                      alt="Pratinjau Pemda" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const errIndicator = parent.querySelector('.err-indicator');
                          if (errIndicator) (errIndicator as HTMLElement).style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const errIndicator = parent.querySelector('.err-indicator');
                          if (errIndicator) (errIndicator as HTMLElement).style.display = 'none';
                        }
                      }}
                    />
                    <div className="err-indicator hidden w-full h-full items-center justify-center text-rose-500">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-semibold text-slate-200">Pratinjau Logo Pemda</p>
                    <p className="text-[10px] text-slate-500 truncate">{logoPemdaUrl}</p>
                    <p className="text-[9px] text-rose-400 err-indicator hidden mt-0.5 font-medium">
                      Tautan gambar tidak valid atau tidak dapat dimuat.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Logo Sekolah Resmi (Kanan Kop - Opsional)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="text"
                    value={logoSekolahUrl}
                    onChange={(e) => setLogoSekolahUrl(e.target.value)}
                    placeholder="Masukkan link gambar atau unggah file..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 select-none">
                  {uploadingSekolah ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploadingSekolah ? 'Unggah...' : 'Pilih File'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadLogo(e, 'sekolah')}
                    disabled={uploadingSekolah}
                    className="hidden"
                  />
                </label>
              </div>
              {logoSekolahUrl && (
                <div className="mt-2 flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoSekolahUrl} 
                      alt="Pratinjau Sekolah" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const errIndicator = parent.querySelector('.err-indicator');
                          if (errIndicator) (errIndicator as HTMLElement).style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const errIndicator = parent.querySelector('.err-indicator');
                          if (errIndicator) (errIndicator as HTMLElement).style.display = 'none';
                        }
                      }}
                    />
                    <div className="err-indicator hidden w-full h-full items-center justify-center text-rose-500">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-semibold text-slate-200">Pratinjau Logo Sekolah</p>
                    <p className="text-[10px] text-slate-500 truncate">{logoSekolahUrl}</p>
                    <p className="text-[9px] text-rose-400 err-indicator hidden mt-0.5 font-medium">
                      Tautan gambar tidak valid atau tidak dapat dimuat.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            *Logo yang Anda pilih akan diunggah ke sistem dan dirender secara otomatis pada Kop Surat Resmi (Logo Pemda di sebelah kiri, Logo Sekolah di sebelah kanan).
          </p>
        </div>

        {/* Seksi 3: Kepala Sekolah (Penandatangan) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building size={18} className="text-indigo-400" />
            3. Kepala Sekolah (Penanda Tangan Dokumen)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-355 uppercase block">Nama Kepala Sekolah Lengkap</label>
              <input
                type="text"
                value={namaKepsek}
                onChange={(e) => setNamaKepsek(e.target.value)}
                placeholder="Contoh: Sudarto, S.Pd"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-355 uppercase block">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={nipKepsek}
                onChange={(e) => setNipKepsek(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan 18 digit NIP..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-4 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl font-bold text-sm hover:shadow-indigo-500/20 shadow-lg shadow-indigo-500/10 transition-all duration-200 flex items-center gap-2 cursor-pointer select-none disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menyimpan Perubahan...
              </>
            ) : (
              <>
                <Save size={18} />
                Simpan Identitas Sekolah
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
