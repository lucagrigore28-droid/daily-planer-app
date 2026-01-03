
"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '@/components/setup/StepName';
import StepSubjects from '@/components/setup/StepSubjects';
import StepSchedule from '@/components/setup/StepSchedule';
import StepNotifications from '@/components/setup/StepNotifications';
import { User, Book, Calendar, Bell, LogOut, Palette, Check } from 'lucide-react';
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
import { ThemeToggle } from '../ThemeToggle';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Wrapper components to adapt Step components for use inside the dialog
const ProfileSettings = () => <StepName onNext={() => {}} />;
const SubjectsSettings = () => <StepSubjects onNext={() => {}} onBack={() => {}} />;
const ScheduleSettings = () => <StepSchedule onNext={() => {}} onBack={() => {}} />;
const NotificationsSettings = () => <StepNotifications onNext={() => {}} onBack={() => {}} />;

const AppearanceSettings = () => {
    const context = useContext(AppContext);

    const handleThemeChange = (themeName: string) => {
        context?.updateUser({ theme: themeName });
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Mod afișare</h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <h4 className="font-semibold">Temă vizuală</h4>
                        <p className="text-sm text-muted-foreground">
                            Alege între tema luminoasă și cea întunecată.
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Culori</h3>
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Alege o paletă de culori pentru aplicație.</p>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        {themes.map((theme) => (
                            <div key={theme.name}>
                                <button
                                    onClick={() => handleThemeChange(theme.name)}
                                    className={cn(
                                        "flex items-center justify-center w-full h-16 rounded-lg border-2 transition-all",
                                        context?.userData.theme === theme.name ? 'border-primary' : 'border-transparent'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                                        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: `hsl(${theme.accent})` }} />
                                    </div>
                                    {context?.userData.theme === theme.name && (
                                        <div className="absolute top-1 right-1 p-0.5 bg-primary text-primary-foreground rounded-full">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                                <p className="text-center text-sm font-medium mt-2">{theme.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const DangerZone = () => {
    const context = useContext(AppContext);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleReset = () => {
        context?.resetData();
        setIsAlertOpen(false);
    }

    return (
        <>
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-destructive">Deconectare și Resetare</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Această acțiune este ireversibilă. Toate datele tale, inclusiv numele, materiile, orarul și temele vor fi șterse definitiv, iar aplicația va fi resetată la starea inițială.
                </p>
                <Button variant="destructive" onClick={() => setIsAlertOpen(true)}>
                    Deconectare / Resetare
                </Button>
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

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const context = useContext(AppContext);

  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Setări</DialogTitle>
          <DialogDescription>
            Modifică-ți preferințele, materiile, orarul și notificările.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-6 h-full">
            <TabsList className="flex-col h-auto justify-start md:w-48">
              <TabsTrigger value="profile" className="w-full justify-start gap-2">
                <User className="h-4 w-4"/> Profil
              </TabsTrigger>
               <TabsTrigger value="appearance" className="w-full justify-start gap-2">
                <Palette className="h-4 w-4"/> Aspect
              </TabsTrigger>
              <TabsTrigger value="subjects" className="w-full justify-start gap-2">
                <Book className="h-4 w-4"/> Materii
              </TabsTrigger>
              <TabsTrigger value="schedule" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4"/> Orar
              </TabsTrigger>
               <TabsTrigger value="notifications" className="w-full justify-start gap-2">
                <Bell className="h-4 w-4"/> Notificări
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
              <TabsContent value="profile">
                <ProfileSettings />
                <DangerZone />
              </TabsContent>
              <TabsContent value="appearance">
                <AppearanceSettings />
              </TabsContent>
              <TabsContent value="subjects">
                <SubjectsSettings />
              </TabsContent>
              <TabsContent value="schedule">
                <ScheduleSettings />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationsSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    