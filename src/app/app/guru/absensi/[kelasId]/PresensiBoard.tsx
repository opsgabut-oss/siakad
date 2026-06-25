'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Calendar, CheckCircle2 } from 'lucide-react';

interface SiswaAbsen {
  id: string;
  nisn: string;
  nama: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | null;
}

interface PresensiBoardProps {
  kelasId: string;
  tanggalStr: string;
}

export default function PresensiBoard({ kelasId, tanggalStr }: PresensiBoardProps) {
  const router = useRouter();
  const [students, setStudents] = useState<SiswaAbsen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [kelasId, tanggalStr]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/guru/absensi?kelasId=${kelasId}&tanggal=${tanggalStr}`);
      if (!res.ok) throw new Error('Gagal memuat data presensi');
      const data = await res.json();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA') => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const handleMarkAllHadir = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'HADIR' })));
  };

  const handleSave = async () => {
    // Validasi: pastikan semua siswa sudah diberi status
    const unmarked = students.filter(s => s.status === null);
    if (unmarked.length > 0) {
      alert(`Masih ada ${unmarked.length} siswa yang belum diabsen.`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/guru/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelasId,
          tanggalStr,
          absensiData: students.map(s => ({
            siswaId: s.id,
            status: s.status
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan presensi');

      setSuccess(true);
      setTimeout(() => {
        router.push('/guru/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
      setSaving(false);
    }
  };

  // Format tanggal untuk banner header
  const formatTanggal = (str: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return new Date(str).toLocaleDateString('id-ID', options);
    } catch (e) {
      return str;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm">Memuat daftar siswa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm">
        ⚠️ {error}
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 size={36} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Presensi Berhasil Disimpan!</h2>
          <p className="text-slate-400 text-xs mt-1">Mengembalikan Anda ke dashboard guru...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-grow flex flex-col justify-between pb-24 relative">
      
      {/* Banner Tanggal & Tombol Cepat */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800/80 rounded-2xl px-4 py-3 gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Calendar size={16} className="text-indigo-400" />
          {formatTanggal(tanggalStr)}
        </div>
        <button
          onClick={handleMarkAllHadir}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer select-none"
        >
          Setel Semua Hadir (H)
        </button>
      </div>

      {/* Daftar Siswa */}
      <div className="space-y-3 flex-1">
        {students.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            Tidak ada siswa terdaftar di kelas ini.
          </div>
        ) : (
          students.map((student, index) => (
            <div
              key={student.id}
              className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-slate-700/30"
            >
              {/* Nama & Nomor Siswa */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{student.nama}</h4>
                  <p className="text-[10px] font-semibold font-mono text-slate-500 mt-0.5">NISN: {student.nisn}</p>
                </div>
              </div>

              {/* Tombol Absen (H, I, S, A) */}
              <div className="grid grid-cols-4 gap-2 w-full sm:w-auto shrink-0 select-none">
                
                {/* Button Hadir (H) */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, 'HADIR')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    student.status === 'HADIR'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400 font-extrabold shadow-xs'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  H
                </button>

                {/* Button Izin (I) */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, 'IZIN')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    student.status === 'IZIN'
                      ? 'bg-amber-950/60 border-amber-700 text-amber-400 font-extrabold shadow-xs'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  I
                </button>

                {/* Button Sakit (S) */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, 'SAKIT')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    student.status === 'SAKIT'
                      ? 'bg-sky-950/60 border-sky-700 text-sky-400 font-extrabold shadow-xs'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  S
                </button>

                {/* Button Alpa (A) */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, 'ALPA')}
                  className={`py-3 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    student.status === 'ALPA'
                      ? 'bg-rose-950/60 border-rose-700 text-rose-400 font-extrabold shadow-xs'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  A
                </button>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Bottom Save Bar */}
      {students.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 z-40 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <div className="max-w-2xl mx-auto w-full">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl font-bold text-sm hover:shadow-indigo-500/20 shadow-lg shadow-indigo-500/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan Absensi...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan Absensi Hari Ini
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
