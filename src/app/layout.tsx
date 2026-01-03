
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import DynamicFavicon from '@/components/DynamicFavicon';


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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <DynamicFavicon />
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
