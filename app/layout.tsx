import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'NaijaGrill & Kitchen | Premium Nigerian Cuisine & Online Ordering',
  description: 'Authentic firewood Jollof, spicy Suya, tender Asun, rich Egusi, and fresh Chapman. Order online with instant Paystack checkout and live tracking.',
  openGraph: {
    title: 'NaijaGrill & Kitchen | Premium Nigerian Cuisine & Online Ordering',
    description: 'Authentic firewood Jollof, spicy Suya, tender Asun, rich Egusi, and fresh Chapman. Order online with instant Paystack checkout and live tracking.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaijaGrill & Kitchen | Premium Nigerian Cuisine & Online Ordering',
    description: 'Authentic firewood Jollof, spicy Suya, tender Asun, rich Egusi, and fresh Chapman. Order online with instant Paystack checkout and live tracking.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
