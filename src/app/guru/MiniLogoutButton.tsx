'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

export default function MiniLogoutButton() {
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
      className="flex flex-col items-center gap-1 text-[10px] font-semibold text-rose-500 hover:text-rose-400 disabled:opacity-50 transition-colors bg-transparent border-0 cursor-pointer outline-hidden"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin text-rose-500" />
      ) : (
        <LogOut size={18} />
      )}
      Keluar
    </button>
  );
}
