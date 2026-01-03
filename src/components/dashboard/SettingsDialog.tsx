
"use client";

import React, { useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '@/components/setup/StepName';
import StepSubjects from '@/components/setup/StepSubjects';
import StepSchedule from '@/components/setup/StepSchedule';
import { User, Book, Calendar } from 'lucide-react';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Wrapper components to adapt Step components for use inside the dialog
const ProfileSettings = () => <StepName onNext={() => {}} />;
const SubjectsSettings = () => <StepSubjects onNext={() => {}} onBack={() => {}} />;
const ScheduleSettings = () => <StepSchedule onNext={() => {}} onBack={() => {}} />;


export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const context = useContext(AppContext);

  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Setări</DialogTitle>
          <DialogDescription>
            Modifică-ți preferințele, materiile și orarul.
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
            </TabsList>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TabsContent value="profile">
                <ProfileSettings />
              </TabsContent>
              <TabsContent value="subjects">
                <SubjectsSettings />
              </TabsContent>
              <TabsContent value="schedule">
                <ScheduleSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
