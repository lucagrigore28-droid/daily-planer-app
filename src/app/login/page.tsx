
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useUser } from '@/hooks/use-user';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';
import { useFirebaseApp } from '@/firebase/provider';

const FormSchema = z.object({
  email: z.string().email({ message: 'Te rog introdu o adresă de email validă.' }),
  password: z.string().min(6, { message: 'Parola trebuie să aibă cel puțin 6 caractere.' }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
  });

  const handleAnonymousSignIn = () => {
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed", error);
      toast({
        title: "Eroare de autentificare",
        description: "Nu am putut continua ca oaspete. Te rog încearcă din nou.",
        variant: "destructive",
      });
    });
  };
  
  const handlePasswordReset = async () => {
    const email = getValues("email");
    if (!email) {
      toast({
        title: "Email necesar",
        description: "Te rog introdu adresa de email în câmpul de mai sus înainte de a reseta parola.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Verifică-ți emailul",
        description: `Am trimis un link de resetare a parolei la ${email}.`,
      });
    } catch (error: any) {
        console.error("Password reset failed", error);
        toast({
            title: "Eroare la resetarea parolei",
            description: "Nu am putut trimite emailul de resetare. Verifică adresa și încearcă din nou.",
            variant: "destructive",
        });
    }
  }

  const handleEmailPasswordSubmit = (mode: 'signIn' | 'signUp'): SubmitHandler<FormValues> => async (data) => {
    setIsSubmitting(true);
    const { email, password } = data;
    try {
      if (mode === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error(`${mode} failed`, error);
      let description = "A apărut o eroare. Te rog încearcă din nou.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Această adresă de email este deja folosită.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Emailul sau parola sunt incorecte.";
      }
      toast({
        title: `Eroare de ${mode === 'signIn' ? 'autentificare' : 'înregistrare'}`,
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!isClient || isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-primary-accent p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
             <div className="flex justify-center mb-4">
                <Skeleton className="h-[80px] w-[80px] rounded-2xl" />
             </div>
             <Skeleton className="h-7 w-32 mx-auto" />
             <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="h-10 w-full grid grid-cols-2 p-1 rounded-md bg-muted">
                <Skeleton className="h-full w-full rounded-sm bg-background" />
                <Skeleton className="h-full w-full" />
            </div>
             <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                     <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-primary-accent p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="font-headline text-2xl">Bun venit!</CardTitle>
          <CardDescription>Conectează-te sau creează un cont pentru a-ți salva progresul.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Autentificare</TabsTrigger>
              <TabsTrigger value="register">Înregistrare</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSubmit(handleEmailPasswordSubmit('signIn'))} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="email@exemplu.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Parolă</Label>
                     <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={handlePasswordReset}>
                        Ai uitat parola?
                     </Button>
                  </div>
                  <div className="relative">
                    <Input id="password-login" type={showPassword ? 'text' : 'password'} {...register('password')} />
                    <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Se încarcă...' : 'Continuă'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleSubmit(handleEmailPasswordSubmit('signUp'))} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-register">Email</Label>
                  <Input id="email-register" type="email" placeholder="email@exemplu.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Parolă</Label>
                  <div className="relative">
                    <Input id="password-register" type={showPassword ? 'text' : 'password'} {...register('password')} />
                    <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Se încarcă...' : 'Creează cont'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
