
"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '@/components/setup/StepName';
import StepSubjects from '@/components/setup/StepSubjects';
import StepSchedule from '@/components/setup/StepSchedule';
import StepNotifications from '@/components/setup/StepNotifications';
import StepTheme from '@/components/setup/StepTheme';
import { User, Book, Calendar, Bell, Palette, LogOut, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import ThemeToggle from '../ThemeToggle';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
    { value: 'profile', label: 'Profil', icon: User, component: StepName },
    { value: 'subjects', label: 'Materii', icon: Book, component: StepSubjects },
    { value: 'schedule', label: 'Orar', icon: Calendar, component: StepSchedule },
    { value: 'notifications', label: 'Notificări', icon: Bell, component: StepNotifications },
    { value: 'appearance', label: 'Aspect', icon: Palette, component: StepTheme },
];

const EmergencyZone = () => {
    const context = useContext(AppContext);
    const { toast } = useToast();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAllTasks = async () => {
        setIsDeleting(true);
        try {
            await context?.deleteAllTasks();
            toast({
                title: "Curățare finalizată",
                description: "Toate temele au fost șterse. Lista se va reîmprospăta.",
            });
        } catch (error) {
            console.error("Failed to delete all tasks", error);
            toast({
                title: "Eroare la curățare",
                description: "Nu am putut șterge temele. Te rog încearcă din nou.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setIsAlertOpen(false);
        }
    };

    return (
        <>
            <Card className="mt-6 border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-destructive">Zonă de urgență</CardTitle>
                    </div>
                    <CardDescription>
                        Folosește această opțiune doar dacă întâmpini probleme cu duplicatele.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">
                        Această acțiune va șterge permanent **toate** temele (manuale și automate) pentru a curăța orice duplicate. Temele automate vor fi regenerate, dar cele manuale se vor pierde.
                    </p>
                    <Button variant="destructive" onClick={() => setIsAlertOpen(true)} disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? "Se șterge..." : "Șterge Toate Temele"}
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Această acțiune nu poate fi anulată. Toate temele tale, inclusiv cele manuale și cele completate, vor fi șterse definitiv. Este recomandat doar pentru a rezolva problemele cu duplicatele.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllTasks} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Da, șterge toate temele
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};


const DangerZone = () => {
    const context = useContext(AppContext);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleReset = async () => {
        if (context) {
            await context.resetData();
        }
        setIsAlertOpen(false);
    }

    return (
        <>
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold">Resetare Aplicație</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Această acțiune este ireversibilă. Toate datele tale, inclusiv materiile, orarul și temele vor fi șterse definitiv.
                </p>
                <div className="flex justify-center">
                    <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Resetează Aplicația
                    </Button>
                </div>
            </div>
             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Această acțiune nu poate fi anulată. Toate datele tale vor fi șterse permanent. Aplicația se va reîncărca la starea inițială.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Da, resetează
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

const UserAccount = () => {
    const context = useContext(AppContext);
    
    const handleLogout = () => {
        context?.logout();
    };

    if (!context || !context.user) return null;

    const { user } = context;
    const isAnonymous = user.isAnonymous;
    const email = isAnonymous ? "Cont de oaspete" : user.email;
    const initial = email ? email.charAt(0).toUpperCase() : '?';

    return (
        <div className="p-4 rounded-lg border bg-background/50 mb-6">
            <h3 className="text-lg font-semibold mb-4">Contul Meu</h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar>
                         <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-muted-foreground">{email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Deconectare
                </Button>
            </div>
        </div>
    )
}


export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const context = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(TABS[0].value);
  
  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] md:h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Setări</DialogTitle>
          <DialogDescription>
            Modifică-ți preferințele, materiile, orarul și notificările.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col md:flex-row gap-6 h-full p-6">
            <TabsList className="flex-col h-auto justify-start shrink-0">
              {TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="w-full justify-start gap-2">
                    <tab.icon className="h-4 w-4"/> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-4">
                 <TabsContent value='profile' className="h-full flex flex-col mt-0">
                    <div className="flex flex-col justify-between flex-1 h-full">
                        <div>
                            <UserAccount />
                            <EmergencyZone />
                            <StepName />
                        </div>
                       <DangerZone />
                    </div>
                </TabsContent>
                <TabsContent value='appearance' className="mt-0">
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50 mb-6">
                         <h3 className="font-semibold">Mod Întunecat</h3>
                         <ThemeToggle />
                    </div>
                    <StepTheme />
                </TabsContent>

                {TABS.filter(t => t.value !== 'profile' && t.value !== 'appearance').map(tab => {
                    const Component = tab.component;
                    return (
                        <TabsContent key={tab.value} value={tab.value} className="mt-0">
                            <Component />
                        </TabsContent>
                    )
                })}
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
