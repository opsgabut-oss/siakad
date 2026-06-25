import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { BUKU_PAKET_DATABASE } from '@/lib/bukuPaket';
import jwt from 'jsonwebtoken';

async function getServiceAccountAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (!email || !rawKey) {
    throw new Error('Service account credentials not configured');
  }
  const privateKey = rawKey.replace(/['"]/g, '').replace(/\\n/g, '\n');

  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/generative-language',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const assertion = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain Google access token: ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

function getDefaultJp(mapelKode: string, kelasNum: number): number {
  const code = mapelKode.toUpperCase();
  if (code === 'IND' || code === 'INDONESIA') {
    return kelasNum <= 2 ? 7 : 6;
  }
  if (code === 'MTK' || code === 'MATEMATIKA') {
    return kelasNum === 1 ? 4 : 5;
  }
  if (code === 'IPAS') {
    return kelasNum <= 2 ? 0 : 5;
  }
  if (code === 'PP' || code === 'PANCASILA' || code === 'PKN') {
    return 4;
  }
  if (code === 'PAI' || code === 'PABP' || code === 'AGAMA') {
    return 3;
  }
  if (code === 'PJOK' || code === 'OR') {
    return 3;
  }
  if (code === 'SRI' || code === 'SB' || code === 'SENI') {
    return 3;
  }
  if (code === 'ING' || code === 'INGGRIS') {
    return 2;
  }
  if (code === 'JAWA' || code === 'BJAW') {
    return 2;
  }
  if (code === 'KAI' || code === 'AI' || code === 'KODING' || code === 'KKAI') {
    return 2;
  }
  if (code === 'P5' || code === 'KOKU' || code === 'KOKURIKULER' || code === 'PROJEK') {
    return 6;
  }
  return 4;
}


// Helper to parse meetings from text and split them cleanly
function splitMeetings(text: string) {
  if (!text) return { p1: '', p2: '' };
  
  const cleanText = text.trim();
  
  // Pattern to match "Pertemuan 1:" or "Pertemuan 1 -" or "Pertemuan 1"
  const p1Regex = /(?:^|\n)\*?\s*Pertemuan\s*1\s*[:\-]?\s*([\s\S]*?)(?=(?:\n\*?\s*Pertemuan\s*2|$))/i;
  const p2Regex = /(?:^|\n)\*?\s*Pertemuan\s*2\s*[:\-]?\s*([\s\S]*?)$/i;
  
  const p1Match = cleanText.match(p1Regex);
  const p2Match = cleanText.match(p2Regex);
  
  let p1 = p1Match ? p1Match[1].trim() : '';
  let p2 = p2Match ? p2Match[1].trim() : '';
  
  // Roman numerals fallback: "Pertemuan I" and "Pertemuan II"
  if (!p1 && !p2) {
    const p1RomanRegex = /(?:^|\n)\*?\s*Pertemuan\s*I\s*[:\-]?\s*([\s\S]*?)(?=(?:\n\*?\s*Pertemuan\s*II|$))/i;
    const p2RomanRegex = /(?:^|\n)\*?\s*Pertemuan\s*II\s*[:\-]?\s*([\s\S]*?)$/i;
    
    const p1RomanMatch = cleanText.match(p1RomanRegex);
    const p2RomanMatch = cleanText.match(p2RomanRegex);
    
    p1 = p1RomanMatch ? p1RomanMatch[1].trim() : '';
    p2 = p2RomanMatch ? p2RomanMatch[1].trim() : '';
  }
  
  // If no markers found, return whole text as p1, and empty as p2
  if (!p1 && !p2) {
    return {
      p1: cleanText,
      p2: ''
    };
  }
  
  return { p1, p2 };
}

// Helper to enhance chapter activities into 2 meetings with explicit minutes
function enhanceChapterActivities(chapter: any) {
  const parseClean = (text: string) => {
    return text.replace(/Pertemuan \d+:\s*/gi, '').trim();
  };

  const cleanPendahuluan = parseClean(chapter.kegiatanPendahuluan);
  const cleanInti = parseClean(chapter.kegiatanInti);
  const cleanPenutup = parseClean(chapter.kegiatanPenutup);

  const pend = splitMeetings(chapter.kegiatanPendahuluan);
  const inti = splitMeetings(chapter.kegiatanInti);
  const penut = splitMeetings(chapter.kegiatanPenutup);

  const p1Pend = `* Pertemuan 1 (10 Menit):
1. Guru membuka pembelajaran dengan salam pembuka, menyapa siswa, dan berdoa bersama.
2. Apersepsi: Guru mengaitkan pembelajaran hari ini dengan pengetahuan awal siswa: ${pend.p1 || cleanPendahuluan}.
3. Motivasi: Guru menyampaikan tujuan pembelajaran dan pentingnya materi ini untuk kehidupan sehari-hari.`;

  const p2Pend = `* Pertemuan 2 (10 Menit):
1. Guru menyapa siswa dengan hangat, menanyakan kesiapan belajar, dan berdoa.
2. Apersepsi: ${pend.p2 ? `Guru mengulas singkat materi yang dipelajari pada Pertemuan 1: ${pend.p2}` : 'Guru mengulas singkat materi yang dipelajari pada Pertemuan 1.'}
3. Pemberian Acuan: Guru menyampaikan kelanjutan kegiatan yang akan dilaksanakan hari ini.`;

  const p1Inti = `* Pertemuan 1 (50 Menit):
1. Orientasi Masalah: Guru memantik pemahaman siswa dengan media/pertanyaan terkait topik.
2. Diskusi & Investigasi: Guru membagi siswa ke dalam kelompok heterogen (4-5 orang).
3. Aktivitas Pembelajaran: Siswa secara berkelompok melakukan aktivitas utama: ${inti.p1 || cleanInti}.
4. Bimbingan Guru: Guru berkeliling membimbing kelompok yang memerlukan arahan.`;

  const p2Inti = `* Pertemuan 2 (50 Menit):
1. Pengolahan Data: ${inti.p2 ? `Siswa kembali ke kelompoknya untuk melanjutkan aktivitas pembelajaran: ${inti.p2}` : 'Siswa kembali ke kelompoknya untuk mendiskusikan hasil temuan sebelumnya dan merampungkan Lembar Kerja Peserta Didik (LKPD).'}
2. Menyajikan Hasil Karya: Perwakilan kelompok mempresentasikan hasil diskusi kelompok di depan kelas.
3. Evaluasi & Penguatan: Guru memberikan apresiasi, ulasan, serta penguatan atas hasil presentasi kelompok.`;

  const p1Penut = `* Pertemuan 1 (10 Menit):
1. Simpulan: Siswa dipandu oleh guru untuk menyimpulkan pembelajaran hari ini.
2. Refleksi: ${penut.p1 || cleanPenutup || 'Guru menanyakan apa saja kesulitan siswa dalam pembelajaran hari ini.'}
3. Tindak Lanjut: Siswa diberikan tugas mandiri/bacaan singkat untuk pertemuan berikutnya.`;

  const p2Penut = `* Pertemuan 2 (10 Menit):
1. Simpulan Akhir: Siswa bersama guru menyimpulkan keseluruhan kompetensi yang telah dipelajari dari Pertemuan 1 & 2.
2. Asesmen Penutup: ${penut.p2 ? `Guru memberikan asesmen/refleksi: ${penut.p2}` : 'Guru memberikan tes evaluasi tertulis mandiri singkat.'}
3. Tindak Lanjut & Doa: Guru menutup pembelajaran dengan doa bersama dan salam penutup.`;

  const getNumericKelas = (nama: string): number => {
    const clean = nama.toUpperCase();
    if (clean.includes("VI")) return 6;
    if (clean.includes("IV")) return 4;
    if (clean.includes("V")) return 5;
    if (clean.includes("III")) return 3;
    if (clean.includes("II")) return 2;
    if (clean.includes("I")) return 1;
    const match = clean.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return 1;
  };
  const classNum = getNumericKelas(chapter.kelas);
  const jpVal = getDefaultJp(chapter.mapelKode, classNum);
  const alokasiWaktuStr = `${jpVal} JP (${jpVal} x 35 Menit) - 2 Pertemuan`;

  const bahanAjar = `BAHAN AJAR UTAMA: ${chapter.judulModul || chapter.judulBab}
  
1. Konsep Utama Pembelajaran
Bahan ajar ini mengacu pada kompetensi dasar materi ${chapter.judulBab}. Kompetensi awal siswa: ${chapter.kompetensiAwal || 'Memahami konsep dasar materi.'}.

2. Pemahaman Bermakna & Pertanyaan Pemantik
- Manfaat Belajar: ${chapter.pemahamanBermakna || 'Memahami kegunaan materi dalam kehidupan sehari-hari.'}
- Pertanyaan Pemantik: ${chapter.pertanyaanPemantik || 'Mengapa kita perlu mempelajari materi ini?'}

3. Rincian Materi Pendukung
Guru memberikan pengantar materi secara tatap muka sebelum memulai aktivitas kelompok. Siswa mengacu pada buku paket resmi Kurikulum Merdeka ${chapter.daftarPustaka || ''} untuk menyelesaikan tugas terstruktur pada Lembar Kerja Peserta Didik (LKPD).`;

  const soalAsesmen = `SOAL ASESMEN & RUBRIK PENILAIAN:
  
1. Asesmen Diagnostik (Sebelum Pembelajaran)
- Jenis: Tanya jawab lisan singkat
- Contoh Pertanyaan:
  a. Apakah kalian pernah mendengar istilah ${chapter.judulBab}?
  b. Apa yang kalian ketahui tentang materi ini?

2. Asesmen Formatif (Selama Pembelajaran)
- Jenis: Observasi partisipasi kelompok dan pengerjaan LKPD
- Rubrik Penilaian Kelompok:
  * Kerjasama Kelompok: Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Bimbingan (1)
  * Ketepatan Jawaban LKPD: Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Bimbingan (1)

3. Asesmen Sumatif (Akhir Pembelajaran)
- Jenis: Tes tertulis mandiri (3 soal esai singkat)
  a. Jelaskan pengertian atau konsep dasar dari ${chapter.judulBab}!
  b. Berikan 2 contoh konkret penerapan materi ini dalam kehidupan sehari-hari!
  c. Selesaikan soal kasus yang relevan dengan topik ini!
- Kunci Jawaban: (Menyesuaikan dengan materi pembelajaran)
- Rubrik Penilaian: Skor 0-100 (Ketepatan penjelasan dan relevansi jawaban)`;

  const defaultRealisasi: Record<string, string> = {
    "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia": "Diwujudkan melalui doa bersama pembuka/penutup kelas serta bersikap sopan kepada sesama.",
    "Berkebinekaan Global": "Diwujudkan melalui penghargaan atas perbedaan pendapat saat kelompok mempresentasikan hasil karyanya.",
    "Gotong Royong": "Diwujudkan melalui kerjasama kelompok yang solid untuk mendiskusikan materi pelajaran dan menyusun LKPD.",
    "Mandiri": "Diwujudkan melalui sikap disiplin dalam menyelesaikan tugas/kuis individu secara sungguh-sungguh.",
    "Bernalar Kritis": "Diwujudkan melalui pemecahan masalah nyata yang logis dan analisis data yang dipelajari.",
    "Kreatif": "Diwujudkan melalui presentasi kelompok atau hasil penyelesaian tugas dengan ide orisinal.",
    "Literasi dan Numerasi Berkelanjutan": "Diwujudkan melalui kemampuan memahami grafik/teks bacaan dan penerapan konsep kuantitatif.",
    "Adaptif dan Berkelanjutan": "Diwujudkan melalui respon positif terhadap lingkungan belajar baru dan peduli kebersihan ruang kelas."
  };

  const newProfilLulusan = (chapter.profilLulusan || ["Penalaran Kritis", "Kolaborasi", "Kemandirian"]).map((p: string) => {
    if (p === "Penalaran Kritis" || p === "Penalaran Kritis (Critical Thinking)") return "Bernalar Kritis";
    if (p === "Kolaborasi" || p === "Gotong Royong (Collaboration)") return "Gotong Royong";
    if (p === "Kemandirian" || p === "Kemandirian (Independence)") return "Mandiri";
    if (p === "Kreativitas" || p === "Kreativitas (Creativity)") return "Kreatif";
    if (p === "Keimanan dan Ketakwaan" || p === "Keimanan dan Ketakwaan (terhadap Tuhan YME & Berakhlak Mulia)") return "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia";
    return p;
  });

  const profilLulusanRealisasi: Record<string, string> = {};
  newProfilLulusan.forEach((p: string) => {
    profilLulusanRealisasi[p] = defaultRealisasi[p] || "Diwujudkan melalui aktivitas proses pembelajaran.";
  });

  return {
    ...chapter,
    alokasiWaktu: alokasiWaktuStr,
    kegiatanPendahuluan: `${p1Pend}\n\n${p2Pend}`,
    kegiatanInti: `${p1Inti}\n\n${p2Inti}`,
    kegiatanPenutup: `${p1Penut}\n\n${p2Penut}`,
    profilLulusan: newProfilLulusan,
    profilLulusanRealisasi,
    bahanAjar,
    soalAsesmen
  };
}

function generateOfflineTemplate(mapelNama: string, kelasNama: string, tpDeskripsi: string, topik: string, mapelKode: string) {
  const finalTopic = tpDeskripsi || topik || 'Materi Pembelajaran';
  const cleanTopic = finalTopic.replace(/^\d+\.\s*/, ''); // hilangkan nomor jika ada
  
  const getNumericKelas = (nama: string): number => {
    const clean = nama.toUpperCase();
    if (clean.includes("VI")) return 6;
    if (clean.includes("IV")) return 4;
    if (clean.includes("V")) return 5;
    if (clean.includes("III")) return 3;
    if (clean.includes("II")) return 2;
    if (clean.includes("I")) return 1;
    const match = clean.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return 1;
  };
  const classNum = getNumericKelas(kelasNama);
  const jpVal = getDefaultJp(mapelKode, classNum);
  const alokasiWaktuStr = `${jpVal} JP (${jpVal} x 35 Menit) - 2 Pertemuan`;

  const bahanAjar = `BAHAN AJAR UTAMA: ${mapelNama} - ${cleanTopic}
  
1. Konsep Utama
Bahan ajar ini dirancang untuk mendampingi proses pembelajaran kelas ${kelasNama} pada materi ${cleanTopic}.

2. Pemahaman Bermakna
Peserta didik dapat menyadari manfaat penting dari mempelajari ${cleanTopic.toLowerCase()} dalam aktivitas sehari-hari.

3. Ringkasan Materi Pendukung
Guru menjelaskan konsep dasar materi secara interaktif sebelum siswa berkelompok. Siswa membaca buku paket Kurikulum Merdeka untuk menyelesaikan tugas kelompok pada Lembar Kerja Peserta Didik (LKPD).`;

  return {
    judul: `Modul Ajar ${mapelNama || 'Mata Pelajaran'} - ${cleanTopic} - Kelas ${kelasNama || 'SD'}`,
    semester: "Ganjil",
    alokasiWaktu: alokasiWaktuStr,
    kompetensiAwal: `Siswa telah memahami konsep dasar awal yang berkaitan dengan ${cleanTopic.toLowerCase()}.`,
    profilLulusan: [
      "Bernalar Kritis",
      "Gotong Royong",
      "Mandiri"
    ],
    profilLulusanRealisasi: {
      "Bernalar Kritis": "Diwujudkan melalui proses mengidentifikasi, mengklarifikasi, mengolah informasi, dan memecahkan masalah sederhana.",
      "Gotong Royong": "Diwujudkan melalui kegiatan kelompok, kolaborasi menyelesaikan tugas, atau sikap saling membantu.",
      "Mandiri": "Diwujudkan melalui pengerjaan tugas individu secara bertanggung jawab dan regulasi emosi belajar."
    },
    saranaPrasarana: "Buku teks pelajaran, papan tulis, alat tulis, lembar kerja siswa (LKPD), proyektor/media cetak relevan.",
    targetPeserta: "Siswa Reguler (Umum)",
    modelPembelajaran: "Tatap Muka / Problem-Based Learning",
    tujuanPembelajaranText: `1. Peserta didik dapat memahami konsep ${cleanTopic.toLowerCase()} dengan benar.\n2. Peserta didik dapat mengidentifikasi dan memecahkan masalah sehari-hari yang berkaitan dengan ${cleanTopic.toLowerCase()}.`,
    pemahamanBermakna: `Peserta didik dapat menyadari manfaat penting dari mempelajari ${cleanTopic.toLowerCase()} dalam aktivitas sehari-hari.`,
    pertanyaanPemantik: `1. Apa yang terlintas di pikiran kalian ketika mendengar kata ${cleanTopic.toLowerCase()}?\n2. Mengapa kita perlu mempelajari ${cleanTopic.toLowerCase()}?`,
    
    kegiatanPendahuluan: `* Pertemuan 1 (10 Menit):
1. Orientasi: Guru membuka pelajaran dengan salam pembuka, menanyakan kabar siswa, dan memeriksa kehadiran siswa.
2. Apersepsi: Guru mengaitkan materi sebelumnya dengan konsep ${cleanTopic.toLowerCase()}.
3. Motivasi: Guru menjelaskan tujuan pembelajaran dan manfaat mempelajari ${cleanTopic.toLowerCase()} dalam kehidupan sehari-hari.

* Pertemuan 2 (10 Menit):
1. Orientasi: Guru menyapa siswa dan memimpin doa bersama sebelum memulai pembelajaran.
2. Apersepsi: Guru mengulas kembali konsep dasar ${cleanTopic.toLowerCase()} yang sudah dipelajari di pertemuan pertama.
3. Pemberian Acuan: Guru menyampaikan rencana kegiatan inti lanjutan untuk pertemuan kedua.`,

    kegiatanInti: `* Pertemuan 1 (50 Menit):
1. Orientasi Siswa pada Masalah: Guru menyajikan contoh kasus atau gambar menarik di papan tulis terkait dengan ${cleanTopic.toLowerCase()}.
2. Mengorganisasikan Siswa: Guru membagi kelas menjadi beberapa kelompok kecil berisi 4-5 siswa yang heterogen dan membagikan Lembar Kerja Peserta Didik (LKPD).
3. Membimbing Penyelidikan: Siswa melakukan diskusi kelompok secara aktif untuk menyelesaikan masalah dalam LKPD. Guru berkeliling memberikan bimbingan.
4. Menyajikan Hasil Karya Awal: Perwakilan kelompok mempresentasikan analisis awal mereka tentang ${cleanTopic.toLowerCase()}.

* Pertemuan 2 (50 Menit):
1. Mengembangkan Hasil Karya: Siswa kembali ke kelompok masing-masing untuk menyempurnakan solusi pemecahan masalah.
2. Menyajikan Hasil Karya Akhir: Setiap kelompok secara bergantian mempresentasikan produk hasil pemecahan masalah atau kesimpulan akhir kelompok di depan kelas.
3. Menganalisis & Mengevaluasi: Kelompok lain memberikan masukan atau pertanyaan. Guru memberikan klarifikasi, ulasan, serta penguatan materi ${cleanTopic.toLowerCase()}.`,

    kegiatanPenutup: `* Pertemuan 1 (10 Menit):
1. Simpulan Awal: Siswa bersama guru menyimpulkan inti pembelajaran pertemuan pertama.
2. Refleksi: Guru menanyakan perasaan siswa mengenai proses belajar hari ini.
3. Tindak Lanjut: Guru meminta siswa mengamati penerapan ${cleanTopic.toLowerCase()} di rumah untuk dibahas pertemuan berikutnya.

* Pertemuan 2 (10 Menit):
1. Rangkuman Akhir: Siswa bersama guru merangkum seluruh materi tentang ${cleanTopic.toLowerCase()} dari pertemuan 1 & 2.
2. Evaluasi: Guru memberikan kuis tertulis mandiri singkat untuk mengecek pemahaman akhir siswa.
3. Refleksi & Penutup: Guru memberikan apresiasi atas kerja kelompok siswa, doa bersama, dan salam penutup.`,

    asesmenDiagnostik: "Tanya jawab lisan secara klasikal untuk mengukur kemampuan awal siswa sebelum pembelajaran dimulai.",
    asesmenFormatif: "Observasi sikap profil lulusan selama pembelajaran, penilaian kinerja kelompok, serta penilaian hasil pengerjaan LKPD.",
    asesmenSumatif: "Tes tertulis mandiri di akhir materi yang terdiri dari 5 soal isian singkat atau pilihan ganda.",
    lkpd: `LEMBAR KERJA PESERTA DIDIK (LKPD) KELOMPOK\nMata Pelajaran: ${mapelNama || 'Mata Pelajaran'}\nMateri: ${cleanTopic}\n\nAnggota Kelompok:\n1. .....................\n2. .....................\n3. .....................\n4. .....................\n\nPetunjuk:\n1. Tuliskan nama anggota kelompok Anda.\n2. Diskusikan dan jawablah pertanyaan di bawah ini bersama teman sekelompok Anda:\n   a. Tuliskan penjelasan singkat mengenai ${cleanTopic.toLowerCase()} menurut pemahaman kelompok Anda!\n   b. Sebutkan 3 contoh penerapan atau manfaat ${cleanTopic.toLowerCase()} yang Anda temukan di lingkungan sekitar rumah Anda!\n   c. Selesaikan soal/tugas kasus yang telah ditulis guru di papan tulis bersama kelompok!`,
    glosarium: `${cleanTopic}: Tema pembelajaran utama yang dipelajari siswa guna menunjang target kompetensi pada bab berjalan.`,
    daftarPustaka: `Buku Panduan Guru dan Buku Siswa Mata Pelajaran Kelas ${kelasNama || 'SD'} Kurikulum Merdeka, Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2025.`,
    bahanAjar,
    soalAsesmen: `SOAL ASESMEN & RUBRIK PENILAIAN:
  
1. Asesmen Diagnostik (Sebelum Pembelajaran)
- Jenis: Tanya jawab lisan
- Contoh Pertanyaan:
  a. Apa yang kalian ketahui tentang ${cleanTopic.toLowerCase()}?
  b. Pernahkah kalian menggunakannya dalam kehidupan sehari-hari?

2. Asesmen Formatif (Selama Pembelajaran)
- Jenis: Observasi sikap profil lulusan dan penilaian keaktifan presentasi kelompok
- Rubrik Penilaian Sikap (Gotong Royong & Bernalar Kritis):
  * Berkembang Sangat Baik (A) | Berkembang Sesuai Harapan (B) | Mulai Berkembang (C) | Belum Berkembang (D)

3. Asesmen Sumatif (Akhir Pembelajaran)
- Jenis: Tes tertulis mandiri (3 soal isian singkat)
  a. Apa manfaat utama dari mempelajari ${cleanTopic.toLowerCase()}?
  b. Tuliskan satu masalah nyata yang dapat diselesaikan dengan konsep ${cleanTopic.toLowerCase()}!
  c. Bagaimana kesimpulan kalian tentang materi ini?
- Kunci Jawaban: (Menyesuaikan dengan aktivitas kelas)
- Rubrik Penilaian: Setiap soal benar bernilai 30 poin, kebersihan tulisan bernilai 10 poin.`
  };
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'GURU') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  // Ambil data dari request
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Request body tidak valid' }, { status: 400 });
  }

  const { 
    tujuanPembelajaranId, 
    mataPelajaranId, 
    kelasId, 
    topik, 
    bukuPaketChapterId,
    apiKey: clientApiKey 
  } = body;

  // Ambil detail mapel
  let mapelNama = '';
  let mapelKode = '';
  if (mataPelajaranId) {
    const mapel = await prisma.mataPelajaran.findUnique({
      where: { id: mataPelajaranId }
    });
    if (mapel) {
      mapelNama = mapel.nama;
      mapelKode = mapel.kode;
    }
  }

  // Ambil detail kelas
  let kelasNama = '';
  if (kelasId) {
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId }
    });
    if (kelas) kelasNama = kelas.nama;
  }

  // Ambil detail tujuan pembelajaran
  let tpDeskripsi = '';
  if (tujuanPembelajaranId) {
    const tp = await prisma.tujuanPembelajaran.findUnique({
      where: { id: tujuanPembelajaranId }
    });
    if (tp) tpDeskripsi = tp.deskripsi;
  }

  // Cari chapter dari Buku Paket Database offline jika ada
  const selectedChapter = bukuPaketChapterId 
    ? BUKU_PAKET_DATABASE.find(c => c.id === bukuPaketChapterId)
    : null;

  const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY || '';
  const hasServiceAccount = !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

  // Jika tidak ada API Key dan tidak ada Service Account, gunakan Offline Generator
  if (!apiKey && !hasServiceAccount) {
    if (selectedChapter) {
      return NextResponse.json(enhanceChapterActivities(selectedChapter));
    }
    const offlineResult = generateOfflineTemplate(mapelNama, kelasNama, tpDeskripsi, topik, mapelKode);
    return NextResponse.json(offlineResult);
  }

  try {
    // Susun prompt untuk Gemini
    let prompt = `Buatkan Modul Ajar Kurikulum Merdeka tingkat Sekolah Dasar (SD) yang sangat lengkap dan profesional (bukan ringkasan) berdasarkan parameter berikut:
- Mata Pelajaran: ${mapelNama || 'Mata Pelajaran SD'}
- Kelas: ${kelasNama || 'SD'}
- Tujuan Pembelajaran (TP): ${tpDeskripsi || topik || 'Materi Pembelajaran'}
- Topik / Tema Tambahan: ${topik || '-'}\n`;

    if (selectedChapter) {
      prompt += `\nAnda wajib mengacu pada kerangka buku paket resmi berikut untuk menyusun materi:\n`;
      prompt += `- Judul Bab: ${selectedChapter.judulBab}\n`;
      prompt += `- Kompetensi Awal: ${selectedChapter.kompetensiAwal}\n`;
      prompt += `- Tujuan Pembelajaran Buku: ${selectedChapter.tujuanPembelajaranText}\n`;
      prompt += `- Pemahaman Bermakna Buku: ${selectedChapter.pemahamanBermakna}\n`;
      prompt += `- Pertanyaan Pemantik Buku: ${selectedChapter.pertanyaanPemantik}\n`;
      prompt += `- Kegiatan Pembelajaran Buku: ${selectedChapter.kegiatanPendahuluan} ${selectedChapter.kegiatanInti} ${selectedChapter.kegiatanPenutup}\n`;
      prompt += `- Lembar Kerja Peserta Didik (LKPD) Buku: ${selectedChapter.lkpd}\n`;
      prompt += `- Rujukan Daftar Pustaka: ${selectedChapter.daftarPustaka}\n\n`;
      prompt += `Tugas Anda adalah memodifikasi, memperluas, dan melengkapi seluruh bagian di atas menjadi draf modul ajar utuh kelas yang mengesankan, detail, dan formal.`;
    }

    prompt += `\n\nAnda harus menghasilkan output dalam format JSON objek dengan kunci-kunci berikut (tanpa markdown wrapper \`\`\`json atau sejenisnya, hanya string JSON mentah utuh):
{
  "judul": "Judul modul ajar yang menarik dan sesuai dengan materi (contoh: Modul Ajar Matematika - Pembagian Pecahan Kelas V)",
  "semester": "Ganjil atau Genap (sesuaikan dengan materi pembelajaran)",
  "alokasiWaktu": "[Jumlah] JP x 35 Menit ([Jumlah] Pertemuan) (contoh: 4 JP x 35 Menit (2 Pertemuan))",
  "kompetensiAwal": "Tuliskan pengetahuan dasar atau prasyarat yang harus dimiliki peserta didik sebelum mempelajari topik ini",
  "profilLulusan": [
    "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
    "Berkebinekaan Global",
    "Gotong Royong",
    "Mandiri",
    "Bernalar Kritis",
    "Kreatif",
    "Literasi dan Numerasi Berkelanjutan",
    "Adaptif dan Berkelanjutan"
  ],
  "profilLulusanRealisasi": {
    "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Berkebinekaan Global": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Gotong Royong": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Mandiri": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Bernalar Kritis": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Kreatif": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Literasi dan Numerasi Berkelanjutan": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]",
    "Adaptif dan Berkelanjutan": "Diwujudkan melalui [kegiatan di kelas sesuai deskripsi yang relevan]"
  },
  "saranaPrasarana": "Wajib menggunakan format ini:\\nMedia: [Daftar media digital/non-digital, alat peraga, atau papan tulis]\\nSumber Belajar: [Buku teks Kemendikdasmen, lembar kegiatan, lingkungan sekitar, dll]",
  "targetPeserta": "Pilih salah satu: 'Peserta didik reguler' / 'Kesulitan belajar' / 'Pencapaian tinggi'",
  "modelPembelajaran": "Pilihan model (contoh: 'PBL' / 'PjBL' / 'Discovery Learning' / 'Inquiry Learning' / 'Direct Instruction')",
  "tujuanPembelajaranText": "Wajib berupa butir bernomor dengan format:\\n1. Melalui kegiatan [aktivitas belajar], peserta didik mampu [Kata Kerja Operasional (KKO)] [materi pokok] dengan [kriteria keberhasilan].\\n2. Melalui kegiatan [aktivitas belajar], peserta didik mampu [Kata Kerja Operasional (KKO)] [materi pokok] dengan [kriteria keberhasilan].",
  "pemahamanBermakna": "Tuliskan manfaat jangka panjang yang akan diperoleh peserta didik setelah mempelajari materi ini",
  "pertanyaanPemantik": "Tuliskan pertanyaan awal yang kontekstual dengan kehidupan anak-anak usia SD untuk memicu rasa ingin tahu (pisahkan dengan baris baru '\\n')",
  "kegiatanPendahuluan": "Wajib diberi alokasi waktu menit di judulnya dan dijabarkan mengikuti format:\\nKegiatan Pendahuluan ([Jumlah] Menit)\\nOrientasi: [Guru membuka salam, memeriksa kehadiran, doa/sikap syukur]\\nApersepsi: [Guru mengaitkan materi dengan pengalaman sehari-hari siswa atau pemantik visual/lisan]\\nMotivasi: [Guru menyampaikan tujuan pembelajaran, aktivitas, dan manfaat praktisnya]",
  "kegiatanInti": "Wajib diberi alokasi waktu menit di judulnya, sesuaikan penamaan tahap dengan model pembelajaran yang dipilih (contoh jika PBL):\\nKegiatan Inti ([Jumlah] Menit)\\nTahap 1: Pemberian Stimulus / Masalah\\n  Peserta didik mengamati...\\nTahap 2: Pengorganisasian Belajar\\n  Guru mengelompokkan...\\nTahap 3: Pembimbingan dan Penyelidikan\\n  Peserta didik mencari data...\\nTahap 4: Penyajian Hasil\\n  Setiap kelompok mengomunikasikan...\\nTahap 5: Evaluasi dan Refleksi Masalah\\n  Guru memberikan konfirmasi...",
  "kegiatanPenutup": "Wajib diberi alokasi waktu menit di judulnya dan dijabarkan mengikuti format:\\nKegiatan Penutup ([Jumlah] Menit)\\nSimpulan: [Peserta didik bersama guru merangkum poin penting]\\nRefleksi & Asesmen Akhir: [Guru memberikan kuis pendek/umpan balik lisan]\\nTindak Lanjut: [Guru memberikan arahan tugas mandiri/materi berikutnya]\\nDoa & Salam: [Doa penutup kelas dan salam]",
  "asesmenDiagnostik": "[Bentuk: Pertanyaan lisan singkat / Kuis gambar]",
  "asesmenFormatif": "[Bentuk: Lembar observasi sikap/profil lulusan, rubrik keaktifan kelompok, performa unjuk kerja]",
  "asesmenSumatif": "[Bentuk: Tes tertulis pilihan ganda, isian singkat, atau tes kinerja]",
  "bahanAjar": "Uraian rangkuman konsep dasar materi secara naratif, infografis, atau poin-poin penting yang disesuaikan dengan tingkat pemahaman anak usia SD. Ditulis minimal 400 kata, tebal, kaya akan materi ilmiah dan edukatif.",
  "lkpd": "Tuliskan Lembar Kerja Peserta Didik (LKPD). Sediakan ruang untuk menuliskan nama kelompok/individu, petunjuk pengerjaan langkah demi langkah untuk siswa SD, dan kolom jawaban/gambar hasil kerja.",
  "soalAsesmen": "Uraian detail instrumen Asesmen & Rubrik Penilaian lengkap, mencakup rubrik kriteria penilaian aspek pengetahuan, keterampilan, atau sikap profil lulusan yang memuat skor beserta indikator ketercapaiannya dalam bentuk tabel markdown atau daftar rapi.",
  "glosarium": "Definisi istilah-istilah penting dalam materi ini",
  "daftarPustaka": "Daftar pustaka acuan resmi (contoh: Buku Siswa dan Buku Guru Mata Pelajaran Kelas V SD Kemendikdasmen 2025)"
}

Catatan penting:
- Bagi seluruh kegiatan pembelajaran menjadi Pertemuan 1 dan Pertemuan 2 secara eksplisit untuk menggambarkan pembagian 2 hari belajar agar siswa tidak jenuh, serta cantumkan alokasi waktu menit di setiap pertemuan (Pendahuluan: 10 Menit, Inti: 50 Menit, Penutup: 10 Menit).
- Setiap konten deskripsi kegiatan (pendahuluan, inti, penutup) harus ditulis secara lengkap, panjang, dan rinci, tidak boleh disingkat.
- Gunakan bahasa sesuai usia siswa (SD).
- Gunakan contoh nyata Indonesia/lingkungan siswa.
- Hindari hafalan tanpa konteks.
- Pastikan setiap kegiatan menghasilkan bukti kinerja yang bisa dinilai (KBC).
- Gunakan bahasa Indonesia yang baik, benar, formal, dan santun.
- Jangan menyertakan tanda petik tiga (\`\`\`json) di awal maupun akhir output. Berikan JSON valid mentah.`;

    // Panggil Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (apiKey) {
      headers['x-goog-api-key'] = apiKey;
    } else {
      const saToken = await getServiceAccountAccessToken();
      headers['Authorization'] = `Bearer ${saToken}`;
    }

    // Set timeout 15 detik agar tidak hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Gemini API returned error status:', response.status, await response.text());
      if (selectedChapter) return NextResponse.json(enhanceChapterActivities(selectedChapter));
      const offlineResult = generateOfflineTemplate(mapelNama, kelasNama, tpDeskripsi, topik, mapelKode);
      return NextResponse.json(offlineResult);
    }

    const responseData = await response.json();
    const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('Format respon AI tidak valid');
    }

    // Parsing JSON hasil dari Gemini
    const result = JSON.parse(textResponse.trim());
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Gemini API failed or timed out. Falling back to offline generator.', error.message || error);
    if (selectedChapter) return NextResponse.json(enhanceChapterActivities(selectedChapter));
    const offlineResult = generateOfflineTemplate(mapelNama, kelasNama, tpDeskripsi, topik, mapelKode);
    return NextResponse.json(offlineResult);
  }
}
