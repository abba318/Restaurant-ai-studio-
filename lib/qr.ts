import QRCode from 'qrcode';

export async function generateOrderQrCodeDataUrl(orderId: string, orderNumber: string, appUrl?: string): Promise<string> {
  const baseUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const targetUrl = `${baseUrl}/order/${encodeURIComponent(orderId)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('[QR Code Generation Error]:', err);
    return '';
  }
}
