'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, School, ArrowRight } from 'lucide-react';

interface ClassItem {
  id: string;
  nama: string;
}

interface DashboardFormProps {
  classes: ClassItem[];
}

export default function DashboardForm({ classes }: DashboardFormProps) {
  const router = useRouter();
  
  // Format tanggal hari ini menjadi YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('sv'); // 'sv' locale menghasilkan format YYYY-MM-DD
  
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedDate) {
      alert('Pilih kelas dan tanggal terlebih dahulu');
      return;
    }
    router.push(`/guru/absensi/${selectedClassId}?date=${selectedDate}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Pilihan Kelas */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block px-1">
          Pilih Kelas
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <School size={18} />
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-white text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 cursor-pointer"
          >
            {classes.length === 0 ? (
              <option value="" disabled>Belum ada kelas aktif</option>
            ) : (
              classes.map(c => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Pilihan Tanggal */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block px-1">
          Pilih Tanggal Presensi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Calendar size={18} />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={todayStr} // Tidak boleh absen melebihi hari ini
            className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-white text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 cursor-pointer"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={classes.length === 0}
        className="w-full py-4 px-4 bg-linear-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-bold text-sm hover:from-indigo-600 hover:to-violet-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        Mulai Isi Presensi
        <ArrowRight size={18} />
      </button>
      
    </form>
  );
}
