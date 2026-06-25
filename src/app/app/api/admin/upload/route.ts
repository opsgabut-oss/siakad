import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { isGDriveConfigured, uploadToGoogleDrive } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const kategori = (formData.get('kategori') as string) || 'LAINNYA';

    if (!file) {
      return NextResponse.json({ message: 'Berkas tidak ditemukan' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique safe filename
    const fileExt = path.extname(file.name) || '.pdf';
    const cleanOrigName = file.name
      .replace(fileExt, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const filename = `${cleanOrigName}_${Date.now()}${fileExt}`;

    // 1. Jika Google Drive sudah terkonfigurasi, unggah ke Google Drive
    if (isGDriveConfigured()) {
      try {
        const driveResult = await uploadToGoogleDrive(
          filename,
          file.type || 'application/octet-stream',
          buffer,
          kategori
        );
        return NextResponse.json({
          success: true,
          tautanBerkas: driveResult.webViewLink,
          driveUrl: driveResult.webViewLink,
          localUrl: driveResult.webViewLink,
        });
      } catch (err: any) {
        console.error('Google Drive upload failed:', err);
        return NextResponse.json(
          { message: `Gagal mengunggah ke Google Drive: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // 2. Jika di Vercel (Production) tapi Google Drive belum dikonfigurasi
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          message: 'Penyimpanan lokal tidak tersedia di server Vercel (Read-Only). Harap masukkan variabel lingkungan Google Drive di dashboard Vercel Anda.',
        },
        { status: 500 }
      );
    }

    // 3. Fallback untuk Pengembangan Lokal (menulis ke public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Pastikan folder upload ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      localUrl: relativeUrl,
      driveUrl: relativeUrl,
      tautanBerkas: relativeUrl,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { message: `Gagal mengunggah berkas: ${error.message}`, error: error.message },
      { status: 500 }
    );
  }
}


