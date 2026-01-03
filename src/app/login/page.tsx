'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useAuth } from '@/firebase';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  email: z.string().email({ message: 'Te rog introdu o adresă de email validă.' }),
  password: z.string().min(6, { message: 'Parola trebuie să aibă cel puțin 6 caractere.' }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const handleAnonymousSignIn = () => {
    signInAnonymously(auth).then(() => {
      router.push('/');
    }).catch((error) => {
      console.error("Anonymous sign-in failed", error);
      toast({
        title: "Eroare de autentificare",
        description: "Nu am putut continua ca oaspete. Te rog încearcă din nou.",
        variant: "destructive",
      });
    });
  };

  const handleEmailPasswordSubmit = (mode: 'signIn' | 'signUp'): SubmitHandler<FormValues> => async (data) => {
    setIsSubmitting(true);
    const { email, password } = data;
    try {
      if (mode === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      console.error(`${mode} failed`, error);
      let description = "A apărut o eroare. Te rog încearcă din nou.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Această adresă de email este deja folosită.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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
                  <Label htmlFor="password-login">Parolă</Label>
                  <Input id="password-login" type="password" {...register('password')} />
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
                  <Input id="password-register" type="password" {...register('password')} />
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
