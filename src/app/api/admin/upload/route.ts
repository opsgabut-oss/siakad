import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

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

    // Target upload path: public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
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


