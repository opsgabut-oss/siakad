import { NextResponse } from 'next/server';
import { isGDriveConfigured } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Bypassed temporarily for easy public debugging
  /*
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 });
  }
  */

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const pkey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';

  return NextResponse.json({
    isConfigured: isGDriveConfigured(),
    folderId: {
      exists: !!folderId,
      length: folderId.length,
      preview: folderId ? folderId.substring(0, 5) + '...' : 'none'
    },
    email: {
      exists: !!email,
      value: email || 'none'
    },
    privateKey: {
      exists: !!pkey,
      length: pkey.length,
      startsWithBegin: pkey.includes('-----BEGIN PRIVATE KEY-----'),
      endsWithEnd: pkey.includes('-----END PRIVATE KEY-----'),
      newlinesCount: (pkey.match(/\n/g) || []).length,
      escapedNewlinesCount: (pkey.match(/\\n/g) || []).length
    }
  });
}

