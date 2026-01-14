
"use client";

import React, { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '@/components/setup/StepName';
import StepSubjects from '@/components/setup/StepSubjects';
import StepSchedule from '@/components/setup/StepSchedule';
import StepNotifications from '@/components/setup/StepNotifications';
import StepTheme from '@/components/setup/StepTheme';
import { User, Book, Calendar, Bell, Palette, LogOut, Trash2 } from 'lucide-react';
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
import ThemeToggle from '../ThemeToggle';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
            <div className="flex flex-col items-start gap-4">
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

const AppearanceSettings = () => {
    const { theme } = useTheme();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const getThemeLabel = () => {
        if (!isClient) return 'Mod Întunecat';
        switch (theme) {
            case 'light': return 'Mod Luminos';
            case 'dark': return 'Mod Întunecat';
            case 'system': return 'Temă Sistem';
            default: return 'Mod Întunecat';
        }
    };

    return (
        <>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50 mb-6">
                <h3 className="font-semibold">{getThemeLabel()}</h3>
                <ThemeToggle />
            </div>
            <StepTheme />
        </>
    );
};


export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const context = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(TABS[0].value);
  const isMobile = useIsMobile();
  
  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-full md:h-auto lg:h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Setări</DialogTitle>
          <DialogDescription>
            Modifică-ți preferințele, materiile, orarul și notificările.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            orientation={isMobile ? 'horizontal' : 'vertical'} 
            className="flex flex-col md:flex-row gap-6 h-full p-6"
          >
            <TabsList className={cn(
              "flex-col h-auto justify-start shrink-0",
              isMobile && "flex-row w-full overflow-x-auto"
            )}>
              {TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className={cn(
                  "w-full justify-start gap-2",
                  isMobile && "flex-col h-16"
                )}>
                    <tab.icon className="h-4 w-4"/>
                    <span className={cn(isMobile && "text-xs")}>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-4">
                 <TabsContent value='profile' className="h-full flex flex-col mt-0">
                    <div className="flex flex-col justify-center flex-1 h-full">
                        <div>
                            <UserAccount />
                            <StepName />
                        </div>
                       <DangerZone />
                    </div>
                </TabsContent>
                <TabsContent value='appearance' className="mt-0">
                    <AppearanceSettings />
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
