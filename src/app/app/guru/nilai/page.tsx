'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Save, RefreshCw, AlertCircle, Check, Printer } from 'lucide-react';

interface SesiMengajar {
  kelasId: string;
  kelasNama: string;
  mapelId: string;
  mapelNama: string;
  mapelKode: string;
}

interface SiswaNilaiRow {
  siswaId: string;
  nisn: string;
  nama: string;
  harian1: number | null;
  harian2: number | null;
  harian3: number | null;
  harian4: number | null;
  harian5: number | null;
  harian6: number | null;
  uts: number | null;
  uas: number | null;
  rapor: number | null;
}

export default function InputNilaiPage() {
  const [sesiList, setSesiList] = useState<SesiMengajar[]>([]);
  const [selectedSesiIndex, setSelectedSesiIndex] = useState(-1);
  
  // Tab Nilai States
  const [siswaNilaiRows, setSiswaNilaiRows] = useState<SiswaNilaiRow[]>([]);
  const [kktpSubject, setKktpSubject] = useState(70);
  const [gradesInput, setGradesInput] = useState<Record<string, {
    harian1: string;
    harian2: string;
    harian3: string;
    harian4: string;
    harian5: string;
    harian6: string;
    uts: string;
    uas: string;
  }>>({});
  
  // Common Loading & Status States
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingSiswa, setLoadingSiswa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSesiMengajar();
  }, []);

  useEffect(() => {
    if (selectedSesiIndex !== -1 && sesiList[selectedSesiIndex]) {
      const sesi = sesiList[selectedSesiIndex];
      setError('');
      setSuccess('');
      fetchSiswaNilai(sesi.kelasId, sesi.mapelId);
    } else {
      setSiswaNilaiRows([]);
      setGradesInput({});
    }
  }, [selectedSesiIndex]);

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

  const fetchSiswaNilai = async (kelasId: string, mapelId: string) => {
    setLoadingSiswa(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/nilai?kelasId=${kelasId}&mataPelajaranId=${mapelId}`);
      if (!res.ok) throw new Error('Gagal memuat daftar nilai siswa');
      const data: SiswaNilaiRow[] = await res.json();
      
      setSiswaNilaiRows(data);
      
      const initialInputs: Record<string, any> = {};
      data.forEach((row) => {
        initialInputs[row.siswaId] = {
          harian1: row.harian1 !== null ? row.harian1.toString() : '',
          harian2: row.harian2 !== null ? row.harian2.toString() : '',
          harian3: row.harian3 !== null ? row.harian3.toString() : '',
          harian4: row.harian4 !== null ? row.harian4.toString() : '',
          harian5: row.harian5 !== null ? row.harian5.toString() : '',
          harian6: row.harian6 !== null ? row.harian6.toString() : '',
          uts: row.uts !== null ? row.uts.toString() : '',
          uas: row.uas !== null ? row.uas.toString() : '',
        };
      });
      setGradesInput(initialInputs);

      // Tarik juga Tujuan Pembelajaran untuk menentukan rata-rata KKTP default jika ada
      const resTps = await fetch(`/api/guru/tujuan-pembelajaran?mataPelajaranId=${mapelId}&kelasId=${kelasId}`);
      if (resTps.ok) {
        const tps = await resTps.json();
        if (tps.length > 0) {
          const avgKktp = Math.round(tps.reduce((sum: number, t: any) => sum + t.kktp, 0) / tps.length);
          setKktpSubject(avgKktp);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat siswa');
    } finally {
      setLoadingSiswa(false);
    }
  };

  const handleGradeChange = (siswaId: string, field: string, value: string) => {
    if (value !== '') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0 || num > 100) return;
    }

    setGradesInput((prev) => {
      const studentInput = {
        ...prev[siswaId],
        [field]: value,
      };

      const harianKeys = ['harian1', 'harian2', 'harian3', 'harian4', 'harian5', 'harian6'];
      const harianVals = harianKeys
        .map(k => studentInput[k as keyof typeof studentInput])
        .filter(v => v !== '')
        .map(v => parseInt(v, 10));
      
      const avgHarian = harianVals.length > 0 
        ? harianVals.reduce((sum, v) => sum + v, 0) / harianVals.length 
        : null;

      const components: number[] = [];
      if (avgHarian !== null) components.push(avgHarian);
      
      const utsVal = studentInput.uts;
      if (utsVal !== '') components.push(parseInt(utsVal, 10));

      const uasVal = studentInput.uas;
      if (uasVal !== '') components.push(parseInt(uasVal, 10));

      const computedRapor = components.length > 0 
        ? Math.round(components.reduce((sum, v) => sum + v, 0) / components.length)
        : null;

      setSiswaNilaiRows((currentRows) => 
        currentRows.map((row) => 
          row.siswaId === siswaId 
            ? { ...row, rapor: computedRapor } 
            : row
        )
      );

      return {
        ...prev,
        [siswaId]: studentInput,
      };
    });
  };

  const handleSaveGrades = async () => {
    if (selectedSesiIndex === -1) return;
    const sesi = sesiList[selectedSesiIndex];
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payloadGrades = Object.entries(gradesInput).map(([siswaId, data]) => ({
      siswaId,
      harian1: data.harian1,
      harian2: data.harian2,
      harian3: data.harian3,
      harian4: data.harian4,
      harian5: data.harian5,
      harian6: data.harian6,
      uts: data.uts,
      uas: data.uas,
    }));

    try {
      const res = await fetch('/api/guru/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mataPelajaranId: sesi.mapelId,
          grades: payloadGrades,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan nilai');
      }

      setSuccess('Nilai siswa berhasil disimpan!');
      fetchSiswaNilai(sesi.kelasId, sesi.mapelId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-400" size={28} />
            Administrasi Penilaian Siswa
          </h1>
          <p className="text-xs text-slate-400 mt-1">Kelola nilai harian, UTS, UAS, dan Nilai Rapor Kurikulum Merdeka.</p>
        </div>
      </div>

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
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Daftar Nilai {currentSesi.kelasNama}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>KKTP Penentu Merah:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={kktpSubject}
                    onChange={(e) => setKktpSubject(parseInt(e.target.value, 10) || 70)}
                    className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-center text-white font-bold"
                  />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-450 border border-slate-800 font-bold">
                  {siswaNilaiRows.length} Siswa
                </span>
              </div>
            </div>

            {loadingSiswa ? (
              <div className="flex justify-center items-center py-20 flex-1">
                <RefreshCw className="animate-spin text-indigo-400" size={24} />
              </div>
            ) : siswaNilaiRows.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center my-auto">
                <p className="text-slate-500 text-xs italic">Tidak ada siswa terdaftar di kelas ini.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="p-3">Nama Siswa</th>
                        {['Harian 1', 'Harian 2', 'Harian 3', 'Harian 4', 'Harian 5', 'Harian 6', 'UTS', 'UAS'].map((h) => (
                          <th key={h} className="p-3 text-center">{h}</th>
                        ))}
                        <th className="p-3 text-right bg-indigo-950/10 text-indigo-400">Nilai Rapor</th>
                        <th className="p-3 text-center w-24">Cetak Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {siswaNilaiRows.map((row) => {
                        const studentGrades = gradesInput[row.siswaId] || {
                          harian1: '', harian2: '', harian3: '', harian4: '', harian5: '', harian6: '', uts: '', uas: ''
                        };
                        const isUnderKktp = row.rapor !== null && row.rapor < kktpSubject;
                        return (
                          <tr key={row.siswaId} className="hover:bg-slate-900/10 transition-colors">
                            <td className="p-3">
                              <h4 className="text-[10px] font-bold text-slate-500">{row.nisn}</h4>
                              <p className="text-xs font-bold text-slate-200 truncate">{row.nama}</p>
                            </td>
                            {['harian1', 'harian2', 'harian3', 'harian4', 'harian5', 'harian6', 'uts', 'uas'].map((field) => (
                              <td key={field} className="p-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="-"
                                  value={studentGrades[field as keyof typeof studentGrades] ?? ''}
                                  onChange={(e) => handleGradeChange(row.siswaId, field, e.target.value)}
                                  className="w-12 px-1 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 rounded-xl text-center text-xs font-bold text-white placeholder-slate-800 focus:outline-hidden"
                                />
                              </td>
                            ))}
                            <td className={`p-3 text-right font-extrabold text-xs ${isUnderKktp ? 'text-rose-500 bg-rose-500/5' : 'text-indigo-350 bg-indigo-950/5'}`}>
                              {row.rapor !== null ? row.rapor : '-'}
                            </td>
                            <td className="p-2 text-center border-l border-slate-850/60 bg-indigo-950/5">
                              <a
                                href={`/guru/cetak-rapor?kelasId=${currentSesi.kelasId}&siswaId=${row.siswaId}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                              >
                                <Printer size={11} /> Rapor
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={handleSaveGrades}
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-indigo-500/50 disabled:to-violet-600/50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {submitting ? 'Menyimpan Nilai...' : 'Simpan Semua Nilai'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
