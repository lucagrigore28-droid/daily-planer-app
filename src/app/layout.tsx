import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Daily Planner Pro',
  description: 'Un planificator inteligent pentru temele tale zilnice.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Planner Pro",
    statusBarStyle: "black-translucent",
  }
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const fontInter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="dark">
      <body className={cn("font-body antialiased", fontPoppins.variable, fontInter.variable)}>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
