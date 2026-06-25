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

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== 'GURU' && user.role !== 'ADMIN')) {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { mataPelajaranId, kelasId, apiKey: clientApiKey } = body;

    if (!mataPelajaranId || !kelasId) {
      return NextResponse.json({ message: 'Parameter tidak lengkap' }, { status: 400 });
    }

    // Ambil detail mapel & kelas
    const mapel = await prisma.mataPelajaran.findUnique({ where: { id: mataPelajaranId } });
    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });

    if (!mapel || !kelas) {
      return NextResponse.json({ message: 'Mapel atau kelas tidak ditemukan' }, { status: 404 });
    }

    // Map database codes to book codes if there are mismatches
    const dbKode = mapel.kode.toUpperCase();
    const bookKode = 
      (dbKode === 'PABP' || dbKode.startsWith('PAI') || dbKode.includes('PABP') || dbKode.includes('AGAMA')) ? 'PAI' : 
      dbKode === 'SB' ? 'SRI' : 
      dbKode === 'BJAW' ? 'JAWA' : 
      (dbKode === 'KAI' || dbKode === 'AI' || dbKode === 'KODING' || dbKode === 'KKAI') ? 'KAI' :
      (dbKode === 'P5' || dbKode === 'KOKU' || dbKode === 'KOKURIKULER' || dbKode === 'PROJEK') ? 'P5' :
      dbKode;

    // Helper to extract numeric class
    const getNumericKelas = (nama: string): number | null => {
      const clean = nama.toUpperCase();
      if (clean.includes("VI")) return 6;
      if (clean.includes("IV")) return 4;
      if (clean.includes("V")) return 5;
      if (clean.includes("III")) return 3;
      if (clean.includes("II")) return 2;
      if (clean.includes("I")) return 1;
      
      const match = clean.match(/\d+/);
      if (match) return parseInt(match[0], 10);
      return null;
    };

    const classNum = getNumericKelas(kelas.nama);

    // Filter chapters di BUKU_PAKET_DATABASE
    const chapters = BUKU_PAKET_DATABASE.filter(c => {
      const cClassNum = getNumericKelas(c.kelas);
      const isMapelMatch = c.mapelKode.toUpperCase() === bookKode;
      if (!isMapelMatch) return false;
      
      // P5 / Kokurikuler matches any class
      if (bookKode === 'P5') return true;
      
      return classNum !== null && cClassNum !== null && classNum === cClassNum;
    });

    const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY || '';

    if (chapters.length === 0) {
      let isAiAuthSuccess = false;
      let aiImportedCount = 0;
      
      const prompt = `Buatkan daftar Tujuan Pembelajaran (TP) Kurikulum Merdeka yang lengkap, spesifik, dan realistis untuk tingkat Sekolah Dasar (SD) berdasarkan parameter berikut:
- Mata Pelajaran: ${mapel.nama} (${mapel.kode})
- Kelas: ${kelas.nama}

Tujuan Pembelajaran ini harus mencakup materi sepanjang tahun (Semester 1 dan Semester 2) dan berjumlah antara 6 sampai 10 TP yang logis.

Anda harus menghasilkan output dalam format JSON array (tanpa markdown wrapper \`\`\`json, hanya string JSON mentah utuh) dengan struktur objek untuk setiap item:
[
  {
    "deskripsi": "Deskripsi TP yang operasional dan konkret (contoh: Membaca dan menulis bilangan cacah sampai 10.000)",
    "semester": 1, // 1 untuk Semester Ganjil, 2 untuk Semester Genap
    "alokasiJP": 4, // alokasi jam pelajaran yang logis, biasanya 2, 4, atau 6 JP
    "kktp": 70 // default nilai KKTP
  }
]
`;

      try {
        let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        if (apiKey) {
          headers['x-goog-api-key'] = apiKey;
        } else {
          // Fallback to service account token
          const saToken = await getServiceAccountAccessToken();
          headers['Authorization'] = `Bearer ${saToken}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const responseData = await response.json();
          const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const aiTps = JSON.parse(textResponse.trim());
            if (Array.isArray(aiTps)) {
              isAiAuthSuccess = true;
              for (const aiTp of aiTps) {
                const cleanDesc = aiTp.deskripsi.replace(/^\d+\.\s*/, '').trim();
                
                // Check existing
                const existing = await prisma.tujuanPembelajaran.findFirst({
                  where: {
                    mataPelajaranId,
                    kelasId,
                    deskripsi: cleanDesc
                  }
                });

                if (!existing) {
                  await prisma.tujuanPembelajaran.create({
                    data: {
                      mataPelajaranId,
                      kelasId,
                      deskripsi: cleanDesc,
                      semester: aiTp.semester === 2 ? 2 : 1,
                      alokasiJP: getDefaultJp(bookKode, classNum || 1),
                      kktp: aiTp.kktp || 70
                    }
                  });
                  aiImportedCount++;
                }
              }
            }
          }
        } else {
          console.error(`Gemini API error status: ${response.status}`, await response.text());
        }
      } catch (aiErr: any) {
        console.error('Gemini TP generation failed:', aiErr.message || aiErr);
      }

      if (isAiAuthSuccess) {
        return NextResponse.json({
          message: `Berhasil men-generate ${aiImportedCount} Tujuan Pembelajaran menggunakan AI untuk ${mapel.nama} Kelas ${kelas.nama}!`,
          count: aiImportedCount
        });
      }

      return NextResponse.json({ 
        message: `Tidak ada rujukan buku paket resmi untuk ${mapel.nama} di ${kelas.nama} saat ini. Anda tetap dapat memasukkannya secara manual.` 
      }, { status: 404 });
    }

    // Ekstrak TPs dari setiap chapter
    let importedCount = 0;
    for (const chapter of chapters) {
      // Split tujuanPembelajaranText menjadi baris
      const lines = chapter.tujuanPembelajaranText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      for (const line of lines) {
        // Hilangkan nomor di depan jika ada (misal "1. ", "2. ")
        const cleanDesc = line.replace(/^\d+\.\s*/, '');
        const semesterNum = chapter.semester.toLowerCase().includes('ganjil') || chapter.semester.includes('1') ? 1 : 2;
        
        // Cek apakah TP dengan deskripsi ini sudah ada untuk mapel dan kelas ini
        const existing = await prisma.tujuanPembelajaran.findFirst({
          where: {
            mataPelajaranId,
            kelasId,
            deskripsi: cleanDesc
          }
        });

        if (!existing) {
          const alokasiJP = getDefaultJp(bookKode, classNum || 1);
          
          await prisma.tujuanPembelajaran.create({
            data: {
              mataPelajaranId,
              kelasId,
              deskripsi: cleanDesc,
              semester: semesterNum,
              alokasiJP,
              kktp: 70 // Default KKTP
            }
          });
          importedCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: `Berhasil memuat ${importedCount} Tujuan Pembelajaran resmi dari Buku Paket!`,
      count: importedCount
    });

  } catch (error: any) {
    console.error('Import TPs error:', error);
    return NextResponse.json({ message: error.message || 'Gagal memuat TP otomatis' }, { status: 500 });
  }
}
