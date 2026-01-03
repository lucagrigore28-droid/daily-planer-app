
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import { themes } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'Daily Planner Pro',
  description: 'Un planificator inteligent pentru temele tale zilnice.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ]
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
    <html lang="ro" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22black%22 /><defs><linearGradient id=%22g%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22><stop offset=%220%25%22 style=%22stop-color:hsl(262 84% 60%);stop-opacity:1%22 /><stop offset=%2250%25%22 style=%22stop-color:%23FF0066;stop-opacity:1%22 /><stop offset=%22100%25%22 style=%22stop-color:%23CC00CC;stop-opacity:1%22 /></defs><g fill=%22none%22 stroke=%22url(%23g)%22 stroke-width=%226%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><rect x=%225%22 y=%225%22 width=%2290%22 height=%2290%22 rx=%2222%22 ry=%2222%22 /><line x1=%2238%22 y1=%225%22 x2=%2238%22 y2=%2215%22 /><line x1=%2262%22 y1=%225%22 x2=%2262%22 y2=%2215%22 /><path d=%22M 31 30 H 69 C 72.3137 30 75 32.6863 75 36 V 41 H 25 V 36 C 25 32.6863 27.6863 30 31 30 Z M 25 47 V 69 C 25 72.3137 27.6863 75 31 75 H 69 C 72.3137 75 75 72.3137 75 69 V 47 H 60 L 48 62 L 40 54 H 25 Z%22 fill=%22url(%23g)%22 stroke=%22none%22 /></g></svg>" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22black%22 /><defs><linearGradient id=%22g%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22><stop offset=%220%25%22 style=%22stop-color:hsl(262 84% 60%);stop-opacity:1%22 /><stop offset=%2250%25%22 style=%22stop-color:%23FF0066;stop-opacity:1%22 /><stop offset=%22100%25%22 style=%22stop-color:%23CC00CC;stop-opacity:1%22 /></defs><g fill=%22none%22 stroke=%22url(%23g)%22 stroke-width=%226%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><rect x=%225%22 y=%225%22 width=%2290%22 height=%2290%22 rx=%2222%22 ry=%2222%22 /><line x1=%2238%22 y1=%225%22 x2=%2238%22 y2=%2215%22 /><line x1=%2262%22 y1=%225%22 x2=%2262%22 y2=%2215%22 /><path d=%22M 31 30 H 69 C 72.3137 30 75 32.6863 75 36 V 41 H 25 V 36 C 25 32.6863 27.6863 30 31 30 Z M 25 47 V 69 C 25 72.3137 27.6863 75 31 75 H 69 C 72.3137 75 75 72.3137 75 69 V 47 H 60 L 48 62 L 40 54 H 25 Z%22 fill=%22url(%23g)%22 stroke=%22none%22 /></g></svg>" />
      </head>
      <body className={cn("font-body antialiased", fontPoppins.variable, fontInter.variable)}>
        <ThemeProvider>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
