import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'pemda' | 'sekolah'

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada berkas yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dapatkan ekstensi file original
    const originalName = file.name;
    const ext = originalName.split('.').pop() || 'png';
    const cleanExt = ext.toLowerCase();

    // Validasi tipe file
    const allowedExts = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    if (!allowedExts.includes(cleanExt)) {
      return NextResponse.json({ message: 'Format berkas tidak diizinkan. Gunakan PNG, JPG, JPEG, SVG, atau WEBP.' }, { status: 400 });
    }

    // Convert to Base64 Data URL
    const base64 = buffer.toString('base64');
    const mimeType = file.type || `image/${cleanExt}`;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ 
      success: true, 
      url: dataUrl
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ message: `Gagal mengunggah berkas: ${error.message}` }, { status: 500 });
  }
}



