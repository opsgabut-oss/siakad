'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ namaSekolah: string; logoSekolahUrl: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/public/profile')
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch((err) => console.error('Failed to load school profile', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat login');
      }

      // Router redirect sesuai role
      const role = data.user.role;
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'GURU') {
        router.push('/guru/dashboard');
      } else if (role === 'GURU_BK' || role === 'KEPALA_SEKOLAH') {
        router.push('/bk/dashboard');
      } else if (role === 'SISWA' || role === 'ORANG_TUA') {
        router.push('/siswa/dashboard');
      } else {
        router.push('/login');
      }
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Efek Latar Belakang Gradien */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[150px] pointer-events-none" />

      {/* Card Form */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:border-slate-700/50">
        
        {/* Header App */}
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          {profile?.logoSekolahUrl ? (
            <img src={profile.logoSekolahUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-contain bg-slate-950/20 mb-4" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-500 to-violet-600 text-white font-bold text-2xl shadow-lg shadow-indigo-500/20 mb-4 select-none">
              SK
            </div>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase truncate max-w-full px-2" title={profile?.namaSekolah || 'SIAKAD'}>
            {profile?.namaSekolah || 'SIAKAD'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sistem Informasi Akademik Sekolah</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 rounded-2xl text-sm mb-6 flex items-center gap-2 animate-pulse">
            <span className="font-bold">⚠️ Error:</span> {error}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Input Username */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block px-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                disabled={loading}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block px-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                disabled={loading}
                className="w-full pl-11 pr-12 py-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-hidden"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Button Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-semibold text-sm hover:from-indigo-600 hover:to-violet-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses Masuk...
              </>
            ) : (
              'Masuk ke Akun'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
