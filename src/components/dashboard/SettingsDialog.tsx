"use client";

import React, { useContext, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StepName from '../setup/StepName';
import StepSubjects from '../setup/StepSubjects';
import StepSchedule from '../setup/StepSchedule';
import StepNotifications from '../setup/StepNotifications';
import StepTheme from '../setup/StepTheme';
import { User, Palette, Calendar, Bell, BookOpen, ChevronLeft } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from 'next-themes';
import { ScrollArea } from '../ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '../ui/button';
import { AppContext } from '@/contexts/AppContext';
import { themes } from '@/lib/themes';
import { cn } from '@/lib/utils';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
    { value: 'profile', label: 'Profil', icon: User, component: <StepName /> },
    { value: 'subjects', label: 'Materii', icon: BookOpen, component: <StepSubjects /> },
    { value: 'schedule', label: 'Orar', icon: Calendar, component: <StepSchedule /> },
    { value: 'notifications', label: 'Notificări', icon: Bell, component: <StepNotifications /> },
    { value: 'appearance', label: 'Aspect', icon: Palette, component: <AppearanceSettings /> },
];

function AppearanceSettings() {
    const { theme } = useTheme();
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 p-4 border rounded-lg bg-background/50">
                <h3 className="font-semibold">{theme === 'light' ? 'Mod Luminos' : 'Mod Întunecat'}</h3>
                <ThemeToggle />
            </div>
            <ScrollArea className="flex-1">
                <StepTheme />
            </ScrollArea>
        </div>
    );
}

function MobileSettingsView({ onBack }: { onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const appContext = useContext(AppContext);
    const { theme, systemTheme } = useTheme();

    const selectedTab = TABS.find(tab => tab.value === activeTab);

    const getSubtitle = (tabValue: string) => {
        if (!appContext || !appContext.userData) return null;
        
        const { userData } = appContext;
        const currentTheme = theme === 'system' ? systemTheme : theme;

        switch(tabValue) {
            case 'profile':
                return appContext.user?.email;
            case 'subjects':
                const count = userData.subjects.length;
                return `${count} ${count === 1 ? 'materie selectată' : 'materii selectate'}`;
            case 'schedule':
                const scheduledCount = Object.values(userData.schedule || {}).filter(days => days.length > 0).length;
                return `Orar setat pentru ${scheduledCount} ${scheduledCount === 1 ? 'materie' : 'materii'}`;
            case 'notifications':
                 return (
                    <span className={cn(userData.notifications.enabled ? "text-green-500" : "text-muted-foreground")}>
                        {userData.notifications.enabled ? "Active" : "Inactive"}
                    </span>
                );
            case 'appearance':
                const themeLabel = themes.find(t => t.name === userData.theme)?.label || userData.theme;
                const modeLabel = currentTheme === 'dark' ? 'Întunecat' : 'Luminos';
                return `Temă ${themeLabel}, Mod ${modeLabel}`;
            default:
                return null;
        }
    }

    if (selectedTab) {
        return (
            <div className="h-full flex flex-col">
                <header className="flex items-center p-4 border-b shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setActiveTab(null)} className="mr-2">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold">{selectedTab.label}</h2>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                    {selectedTab.component}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <DialogHeader className="text-left mb-6">
                <DialogTitle className="text-2xl">Setări</DialogTitle>
                <DialogDescription>
                    Personalizează-ți experiența în aplicație.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-1">
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className="w-full flex items-center gap-3 p-4 rounded-lg text-left hover:bg-muted transition-colors"
                    >
                        <tab.icon className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                            <p className="text-lg font-medium">{tab.label}</p>
                            <small className="text-muted-foreground font-normal">{getSubtitle(tab.value)}</small>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function DesktopSettingsView() {
    return (
        <>
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
                
                <div className="flex-1 mt-4 md:mt-0 min-h-0">
                    {TABS.map(tab => (
                        <TabsContent key={tab.value} value={tab.value} className="h-full flex-1 min-w-0 data-[state=inactive]:hidden">
                           {tab.component}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </>
    );
}


export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const isMobile = useIsMobile();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-full md:h-[90vh] flex flex-col p-0 gap-0">
                {isMobile ? <MobileSettingsView onBack={() => onOpenChange(false)} /> : <DesktopSettingsView />}
            </DialogContent>
        </Dialog>
    );
}
