
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/ThemeProvider';


export const metadata: Metadata = {
  title: 'Daily Planner Pro',
  description: 'Planificatorul tău inteligent pentru teme.',
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
      <body className={cn("font-body antialiased", fontPoppins.variable, fontInter.variable)}>
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
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
