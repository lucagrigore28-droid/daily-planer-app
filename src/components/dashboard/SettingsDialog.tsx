"use client";

import React, { useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '../setup/StepName';
import StepSubjects from '../setup/StepSubjects';
import StepSchedule from '../setup/StepSchedule';
import StepNotifications from '../setup/StepNotifications';
import StepTheme from '../setup/StepTheme';
import { User, Palette, Calendar, Bell } from 'lucide-react';
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
                         <TabsContent value="profile" className="h-full flex flex-col">
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
                        <TabsContent value="subjects" className="h-full">
                           <StepSubjects />
                        </TabsContent>
                         <TabsContent value="schedule" className="h-full">
                            <StepSchedule />
                        </TabsContent>
                         <TabsContent value="notifications" className="h-full">
                             <StepNotifications />
                        </TabsContent>
                    </div>

                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
