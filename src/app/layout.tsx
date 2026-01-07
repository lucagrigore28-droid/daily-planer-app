
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import { FirebaseClientProvider } from '@/firebase';


export const metadata: Metadata = {
  title: 'Homework Planner',
  description: 'Planificatorul tău inteligent pentru teme.',
  manifest: '/manifest.webmanifest',
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

const defaultIconSvg = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:hsl(var(--primary));stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:hsl(var(--accent));stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Cg fill='none' stroke='url(%23g)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5' y='5' width='90' height='90' rx='22' ry='22' fill='none' /%3E%3Cline x1='38' y1='5' x2='38' y2='15' /%3E%3Cline x1='62' y1='5' x2='62' y2='15' /%3E%3Cpath d='M 31 30 H 69 C 72.3137 30 75 32.6863 75 36 V 41 H 25 V 36 C 25 32.6863 27.6863 30 31 30 Z M 25 47 V 69 C 25 72.3137 27.6863 75 31 75 H 69 C 72.3137 75 75 72.3137 75 69 V 47 H 60 L 48 62 L 40 54 H 25 Z' fill='url(%23g)' stroke='none' /%3E%3C/g%3E%3C/svg%3E`;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <link id="favicon" rel="icon" href={`data:image/svg+xml,${defaultIconSvg}`} type="image/svg+xml" />
        <link id="apple-touch-icon" rel="apple-touch-icon" href={`data:image/svg+xml,${defaultIconSvg}`} />
      </head>
      <body className={cn("font-body antialiased", fontPoppins.variable, fontInter.variable)}>
        <FirebaseClientProvider>
          <ThemeProvider>
            <AppProvider>
              {children}
              <Toaster />
            </AppProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
