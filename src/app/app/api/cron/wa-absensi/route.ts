import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const cronSecret = process.env.CRON_SECRET || 'siakad-cron-secure-secret-token-123';

    // Verifikasi Token Keamanan Cron
    if (token !== cronSecret) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 401 });
    }

    // Ambil tanggal hari ini (tanpa jam)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cari absensi Alpa hari ini
    const absensiAlpa = await prisma.absensi.findMany({
      where: {
        tanggal: today,
        status: 'ALPA',
      },
      include: {
        siswa: {
          select: {
            nama: true,
            kontakOrangTua: true,
            kelas: { select: { nama: true } },
          },
        },
      },
    });

    if (absensiAlpa.length === 0) {
      return NextResponse.json({
        message: 'Cron task sukses: Tidak ada siswa yang Alpa hari ini.',
        sentCount: 0,
      });
    }

    const waGatewayUrl = process.env.WA_GATEWAY_URL || 'https://api.whatsapp-gateway.mock/send';
    const logs = [];

    // Kirim pesan format JSON ke API WhatsApp Gateway
    for (const item of absensiAlpa) {
      const parentPhone = item.siswa.kontakOrangTua;
      const studentName = item.siswa.nama;
      const className = item.siswa.kelas.nama;
      const formattedDate = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      const messageContent = `SIAKAD SDN Wedusan: Menginfokan bahwa putra/putri Anda, *${studentName}* (Kelas: ${className}), hari ini (${formattedDate}) berstatus *ALPA* (Tanpa Keterangan) di sekolah. Mohon segera melakukan konfirmasi ke Wali Kelas. Terima kasih.`;

      const payload = {
        to: parentPhone,
        message: messageContent,
        metadata: {
          studentId: item.siswaId,
          type: 'ABSENCE_NOTIFICATION',
          date: today.toISOString(),
        },
      };

      try {
        console.log(`[WA GATEWAY] Mengirim pesan ke ${parentPhone}:`, messageContent);

        // Kirim request ke WA Gateway
        const response = await fetch(waGatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        logs.push({
          siswa: studentName,
          telepon: parentPhone,
          status: response.ok ? 'Sukses' : 'Gagal',
          response: result,
        });
      } catch (err: any) {
        console.error(`[WA GATEWAY] Gagal menghubungi API untuk ${studentName}:`, err.message);
        logs.push({
          siswa: studentName,
          telepon: parentPhone,
          status: 'Gagal (Kesalahan Koneksi Gateway)',
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      message: `Cron task sukses memproses ${absensiAlpa.length} pengiriman absensi alpa.`,
      sentCount: absensiAlpa.length,
      details: logs,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan sistem cron', error: error.message }, { status: 500 });
  }
}
