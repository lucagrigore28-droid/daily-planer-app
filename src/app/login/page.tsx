
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useAuth } from '@/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const handleAnonymousSignIn = () => {
    signInAnonymously(auth).then(() => {
      router.push('/');
    }).catch((error) => {
      console.error("Anonymous sign-in failed", error);
    });
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then((result) => {
      // User is signed in.
      // You can get user info from result.user
      router.push('/');
    }).catch((error) => {
      console.error("Google sign-in failed", error);
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-primary-accent p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Bun venit!</CardTitle>
          <CardDescription>Conectează-te pentru a-ți salva progresul.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleGoogleSignIn} className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 106.5 280.1 96 248 96c-88.8 0-160.1 71.1-160.1 160s71.3 160 160.1 160c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
            Continuă cu Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Sau
              </span>
            </div>
          </div>
          <Button onClick={handleAnonymousSignIn} variant="secondary" className="w-full">
            Continuă ca oaspete
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-primary-foreground/70 mt-4 text-center">
        * Conectarea ca oaspete va salva datele doar pe acest dispozitiv.
      </p>
    </div>
  );
}
