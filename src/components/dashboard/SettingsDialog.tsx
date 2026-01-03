
"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '@/components/setup/StepName';
import StepSubjects from '@/components/setup/StepSubjects';
import StepSchedule from '@/components/setup/StepSchedule';
import StepNotifications from '@/components/setup/StepNotifications';
import { User, Book, Calendar, Bell, LogOut } from 'lucide-react';
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

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Wrapper components to adapt Step components for use inside the dialog
const ProfileSettings = () => <StepName onNext={() => {}} />;
const SubjectsSettings = () => <StepSubjects onNext={() => {}} onBack={() => {}} />;
const ScheduleSettings = () => <StepSchedule onNext={() => {}} onBack={() => {}} />;
const NotificationsSettings = () => <StepNotifications onNext={() => {}} onBack={() => {}} />;

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
