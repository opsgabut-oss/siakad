'use client';

import { useState, useEffect } from 'react';
import { CalendarRange, RefreshCw, Printer, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface SesiMengajar {
  kelasId: string;
  kelasNama: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
}

interface TPData {
  id: string;
  deskripsi: string;
  alokasiJP: number;
  kktp: number;
}

interface PromesRecord {
  tujuanPembelajaranId: string;
  bulan: number;
  mingguKe: number;
}

export default function PromesPage() {
  const [sesiList, setSesiList] = useState<SesiMengajar[]>([]);
  const [selectedSesiIndex, setSelectedSesiIndex] = useState(-1);
  const [semester, setSemester] = useState<1 | 2>(1);

  const [tps, setTps] = useState<TPData[]>([]);
  const [promesList, setPromesList] = useState<PromesRecord[]>([]);
  
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importingTps, setImportingTps] = useState(false);

  const handleAutoImportTps = async () => {
    if (selectedSesiIndex === -1 || !currentSesi) return;
    const sesi = currentSesi;
    
    setImportingTps(true);
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
      fetchPromesData(sesi.mapelId, semester);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat TP otomatis');
    } finally {
      setImportingTps(false);
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
      fetchPromesData(mapelId, semester);
    } catch (err: any) {
      setError('Gagal membuat Tujuan Pembelajaran default');
    } finally {
      setImportingTps(false);
    }
  };

  useEffect(() => {
    fetchSesiMengajar();
  }, []);

  useEffect(() => {
    if (selectedSesiIndex !== -1 && sesiList[selectedSesiIndex]) {
      const sesi = sesiList[selectedSesiIndex];
      fetchPromesData(sesi.mapelId, semester);
    }
  }, [selectedSesiIndex, semester]);

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

  const fetchPromesData = async (mapelId: string, semVal: number) => {
    setLoadingData(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/promes?mataPelajaranId=${mapelId}&semester=${semVal}`);
      if (!res.ok) throw new Error('Gagal memuat Program Semester');
      const data = await res.json();
      setTps(data.tps);
      setPromesList(data.promes);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Promes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCellToggle = async (tpId: string, bulan: number, mingguKe: number, currentActive: boolean) => {
    setError('');
    
    // Optimistic UI update
    const nextActive = !currentActive;
    if (nextActive) {
      setPromesList(prev => [...prev, { tujuanPembelajaranId: tpId, bulan, mingguKe }]);
    } else {
      setPromesList(prev => prev.filter(r => !(r.tujuanPembelajaranId === tpId && r.bulan === bulan && r.mingguKe === mingguKe)));
    }

    try {
      const res = await fetch('/api/guru/promes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tujuanPembelajaranId: tpId,
          bulan,
          mingguKe,
          active: nextActive
        })
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui database Promes');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui Promes');
      // Rollback UI update
      if (currentActive) {
        setPromesList(prev => [...prev, { tujuanPembelajaranId: tpId, bulan, mingguKe }]);
      } else {
        setPromesList(prev => prev.filter(r => !(r.tujuanPembelajaranId === tpId && r.bulan === bulan && r.mingguKe === mingguKe)));
      }
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

  const bulanList = semester === 1 
    ? [
        { id: 7, nama: 'Juli' },
        { id: 8, nama: 'Agustus' },
        { id: 9, nama: 'September' },
        { id: 10, nama: 'Oktober' },
        { id: 11, nama: 'November' },
        { id: 12, nama: 'Desember' }
      ]
    : [
        { id: 1, nama: 'Januari' },
        { id: 2, nama: 'Februari' },
        { id: 3, nama: 'Maret' },
        { id: 4, nama: 'April' },
        { id: 5, nama: 'Mei' },
        { id: 6, nama: 'Juni' }
      ];

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarRange className="text-indigo-400" size={28} />
            Program Semester (Promes)
          </h1>
          <p className="text-xs text-slate-400 mt-1">Petakan jadwal pelaksanaan mingguan Tujuan Pembelajaran (TP) dalam satu semester.</p>
        </div>
        {currentSesi && tps.length > 0 && (
          <a
            href={`/guru/cetak-promes?kelasId=${currentSesi.kelasId}&mapelId=${currentSesi.mapelId}&semester=${semester}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer justify-center w-full sm:w-auto"
          >
            <Printer size={14} /> Cetak Promes
          </a>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Selector Pemilihan */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Kelas & Mapel</label>
          <select
            value={selectedSesiIndex}
            onChange={(e) => setSelectedSesiIndex(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-hidden focus:border-indigo-500 transition-colors"
          >
            {sesiList.map((s, idx) => (
              <option key={idx} value={idx}>
                {s.kelasNama} - {s.mapelNama} ({s.mapelKode})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(parseInt(e.target.value, 10) as 1 | 2)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-hidden focus:border-indigo-500 transition-colors"
          >
            <option value={1}>Semester I (Ganjil)</option>
            <option value={2}>Semester II (Genap)</option>
          </select>
        </div>
      </div>

      {/* Grid Interaktif Promes */}
      {selectedSesiIndex !== -1 && currentSesi && (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">
              Pemetaan Mingguan • {currentSesi.kelasNama} ({bulanList[0].nama} - {bulanList[5].nama})
            </h3>
          </div>

          {loadingData ? (
            <div className="flex justify-center items-center py-20 flex-1">
              <RefreshCw className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : tps.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center my-auto space-y-4">
              <Info size={36} className="mx-auto text-slate-650 mb-2 animate-pulse" />
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Belum ada Tujuan Pembelajaran yang diinput untuk Semester {semester}.<br />
                Tujuan Pembelajaran diperlukan untuk memetakan jadwal mingguan Promes dan membuat Modul Ajar.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <button
                  onClick={handleAutoImportTps}
                  disabled={importingTps}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {importingTps ? <RefreshCw size={13} className="animate-spin" /> : '🤖'}
                  Buat TP Otomatis (Buku / Default)
                </button>
                <Link
                  href="/guru/tujuan-pembelajaran"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center"
                >
                  Input TP Manual
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto shadow-md">
              <table className="w-full border-collapse text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-450 text-[10px] font-bold uppercase tracking-wider text-center">
                    <th className="p-3 w-10 border-r border-slate-800/60" rowSpan={2}>No</th>
                    <th className="p-3 w-80 text-left border-r border-slate-800/60" rowSpan={2}>Tujuan Pembelajaran</th>
                    <th className="p-3 w-16 border-r border-slate-800/60" rowSpan={2}>JP</th>
                    <th className="p-3 w-16 border-r border-slate-800/60" rowSpan={2}>KKTP</th>
                    {bulanList.map(b => (
                      <th key={b.id} className="p-1 border-r border-slate-800/60 text-xs font-extrabold" colSpan={5}>{b.nama}</th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-800 bg-slate-950/30 text-[8px] font-extrabold text-slate-500 text-center">
                    {bulanList.map(b => 
                      Array.from({ length: 5 }, (_, idx) => (
                        <th key={`${b.id}-${idx}`} className="p-1 border-r border-slate-850 w-8">{idx + 1}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {tps.map((tp, index) => (
                    <tr key={tp.id} className="hover:bg-slate-900/10">
                      <td className="p-3 text-center text-slate-500 font-bold border-r border-slate-850/65">{index + 1}</td>
                      <td className="p-3 font-semibold text-slate-200 leading-relaxed border-r border-slate-850/65" title={tp.deskripsi}>{tp.deskripsi}</td>
                      <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-850/65">{tp.alokasiJP} JP</td>
                      <td className="p-3 text-center font-extrabold text-indigo-400 border-r border-slate-850/65">{tp.kktp}</td>
                      {bulanList.map(b => 
                        Array.from({ length: 5 }, (_, idx) => {
                          const w = idx + 1;
                          const isChecked = promesList.some(r => r.tujuanPembelajaranId === tp.id && r.bulan === b.id && r.mingguKe === w);
                          return (
                            <td key={`${b.id}-${idx}`} className="p-0.5 border-r border-slate-850/45 text-center">
                              <button
                                onClick={() => handleCellToggle(tp.id, b.id, w, isChecked)}
                                className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center border transition-all ${
                                  isChecked 
                                    ? 'bg-indigo-650 border-indigo-500 text-white shadow-sm' 
                                    : 'bg-slate-950/20 border-slate-850 text-transparent hover:border-slate-700'
                                }`}
                              >
                                {isChecked ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
