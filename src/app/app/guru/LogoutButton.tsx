'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
        });
        if (res.ok) {
          router.push('/login');
          router.refresh();
        } else {
          alert('Gagal melakukan logout');
          setLoading(false);
        }
      } catch (error) {
        alert('Terjadi kesalahan koneksi');
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 border border-slate-800/80 hover:border-rose-900/40 transition-all duration-200 cursor-pointer disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      Keluar Sistem
    </button>
  );
}
