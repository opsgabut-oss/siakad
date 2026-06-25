import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

const isValidImageUrl = (url: string | null | undefined) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image/');
};

export default async function SuratPanggilanPrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    return notFound();
  }

  const kasus = await prisma.catatanBK.findUnique({
    where: { id },
    include: {
      siswa: {
        include: {
          kelas: true,
        },
      },
    },
  });

  if (!kasus) {
    return notFound();
  }

  // Fetch School Profile
  const profil = await prisma.profilSekolah.findFirst();

  const permasalahan = decrypt(kasus.permasalahan);
  const tindakan = decrypt(kasus.tindakan);
  const tanggalSurat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const hariPertemuan = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggalPertemuan = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-16 max-w-3xl mx-auto font-serif relative">
      {/* Tombol Cetak Manual (Hanya tampil di screen, sembunyi saat cetak) */}
      <div 
        className="absolute top-4 right-4 print:hidden flex gap-2"
        dangerouslySetInnerHTML={{ __html: `
          <button onclick="window.print()" class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-colors animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Dokumen
          </button>
        `}}
      />

      {/* CSS Khusus Cetak */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        @page {
          size: A4;
          margin: 2cm;
        }
      `}} />

      {/* Kop Surat Sekolah */}
      <div className="border-b-4 border-double border-black pb-4 text-center relative flex items-center justify-center min-h-[100px]">
        {isValidImageUrl(profil?.logoPemdaUrl) && (
          <img 
            src={profil!.logoPemdaUrl!} 
            alt="Logo Pemda" 
            className="w-16 h-16 absolute left-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        {isValidImageUrl(profil?.logoSekolahUrl) && (
          <img 
            src={profil!.logoSekolahUrl!} 
            alt="Logo Sekolah" 
            className="w-16 h-16 absolute right-0 top-1/2 -translate-y-1/2 object-contain print:block"
          />
        )}
        <div className={`flex-1 text-center space-y-1 ${isValidImageUrl(profil?.logoPemdaUrl) ? 'pl-20' : ''} ${isValidImageUrl(profil?.logoSekolahUrl) ? 'pr-20' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider leading-none">
            {profil?.pemerintah || 'Pemerintah Kabupaten Pati'}
          </h3>
          <h2 className="text-sm font-bold uppercase tracking-wider leading-none">
            {profil?.dinas || 'Dinas Pendidikan dan Kebudayaan'}
          </h2>
          <h1 className="text-lg font-black uppercase tracking-wide leading-tight">
            {profil?.namaSekolah || 'SD Negeri Wedusan'}
          </h1>
          <p className="text-[11px] italic leading-tight">
            {profil?.alamat || 'Jl. Puncel - Ngablak KM. 05 Desa Wedusan, Kec. Dukuhseti, Kab. Pati (59158)'}
          </p>
          {(profil?.telepon || profil?.email) && (
            <p className="text-[9px] italic leading-none">
              {profil?.telepon && `Telp: ${profil.telepon}`} {profil?.email && `• Email: ${profil.email}`} {profil?.website && `• Web: ${profil.website}`}
            </p>
          )}
        </div>
      </div>

      {/* Detail Surat */}
      <div className="mt-8 flex justify-between text-sm">
        <div className="space-y-0.5">
          <p><span className="inline-block w-20">Nomor</span>: 421.2 / BK / {kasus.id.substring(0, 8).toUpperCase()} / 2026</p>
          <p><span className="inline-block w-20">Lampiran</span>: -</p>
          <p><span className="inline-block w-20">Hal</span>: *Surat Panggilan Orang Tua / Wali*</p>
        </div>
        <div>
          <p>{profil?.namaSekolah.split(' ')[2] || 'Wedusan'}, {tanggalSurat}</p>
        </div>
      </div>

      {/* Alamat Penerima */}
      <div className="mt-8 text-sm">
        <p>Kepada Yth.</p>
        <p className="font-bold">Orang Tua / Wali Murid dari {kasus.siswa.nama}</p>
        <p>Kelas: {kasus.siswa.kelas.nama}</p>
        <p>di Tempat</p>
      </div>

      {/* Isi Surat */}
      <div className="mt-8 text-sm leading-relaxed space-y-4">
        <p>Dengan hormat,</p>
        <p className="text-justify indent-8">
          Sehubungan dengan perlunya koordinasi perkembangan bimbingan akademik dan perilaku putra/putri Bapak/Ibu di sekolah, kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali Murid pada:
        </p>

        <div className="pl-12 space-y-1">
          <p><span className="inline-block w-28">Hari, Tanggal</span>: {hariPertemuan}, {tanggalPertemuan}</p>
          <p><span className="inline-block w-28">Waktu</span>: 09.00 WIB s.d Selesai</p>
          <p><span className="inline-block w-28">Tempat</span>: Ruang Bimbingan Konseling (BK) {profil?.namaSekolah || 'SD Negeri Wedusan'}</p>
          <p><span className="inline-block w-28">Keperluan</span>: Koordinasi Pembinaan dan Pendampingan Siswa</p>
        </div>

        <p className="text-justify indent-8">
          Mengingat pentingnya koordinasi ini demi masa depan belajar putra/putri Bapak/Ibu, kehadiran Bapak/Ibu tepat pada waktunya sangat kami harapkan.
        </p>
        <p>Demikian surat panggilan ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-16 grid grid-cols-2 text-center text-sm gap-8">
        <div>
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div className="h-20" />
          <p className="font-bold underline">{profil?.namaKepsek || 'Sudarto, S.Pd'}</p>
          {profil?.nipKepsek && (
            <p className="text-xs text-slate-500">NIP. {profil.nipKepsek}</p>
          )}
        </div>
        <div>
          <p>&nbsp;</p>
          <p>Guru BK / Wali Kelas</p>
          <div className="h-20" />
          <p className="font-bold underline">Budi Santoso, S.Pd.</p>
          <p className="text-xs text-slate-500">NIP. 198503152010011002</p>
        </div>
      </div>

      {/* Script Auto Print */}
      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(() => {
          window.print();
        }, 500);
      `}} />
    </div>
  );
}
