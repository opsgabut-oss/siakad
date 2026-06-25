'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, Save, RefreshCw, AlertCircle, Check, BookOpen, Plus, Trash2, Printer, CheckSquare } from 'lucide-react';

interface SesiMengajar {
  kelasId: string;
  kelasNama: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
}

function TujuanDanKktpPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'prota' | 'tp' | 'atp' | 'kktp'>('prota');
  const [sesiList, setSesiList] = useState<SesiMengajar[]>([]);
  const [selectedSesiIndex, setSelectedSesiIndex] = useState(-1);

  // Tab TP (Prota) States
  const [tpList, setTpList] = useState<any[]>([]);
  const [newTp, setNewTp] = useState({
    deskripsi: '',
    alokasiJP: '4',
    semester: '1',
    kktp: '70'
  });
  const [savingTp, setSavingTp] = useState(false);
  const [loadingTp, setLoadingTp] = useState(false);
  const [importingBuku, setImportingBuku] = useState(false);

  // Tab Capaian TP States
  const [capaianData, setCapaianData] = useState<{ tps: any[]; students: any[] } | null>(null);
  const [capaianChecklist, setCapaianChecklist] = useState<Record<string, Record<string, boolean>>>({});
  const [savingCapaian, setSavingCapaian] = useState(false);

  // Common Loading & Status States
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync activeTab with URL tab param
  useEffect(() => {
    if (tabParam && ['prota', 'tp', 'atp', 'kktp'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchSesiMengajar();
  }, []);

  useEffect(() => {
    if (selectedSesiIndex !== -1 && sesiList[selectedSesiIndex]) {
      const sesi = sesiList[selectedSesiIndex];
      setError('');
      setSuccess('');
      if (activeTab === 'kktp') {
        fetchCapaian(sesi.kelasId, sesi.mapelId);
      } else {
        fetchTps(sesi.kelasId, sesi.mapelId);
      }

      // Set default JP based on subject and class (No 13/2025)
      const code = sesi.mapelKode.toUpperCase();
      const kelasMatch = sesi.kelasNama.match(/\d+/);
      const kelasNum = kelasMatch ? parseInt(kelasMatch[0], 10) : 1;
      let defaultJP = '4';
      if (code === 'IND' || code === 'INDONESIA') {
        defaultJP = kelasNum <= 2 ? '7' : '6';
      } else if (code === 'MTK' || code === 'MATEMATIKA') {
        defaultJP = kelasNum === 1 ? '4' : '5';
      } else if (code === 'IPAS') {
        defaultJP = kelasNum <= 2 ? '0' : '5';
      } else if (code === 'PP' || code === 'PANCASILA' || code === 'PKN') {
        defaultJP = '4';
      } else if (code === 'PAI' || code === 'PABP' || code === 'AGAMA' || code === 'PJOK' || code === 'OR' || code === 'SRI' || code === 'SB' || code === 'SENI') {
        defaultJP = '3';
      } else if (code === 'ING' || code === 'INGGRIS' || code === 'JAWA' || code === 'BJAW' || code === 'KAI' || code === 'AI' || code === 'KODING' || code === 'KKAI') {
        defaultJP = '2';
      } else if (code === 'P5' || code === 'KOKU' || code === 'KOKURIKULER' || code === 'PROJEK') {
        defaultJP = '6';
      }
      setNewTp(prev => ({ ...prev, alokasiJP: defaultJP }));
    } else {
      setTpList([]);
      setCapaianData(null);
      setCapaianChecklist({});
    }
  }, [selectedSesiIndex, activeTab]);

  const fetchSesiMengajar = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/admin/jadwal?my=true');
      if (!res.ok) throw new Error('Gagal memuat jadwal ajar');
      const data = await res.json();
      
      const sesiUnikMap = new Map<string, SesiMengajar>();
      data.forEach((j: any) => {
        const key = `${j.kelasId}-${j.mataPelajaranId}`;
        if (!sesiUnikMap.has(key)) {
          sesiUnikMap.set(key, {
            kelasId: j.kelasId,
            kelasNama: j.kelas.nama,
            mapelId: j.mataPelajaranId,
            mapelNama: j.mataPelajaran.nama,
            mapelKode: j.mataPelajaran.kode,
          });
        }
      });
      
      const sesi = Array.from(sesiUnikMap.values());
      setSesiList(sesi);
      
      if (sesi.length > 0) {
        setSelectedSesiIndex(0);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data mengajar');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchTps = async (kelasId: string, mapelId: string) => {
    setLoadingTp(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/tujuan-pembelajaran?mataPelajaranId=${mapelId}&kelasId=${kelasId}`);
      if (!res.ok) throw new Error('Gagal memuat Tujuan Pembelajaran');
      const data = await res.json();
      setTpList(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat Tujuan Pembelajaran');
    } finally {
      setLoadingTp(false);
    }
  };

  const fetchCapaian = async (kelasId: string, mapelId: string) => {
    setLoadingSiswa(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/capaian-tp?kelasId=${kelasId}&mataPelajaranId=${mapelId}`);
      if (!res.ok) throw new Error('Gagal memuat Capaian TP');
      const data = await res.json();
      setCapaianData(data);
      
      const initialChecklist: Record<string, Record<string, boolean>> = {};
      data.students.forEach((student: any) => {
        initialChecklist[student.siswaId] = {};
        student.capaian.forEach((c: any) => {
          initialChecklist[student.siswaId][c.tujuanPembelajaranId] = c.tercapai;
        });
      });
      setCapaianChecklist(initialChecklist);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat Capaian TP');
    } finally {
      setLoadingSiswa(false);
    }
  };

  const handleAddTp = async () => {
    if (selectedSesiIndex === -1) return;
    const sesi = sesiList[selectedSesiIndex];
    if (!newTp.deskripsi.trim()) return;

    setSavingTp(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/guru/tujuan-pembelajaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaranId: sesi.mapelId,
          kelasId: sesi.kelasId,
          deskripsi: newTp.deskripsi,
          kktp: newTp.kktp,
          alokasiJP: newTp.alokasiJP,
          semester: newTp.semester
        })
      });
      if (!res.ok) throw new Error('Gagal menyimpan Tujuan Pembelajaran');
      setSuccess('Tujuan Pembelajaran berhasil ditambahkan!');
      setNewTp({ deskripsi: '', alokasiJP: '4', semester: '1', kktp: '70' });
      fetchTps(sesi.kelasId, sesi.mapelId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan Tujuan Pembelajaran');
    } finally {
      setSavingTp(false);
    }
  };

  const handleDeleteTp = async (id: string) => {
    if (selectedSesiIndex === -1) return;
    const sesi = sesiList[selectedSesiIndex];
    if (!confirm('Apakah Anda yakin ingin menghapus Tujuan Pembelajaran ini?')) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/guru/tujuan-pembelajaran?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus Tujuan Pembelajaran');
      setSuccess('Tujuan Pembelajaran berhasil dihapus!');
      fetchTps(sesi.kelasId, sesi.mapelId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus Tujuan Pembelajaran');
    }
  };

  const handleImportBukuPaket = async () => {
    if (selectedSesiIndex === -1) return;
    const sesi = sesiList[selectedSesiIndex];

    setImportingBuku(true);
    setError('');
    setSuccess('');
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
      const res = await fetch('/api/guru/tujuan-pembelajaran/import-buku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaranId: sesi.mapelId,
          kelasId: sesi.kelasId,
          apiKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          if (confirm('Rujukan buku paket untuk mata pelajaran ini tidak ditemukan. Apakah Anda ingin membuat 3 Tujuan Pembelajaran default secara otomatis agar Promes & Modul Ajar bisa segera dibuat?')) {
            await handleCreateDefaultTps(sesi.mapelId, sesi.kelasId, sesi.mapelNama);
            return;
          }
        }
        throw new Error(data.message || 'Gagal memuat TP otomatis dari Buku Paket');
      }

      setSuccess(data.message || 'Tujuan Pembelajaran berhasil dimuat!');
      fetchTps(sesi.kelasId, sesi.mapelId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat TP otomatis dari Buku Paket');
    } finally {
      setImportingBuku(false);
    }
  };

  const handleCreateDefaultTps = async (mapelId: string, kelasId: string, mapelNama: string) => {
    try {
      const sesi = sesiList[selectedSesiIndex];
      const code = sesi?.mapelKode?.toUpperCase() || '';
      let defaultJP = 4;
      if (code === 'KODING' || code === 'KAI' || code === 'AI' || code === 'KKAI') {
        defaultJP = 2;
      } else if (code === 'P5' || code === 'KOKU' || code === 'KOKURIKULER' || code === 'PROJEK') {
        defaultJP = 6;
      }

      const genericTps = [
        { deskripsi: `Memahami dan mengidentifikasi konsep dasar materi Bab I pada mata pelajaran ${mapelNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 },
        { deskripsi: `Melakukan eksplorasi praktis dan studi kasus Bab II pada mata pelajaran ${mapelNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 },
        { deskripsi: `Mengevaluasi hasil pembelajaran dan merangkum inti Bab III pada mata pelajaran ${mapelNama}`, alokasiJP: defaultJP, kktp: 70, semester: 1 }
      ];

      let createdCount = 0;
      for (const tp of genericTps) {
        const res = await fetch('/api/guru/tujuan-pembelajaran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mataPelajaranId: mapelId,
            kelasId: kelasId,
            deskripsi: tp.deskripsi,
            kktp: tp.kktp,
            alokasiJP: tp.alokasiJP,
            semester: tp.semester
          })
        });
        if (res.ok) createdCount++;
      }

      setSuccess(`Berhasil membuat ${createdCount} Tujuan Pembelajaran default untuk ${mapelNama}!`);
      fetchTps(kelasId, mapelId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Gagal membuat Tujuan Pembelajaran default');
    }
  };

  const handleCapaianChecklistChange = (siswaId: string, tpId: string, val: boolean) => {
    setCapaianChecklist((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [tpId]: val
      }
    }));
  };

  const handleSaveCapaian = async () => {
    if (selectedSesiIndex === -1) return;
    const sesi = sesiList[selectedSesiIndex];
    setSavingCapaian(true);
    setError('');
    setSuccess('');

    const achievements: any[] = [];
    Object.entries(capaianChecklist).forEach(([siswaId, tpMap]) => {
      Object.entries(tpMap).forEach(([tujuanPembelajaranId, tercapai]) => {
        achievements.push({
          siswaId,
          tujuanPembelajaranId,
          tercapai
        });
      });
    });

    try {
      const res = await fetch('/api/guru/capaian-tp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievements })
      });
      if (!res.ok) throw new Error('Gagal menyimpan Capaian TP');
      setSuccess('Capaian TP siswa berhasil disimpan!');
      fetchCapaian(sesi.kelasId, sesi.mapelId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan Capaian TP');
    } finally {
      setSavingCapaian(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex justify-center items-center py-20 flex-1">
        <RefreshCw className="animate-spin text-indigo-400" size={28} />
      </div>
    );
  }

  const currentSesi = sesiList[selectedSesiIndex];

  // Helper title based on active tab
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'prota':
        return 'Program Tahunan (Prota)';
      case 'tp':
        return 'Capaian & Tujuan Pembelajaran (CP / TP)';
      case 'atp':
        return 'Alur Tujuan Pembelajaran (ATP)';
      case 'kktp':
        return 'Ketercapaian TP (KKTP) Siswa';
      default:
        return 'Administrasi Kurikulum Merdeka';
    }
  };

  return (
    <div className="space-y-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={28} />
            {getHeaderTitle()}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Kelola administrasi kurikulum pembelajaran siswa dan rencana semester secara dinamis.</p>
        </div>
      </div>

      {/* Tabs Menu hidden to show as separate pages based on sidebar selection */}

      {/* Alert Status */}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check size={14} />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Dropdown Pemilihan Kelas & Mapel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
        {sesiList.length === 0 ? (
          <div className="p-2 text-center text-slate-400 text-xs italic">
            Anda tidak terdaftar mengajar di kelas manapun.
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Kelas & Mata Pelajaran Yang Diampu</label>
            <select
              value={selectedSesiIndex}
              onChange={(e) => setSelectedSesiIndex(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-hidden focus:border-indigo-500 transition-colors"
            >
              {sesiList.map((s, idx) => (
                <option key={idx} value={idx}>
                  {s.kelasNama} - {s.mapelNama} ({s.mapelKode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedSesiIndex !== -1 && currentSesi && (
        <div className="flex-1 flex flex-col space-y-4">
          
          {/* TAB 1: PROTA (Program Tahunan) */}
          {activeTab === 'prota' && (
            <div className="flex-1 flex flex-col space-y-6">
              {/* Form Input TP */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={15} className="text-indigo-400" /> Tambah Alokasi Program Tahunan Baru
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Tujuan Pembelajaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: Membaca dan menulis bilangan cacah..."
                      value={newTp.deskripsi}
                      onChange={(e) => setNewTp({ ...newTp, deskripsi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-700 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Semester</label>
                    <select
                      value={newTp.semester}
                      onChange={(e) => setNewTp({ ...newTp, semester: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden"
                    >
                      <option value="1">Semester I (Ganjil)</option>
                      <option value="2">Semester II (Genap)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">JP</label>
                      <input
                        type="number"
                        min="1"
                        value={newTp.alokasiJP}
                        onChange={(e) => setNewTp({ ...newTp, alokasiJP: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">KKTP</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newTp.kktp}
                        onChange={(e) => setNewTp({ ...newTp, kktp: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddTp}
                    disabled={savingTp || !newTp.deskripsi.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {savingTp ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    Tambah ke Program Tahunan (Prota)
                  </button>
                </div>
              </div>

              {/* List TP & Cetak Prota */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Daftar TP (Program Tahunan)
                  </h3>
                  <div className="flex gap-2">
                    {tpList.length === 0 && (
                      <button
                        onClick={handleImportBukuPaket}
                        disabled={importingBuku}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {importingBuku ? <RefreshCw size={13} className="animate-spin" /> : '🤖'}
                        {importingBuku ? 'Memuat...' : 'Generate Prota'}
                      </button>
                    )}
                    {tpList.length > 0 && (
                      <a
                        href={`/guru/cetak-prota?kelasId=${currentSesi.kelasId}&mapelId=${currentSesi.mapelId}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-md"
                      >
                        <Printer size={13} /> Cetak Lembar Prota
                      </a>
                    )}
                  </div>
                </div>

                {loadingTp ? (
                  <div className="flex justify-center items-center py-12 flex-1">
                    <RefreshCw className="animate-spin text-indigo-400" size={24} />
                  </div>
                ) : tpList.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-10 text-center space-y-4">
                    <p className="text-slate-400 text-xs italic">
                      Belum ada Program Tahunan (Prota) yang dibuat. Klik tombol di bawah ini untuk men-generate otomatis dari Buku Paket resmi.
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={handleImportBukuPaket}
                        disabled={importingBuku}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-650/50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {importingBuku ? <RefreshCw size={13} className="animate-spin" /> : '🤖'}
                        {importingBuku ? 'Memuat Prota...' : 'Generate Program Tahunan (Prota) dari Buku Paket'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="p-3 text-center w-12">No</th>
                          <th className="p-3">Deskripsi Tujuan Pembelajaran</th>
                          <th className="p-3 text-center w-36">Semester</th>
                          <th className="p-3 text-center w-20">Alokasi</th>
                          <th className="p-3 text-center w-20">KKTP</th>
                          <th className="p-3 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs">
                        {tpList.map((tp, idx) => (
                          <tr key={tp.id} className="hover:bg-slate-900/10">
                            <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-3 text-slate-200 font-semibold">{tp.deskripsi}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                tp.semester === 1 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                  : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              }`}>
                                {tp.semester === 1 ? 'Semester I (Ganjil)' : 'Semester II (Genap)'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-350">{tp.alokasiJP} JP</td>
                            <td className="p-3 text-center font-extrabold text-indigo-400">{tp.kktp}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteTp(tp.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-450 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CP / TP (Capaian & Tujuan Pembelajaran) */}
          {activeTab === 'tp' && (
            <div className="flex-1 flex flex-col space-y-6">
              {/* Form Input TP */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={15} className="text-indigo-400" /> Muat Capaian Pembelajaran Resmi
                  </h3>
                  <button
                    onClick={handleImportBukuPaket}
                    disabled={importingBuku}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {importingBuku ? <RefreshCw size={13} className="animate-spin" /> : '🤖'}
                    {importingBuku ? 'Memuat...' : 'Muat TP dari Buku Paket'}
                  </button>
                </div>
                
                {/* Form Input Manual */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atau Tambahkan TP Secara Manual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Tujuan Pembelajaran</label>
                      <input
                        type="text"
                        placeholder="Contoh: Membaca dan menulis bilangan cacah..."
                        value={newTp.deskripsi}
                        onChange={(e) => setNewTp({ ...newTp, deskripsi: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-700 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Semester</label>
                      <select
                        value={newTp.semester}
                        onChange={(e) => setNewTp({ ...newTp, semester: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden"
                      >
                        <option value="1">Semester I (Ganjil)</option>
                        <option value="2">Semester II (Genap)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">JP</label>
                        <input
                          type="number"
                          min="1"
                          value={newTp.alokasiJP}
                          onChange={(e) => setNewTp({ ...newTp, alokasiJP: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">KKTP</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newTp.kktp}
                          onChange={(e) => setNewTp({ ...newTp, kktp: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddTp}
                      disabled={savingTp || !newTp.deskripsi.trim()}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-650/50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {savingTp ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Simpan CP / TP Baru
                    </button>
                  </div>
                </div>
              </div>

              {/* List TP */}
              <div className="space-y-3 flex-1 flex flex-col">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Daftar Capaian & Tujuan Pembelajaran (CP/TP)
                </h3>

                {loadingTp ? (
                  <div className="flex justify-center items-center py-12 flex-1">
                    <RefreshCw className="animate-spin text-indigo-400" size={24} />
                  </div>
                ) : tpList.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-10 text-center text-slate-500 text-xs italic">
                    Belum ada TP yang didefinisikan. Klik tombol "Muat TP dari Buku Paket" di atas untuk memuat secara otomatis.
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="p-3 text-center w-12">No</th>
                          <th className="p-3">Deskripsi Capaian / Tujuan Pembelajaran</th>
                          <th className="p-3 text-center w-36">Semester</th>
                          <th className="p-3 text-center w-20">Alokasi</th>
                          <th className="p-3 text-center w-20">KKTP</th>
                          <th className="p-3 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs">
                        {tpList.map((tp, idx) => (
                          <tr key={tp.id} className="hover:bg-slate-900/10">
                            <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-3 text-slate-200 font-semibold">{tp.deskripsi}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                tp.semester === 1 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                  : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              }`}>
                                {tp.semester === 1 ? 'Semester I (Ganjil)' : 'Semester II (Genap)'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-350">{tp.alokasiJP} JP</td>
                            <td className="p-3 text-center font-extrabold text-indigo-400">{tp.kktp}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteTp(tp.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-450 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ATP (Alur Tujuan Pembelajaran) */}
          {activeTab === 'atp' && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Alur Tujuan Pembelajaran (ATP)
                </h3>
                {tpList.length > 0 && (
                  <a
                    href={`/guru/cetak-atp?kelasId=${currentSesi.kelasId}&mapelId=${currentSesi.mapelId}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                  >
                    <Printer size={13} /> Cetak ATP
                  </a>
                )}
              </div>

              {loadingTp ? (
                <div className="flex justify-center items-center py-12 flex-1">
                  <RefreshCw className="animate-spin text-indigo-400" size={24} />
                </div>
              ) : tpList.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-10 text-center text-slate-500 text-xs italic">
                  Belum ada Tujuan Pembelajaran terdaftar. Silakan tambahkan TP atau gunakan tab CP/TP terlebih dahulu.
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="p-3 text-center w-12">Urutan</th>
                        <th className="p-3">Tujuan Pembelajaran</th>
                        <th className="p-3 text-center w-36">Semester</th>
                        <th className="p-3 text-center w-24">Alokasi Waktu</th>
                        <th className="p-3 text-center w-20">KKTP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {tpList.map((tp, idx) => (
                        <tr key={tp.id} className="hover:bg-slate-900/10">
                          <td className="p-3 text-center text-slate-500 font-bold border-r border-slate-850/50">Alur {idx + 1}</td>
                          <td className="p-3 text-slate-200 font-semibold">{tp.deskripsi}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              tp.semester === 1 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            }`}>
                              {tp.semester === 1 ? 'Semester I (Ganjil)' : 'Semester II (Genap)'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-350">{tp.alokasiJP} JP</td>
                          <td className="p-3 text-center font-extrabold text-indigo-400">{tp.kktp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KETERCAPAIAN TP (KKTP) */}
          {activeTab === 'kktp' && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Checklist Ketercapaian TP (KKTP) Siswa
                </h3>
              </div>

              {loadingSiswa ? (
                <div className="flex justify-center items-center py-20 flex-1">
                  <RefreshCw className="animate-spin text-indigo-400" size={24} />
                </div>
              ) : !capaianData || capaianData.tps.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center">
                  <AlertCircle size={28} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400 text-xs italic font-medium">
                    Belum ada Tujuan Pembelajaran yang diinput. Isi tab "CP / TP" atau "Prota" terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                          <th className="p-3 w-48">Nama Siswa</th>
                          {capaianData.tps.map((tp, idx) => (
                            <th key={tp.id} className="p-3 text-center text-[8px] font-semibold border-l border-slate-850" title={tp.deskripsi}>
                              <div className="truncate w-32 mx-auto">TP {idx + 1} ({tp.semester === 1 ? 'S1' : 'S2'})</div>
                              <div className="text-[7px] text-slate-500 font-normal mt-0.5 truncate w-32 mx-auto">{tp.deskripsi}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {capaianData.students.map((student) => (
                          <tr key={student.siswaId} className="hover:bg-slate-900/10">
                            <td className="p-3">
                              <h4 className="text-[9px] font-bold text-slate-500">{student.nisn}</h4>
                              <p className="text-xs font-bold text-slate-200 truncate">{student.nama}</p>
                            </td>
                            {capaianData.tps.map((tp) => {
                              const checked = capaianChecklist[student.siswaId]?.[tp.id] ?? true;
                              return (
                                <td key={tp.id} className="p-2 text-center border-l border-slate-850/60">
                                  <label className="inline-flex items-center justify-center p-1.5 cursor-pointer rounded-lg hover:bg-slate-800 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => handleCapaianChecklistChange(student.siswaId, tp.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border border-slate-800 peer-checked:border-indigo-500 rounded-md flex items-center justify-center peer-checked:bg-indigo-650 transition-all">
                                      {checked && <CheckSquare size={13} className="text-white" />}
                                    </div>
                                    <span className="ml-1.5 text-[10px] font-bold select-none text-slate-400 peer-checked:text-indigo-400">
                                      {checked ? 'Tercapai' : 'Bimbingan'}
                                    </span>
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button
                      onClick={handleSaveCapaian}
                      disabled={savingCapaian}
                      className="w-full py-3 px-4 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-indigo-500/50 disabled:to-violet-600/50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingCapaian ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      {savingCapaian ? 'Menyimpan Capaian...' : 'Simpan Capaian Pembelajaran Siswa'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}

export default function TujuanDanKktpPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 flex-1">
        <RefreshCw className="animate-spin text-indigo-400" size={28} />
      </div>
    }>
      <TujuanDanKktpPageContent />
    </Suspense>
  );
}
