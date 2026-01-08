
"use client";

import React, { useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '../setup/StepName';
import StepSubjects from '../setup/StepSubjects';
import StepSchedule from '../setup/StepSchedule';
import StepNotifications from '../setup/StepNotifications';
import StepTheme from '../setup/StepTheme';
import { User, Palette, Calendar, Bell, Trash2, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { AppContext } from '@/contexts/AppContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from 'next-themes';
import { ScrollArea } from '../ui/scroll-area';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
    { value: 'profile', label: 'Profil', icon: User, component: <StepName /> },
    { value: 'appearance', label: 'Aspect', icon: Palette, component: <StepTheme /> },
    { value: 'subjects', label: 'Materii', icon: User, component: <StepSubjects /> },
    { value: 'schedule', label: 'Orar', icon: Calendar, component: <StepSchedule /> },
    { value: 'notifications', label: 'Notificări', icon: Bell, component: <StepNotifications /> },
];


function DangerZone() {
    const context = useContext(AppContext);

    return (
        <div className="p-6 bg-destructive/10 rounded-lg">
            <h3 className="text-lg font-bold text-destructive">Zonă de Pericol</h3>
            <p className="text-destructive/80 text-sm mb-4">Aceste acțiuni sunt ireversibile. Te rugăm să fii atent.</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                            <Trash2 className="mr-2 h-4 w-4" /> Resetează Toate Datele
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Această acțiune nu poate fi anulată. Toate temele, materiile și setările tale vor fi șterse definitiv. 
                                Contul tău va fi păstrat, dar va trebui să reiei procesul de configurare.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={context?.resetData} className="bg-destructive hover:bg-destructive/90">
                                Da, resetează
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={context?.logout} className="flex-1">
                     <LogOut className="mr-2 h-4 w-4" /> Deconectare
                </Button>
            </div>
        </div>
    );
}


export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { theme } = useTheme();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl">Setări</DialogTitle>
                    <DialogDescription>
                        Personalizează-ți experiența în aplicație.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile" className="w-full flex-1 flex flex-col md:flex-row p-6 min-h-0">
                    <TabsList className="flex flex-col h-auto justify-start items-stretch gap-1 md:w-48 md:mr-6 shrink-0">
                       {TABS.map(tab => (
                         <TabsTrigger key={tab.value} value={tab.value} className="justify-start gap-2 h-10">
                            <tab.icon className="h-5 w-5" /> {tab.label}
                         </TabsTrigger>
                       ))}
                    </TabsList>
                    
                    <div className="flex-1 mt-4 md:mt-0 min-h-0 min-w-0">
                         <TabsContent value="profile" className="h-full flex-1 min-w-0">
                            <StepName />
                        </TabsContent>
                         <TabsContent value="appearance" className="flex flex-col">
                             <div className="flex justify-between items-center mb-4 p-4 border rounded-lg bg-background/50">
                                <h3 className="font-semibold">{theme === 'light' ? 'Mod Luminos' : 'Mod Întunecat'}</h3>
                                <ThemeToggle />
                            </div>
                            <ScrollArea className="flex-1">
                                <StepTheme />
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="subjects" className="h-full flex-1 min-w-0">
                           <StepSubjects />
                        </TabsContent>
                         <TabsContent value="schedule" className="h-full flex-1 min-w-0">
                            <StepSchedule />
                        </TabsContent>
                         <TabsContent value="notifications" className="h-full flex-1 min-w-0">
                             <StepNotifications />
                        </TabsContent>
                         <TabsContent value="danger" className="h-full">
                            <DangerZone />
                        </TabsContent>
                    </div>

                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

