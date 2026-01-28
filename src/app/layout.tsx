
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';
import { OneSignalInitializer } from '@/components/OneSignalInitializer';


export const metadata: Metadata = {
  title: 'Daily Planner Pro',
  description: 'Planificatorul tău inteligent pentru teme.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: 'black',
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
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className={cn("font-body antialiased", fontPoppins.variable, fontInter.variable)}>
        <FirebaseClientProvider>
          <OneSignalInitializer />
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
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="lazyOnload" crossOrigin="anonymous" />
      </body>
    </html>
  );
}
