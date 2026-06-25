'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle, FileText, Calendar, Send, Upload, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  tanggal: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  keterangan: string | null;
  waktuDatang: string | null;
  waktuPulang: string | null;
  ttdDatang: string | null;
  ttdPulang: string | null;
  createdAt: string;
}

export default function PresensiMandiri() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [hasTandaTangan, setHasTandaTangan] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  // File Upload & Drag-and-Drop State
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form State for Sakit/Izin
  const [showModal, setShowModal] = useState(false);
  const [formStatus, setFormStatus] = useState<'SAKIT' | 'IZIN'>('SAKIT');
  const [formKeterangan, setFormKeterangan] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guru/absensi-mandiri');
      if (!res.ok) throw new Error('Gagal memuat status absensi');
      const data = await res.json();
      setTodayRecord(data.today);
      setHistory(data.history);
      setHasTandaTangan(data.hasTandaTangan);

      if (data.hasTandaTangan) {
        fetchSignature();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data absensi');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await fetch('/api/guru/tanda-tangan');
      if (res.ok) {
        const data = await res.json();
        setSavedSignature(data.tandaTangan);
      }
    } catch (err) {
      console.error('Error fetching signature:', err);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG/JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG/JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = async () => {
    if (!signaturePreview) return;
    setUploadingSig(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/guru/tanda-tangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tandaTangan: signaturePreview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan tanda tangan');

      setSuccess('Scan tanda tangan berhasil disimpan!');
      setHasTandaTangan(true);
      setSavedSignature(signaturePreview);
      setSignaturePreview(null);
      setShowUploadArea(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah tanda tangan');
    } finally {
      setUploadingSig(false);
    }
  };

  const handleCheckInHadir = async (tipe: 'DATANG' | 'PULANG') => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/guru/absensi-mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'HADIR', tipe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal merekam absensi');

      setSuccess(`Presensi ${tipe === 'DATANG' ? 'Masuk' : 'Pulang'} hari ini berhasil disimpan!`);
      setTodayRecord(data.record);
      fetchStatus();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim presensi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSakitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeterangan.trim()) {
      alert('Keterangan / alasan wajib diisi');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/guru/absensi-mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formStatus,
          keterangan: formKeterangan
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal merekam absensi');

      setSuccess(`Laporan ${formStatus === 'SAKIT' ? 'Sakit' : 'Izin'} hari ini berhasil dikirim!`);
      setTodayRecord(data.record);
      setShowModal(false);
      setFormKeterangan('');
      fetchStatus();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTanggalIndo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatWaktuCheckIn = (isoString: string) => {
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} WIB`;
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex justify-center items-center gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={20} />
        <span className="text-xs text-slate-400 font-semibold">Memeriksa status kehadiran hari ini...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Notifikasi Status */}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          ✨ {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-955/60 border border-rose-800 text-rose-300 rounded-2xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Upload Tanda Tangan Section */}
      {(!hasTandaTangan || showUploadArea) && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5 animate-pulse">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scan Tanda Tangan Anda</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Silakan **tarik & letakkan (drag and drop)** berkas gambar scan tanda tangan Anda (rekomendasi format PNG transparan) atau klik area di bawah untuk memilih file. Tanda tangan ini otomatis disematkan saat absen.
              </p>
            </div>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all gap-4 min-h-[160px] cursor-pointer select-none ${
              isDragging 
                ? 'bg-indigo-500/10 border-indigo-500/70 scale-[1.01] shadow-lg shadow-indigo-500/5' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-950/80'
            }`}
          >
            {signaturePreview ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pratinjau Tanda Tangan</p>
                <div className="bg-white p-4 rounded-xl border border-slate-205 flex items-center justify-center max-w-[200px] h-[100px] shadow-sm animate-in zoom-in-95 duration-200">
                  <img src={signaturePreview} alt="Pratinjau Tanda Tangan" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex gap-2.5 mt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSignaturePreview(null);
                    }}
                    disabled={uploadingSig}
                    className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveSignature();
                    }}
                    disabled={uploadingSig}
                    className="px-4 py-2 bg-linear-to-r from-indigo-500 to-violet-650 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {uploadingSig && <Loader2 size={13} className="animate-spin" />}
                    Simpan Tanda Tangan
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-4">
                <ImageIcon className={`transition-all duration-300 ${isDragging ? 'text-indigo-400 scale-110' : 'text-slate-600'}`} size={42} />
                <span className="text-xs text-slate-350 font-bold mt-1">
                  {isDragging ? 'Lepaskan gambar di sini' : 'Tarik & Letakkan gambar di sini atau Klik untuk memilih'}
                </span>
                <span className="text-[10px] text-slate-500">Format PNG transparan atau JPG. Ukuran max 2MB.</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSignatureUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
          {showUploadArea && (
            <button 
              onClick={() => setShowUploadArea(false)} 
              className="text-xs text-slate-400 hover:text-slate-200 font-medium block mx-auto underline mt-2 cursor-pointer"
            >
              Kembali ke absensi
            </button>
          )}
        </div>
      )}

      {/* Main Check-in Card (Only accessible if signature exists) */}
      {hasTandaTangan && !showUploadArea && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Calendar size={18} className="text-indigo-400" />
                Presensi Mandiri Pendidik & Staf
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Hari ini: {formatTanggalIndo(new Date().toISOString())}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedSignature && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-850 px-3 py-1 rounded-xl">
                  <ShieldCheck size={13} className="text-indigo-400" />
                  <span className="text-[10px] font-semibold text-slate-400">Ttd Aktif</span>
                  <button 
                    onClick={() => setShowUploadArea(true)}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 ml-1.5 underline cursor-pointer"
                  >
                    Ganti
                  </button>
                </div>
              )}

              {/* Today Status Badge */}
              {todayRecord ? (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  todayRecord.status === 'HADIR' 
                    ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400' 
                    : todayRecord.status === 'SAKIT'
                    ? 'bg-amber-955/40 border border-amber-800/60 text-amber-400'
                    : 'bg-sky-955/40 border border-sky-800/60 text-sky-400'
                }`}>
                  {todayRecord.status}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-500">
                  Belum Presensi
                </span>
              )}
            </div>
          </div>

          {/* Card Body */}
          {todayRecord && todayRecord.status !== 'HADIR' ? (
            // Laporan Sakit atau Izin
            <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-slate-200 font-semibold leading-relaxed">
                  Status kehadiran Anda hari ini tercatat sebagai **{todayRecord.status === 'SAKIT' ? 'Sakit' : 'Izin'}**.
                </p>
                {todayRecord.keterangan && (
                  <p className="text-[11px] text-slate-400 italic mt-1 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                    Keterangan: "{todayRecord.keterangan}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Hadir atau Belum Presensi
            <div className="space-y-6">
              
              {/* Absensi Alur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Datang */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-350">1. Kehadiran Datang (Masuk)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dicatat secara real-time saat Anda tiba.</p>
                    </div>
                    {todayRecord?.waktuDatang ? (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
                        Selesai
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-900 text-slate-500">
                        Menunggu
                      </span>
                    )}
                  </div>

                  {todayRecord?.waktuDatang ? (
                    <div className="bg-slate-900/40 border border-slate-850/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={13} className="text-emerald-400" />
                        <span className="text-slate-300">Jam Datang: <strong>{formatWaktuCheckIn(todayRecord.waktuDatang)}</strong></span>
                      </div>
                      {todayRecord.ttdDatang && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ttd Datang:</span>
                          <div className="bg-white px-2 py-1 rounded border border-slate-200 max-h-[40px] flex items-center justify-center">
                            <img src={todayRecord.ttdDatang} alt="Ttd Datang" className="max-h-[30px] object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckInHadir('DATANG')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Absen Datang (Masuk)
                    </button>
                  )}
                </div>

                {/* Pulang */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-350">2. Kehadiran Pulang (Keluar)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dicatat secara real-time saat Anda pulang.</p>
                    </div>
                    {todayRecord?.waktuPulang ? (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
                        Selesai
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-900 text-slate-500">
                        Menunggu
                      </span>
                    )}
                  </div>

                  {todayRecord?.waktuPulang ? (
                    <div className="bg-slate-900/40 border border-slate-850/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={13} className="text-emerald-400" />
                        <span className="text-slate-300">Jam Pulang: <strong>{formatWaktuCheckIn(todayRecord.waktuPulang)}</strong></span>
                      </div>
                      {todayRecord.ttdPulang && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ttd Pulang:</span>
                          <div className="bg-white px-2 py-1 rounded border border-slate-200 max-h-[40px] flex items-center justify-center">
                            <img src={todayRecord.ttdPulang} alt="Ttd Pulang" className="max-h-[30px] object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckInHadir('PULANG')}
                      disabled={submitting || !todayRecord?.waktuDatang}
                      className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                        todayRecord?.waktuDatang 
                          ? 'bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-md shadow-violet-500/10 hover:shadow-violet-500/20' 
                          : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                      }`}
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Absen Pulang (Keluar)
                    </button>
                  )}
                </div>

              </div>

              {/* Lapor Sakit / Izin hanya tampil jika belum melakukan absen sama sekali hari ini */}
              {!todayRecord && (
                <div className="flex justify-center border-t border-slate-850/60 pt-4">
                  <button
                    onClick={() => {
                      setFormStatus('SAKIT');
                      setFormKeterangan('');
                      setShowModal(true);
                    }}
                    disabled={submitting}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
                  >
                    <FileText size={14} />
                    Lapor Sakit / Izin Hari Ini
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Monthly History Dot Bar */}
      {history.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Riwayat Presensi Bulan Ini (Terbaru)
          </h4>
          
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-1">
              {history.slice(0, 15).map((rec) => (
                <div 
                  key={rec.id} 
                  className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5 flex flex-col items-center justify-center text-center space-y-1 w-20 shrink-0"
                  title={rec.keterangan ? `Keterangan: ${rec.keterangan}` : `Status: ${rec.status}`}
                >
                  <span className="text-[9px] text-slate-500 font-bold">
                    {new Date(rec.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    rec.status === 'HADIR' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : rec.status === 'SAKIT'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {rec.status[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modal Form Sakit / Izin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Laporan Ketidakhadiran Mandiri
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSakitIzin} className="p-6 space-y-4">
              {/* Pilihan Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Status Berhalangan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('SAKIT')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formStatus === 'SAKIT'
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('IZIN')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      formStatus === 'IZIN'
                        ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Izin
                  </button>
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase block">
                  Keterangan / Alasan Lengkap
                </label>
                <textarea
                  rows={3}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder={`Contoh: ${
                    formStatus === 'SAKIT' 
                      ? 'Sakit Demam Tinggi, butuh istirahat sesuai surat dokter' 
                      : 'Izin menghadiri acara wisuda keluarga'
                  }`}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 text-xs focus:outline-hidden focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <Send size={12} />
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// X icon helper for modal
function X({ size, className, onClick }: { size: number; className?: string; onClick?: () => void }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
