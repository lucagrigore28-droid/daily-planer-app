"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format, getDay, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Settings, Coins } from 'lucide-react';
import HomeworkList from './HomeworkList';
import AddTaskDialog from './AddTaskDialog';
import { CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableCalendarView from './ExpandableCalendarView';
import WeekendView from './WeekendView';
import SettingsDialog from './SettingsDialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState('profile');
  const [displayedDay, setDisplayedDay] = useState<Date | null>(null);
  const [isCoinInfoOpen, setIsCoinInfoOpen] = useState(false);
  const [pendingSettingsOpen, setPendingSettingsOpen] = useState(false);

  const { userData, currentDate, tasks, getNextDayWithTasks, areTasksSynced, isDataLoaded } = context!;

   useEffect(() => {
    // This effect runs ONCE to set the initial day when data is loaded
    if (areTasksSynced && isDataLoaded && !displayedDay) {
      const nextDay = getNextDayWithTasks();
      setDisplayedDay(nextDay ? startOfDay(nextDay) : startOfDay(new Date()));
    }
  }, [areTasksSynced, isDataLoaded, displayedDay, getNextDayWithTasks]);

  useEffect(() => {
    // This effect handles the sequential opening of the settings dialog
    // after the coin info dialog has fully closed.
    if (!isCoinInfoOpen && pendingSettingsOpen) {
      setIsSettingsOpen(true);
      setPendingSettingsOpen(false); // Reset the intent
    }
  }, [isCoinInfoOpen, pendingSettingsOpen]);


  const handlePrevDay = () => {
    if (displayedDay) {
      setDisplayedDay(subDays(displayedDay, 1));
    }
  };

  const handleNextDay = () => {
    if (displayedDay) {
      setDisplayedDay(addDays(displayedDay, 1));
    }
  };

  const handleGoToStore = () => {
    setInitialSettingsTab('appearance');
    setPendingSettingsOpen(true); // Set the intent to open settings
    setIsCoinInfoOpen(false); // Start by closing the current dialog
  };
  
  const handleSettingsToggle = (isOpen: boolean) => {
    setIsSettingsOpen(isOpen);
    if (!isOpen) {
      // Reset the initial tab when the dialog is closed, so it opens on 'Profile' next time by default
      setInitialSettingsTab('profile');
    }
  };

  if (!context || !context.userData) return null;

  const dayOfWeekRaw = getDay(currentDate); // Sun=0, Mon=1, ..., Sat=6
  const dayOfWeek = dayOfWeekRaw === 0 ? 7 : dayOfWeekRaw; // Mon=1, ..., Sun=7
  const weekendStartDay = userData?.weekendTabStartDay ?? 5; // Default Friday (5)
  const isWeekendVisible = dayOfWeek >= weekendStartDay;

  const tabs = useMemo(() => {
    const baseTabs = [
      { value: "next-tasks", label: "Teme" },
    ];
    if (isWeekendVisible) {
      baseTabs.push({ value: "weekend", label: "Weekend" });
    }
    baseTabs.push({ value: "calendar", label: "Calendar" });
    return baseTabs;
  }, [isWeekendVisible]);

  return (
    <main className="container mx-auto max-w-6xl py-8 px-4 fade-in-up">
      <header className="mb-6 flex justify-between items-start gap-4">
        <div className="flex items-center gap-4 rounded-lg border bg-card/90 p-4 backdrop-blur-sm">
           <div>
            <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-shadow-elegant">
              Salut, {userData.name}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setIsCoinInfoOpen(true)} className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1 border self-start mt-1 h-auto">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-lg">{userData.coins || 0}</span>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-6 w-6" />
                <span className="sr-only">Setări</span>
            </Button>
            <Button onClick={() => setAddTaskOpen(true)} size="icon" variant="default" className="w-12 h-12">
                <Plus className="h-6 w-6" />
                <span className="sr-only">Adaugă temă</span>
            </Button>
        </div>
      </header>
      
      <Tabs defaultValue="next-tasks" className="w-full">
        <TabsList className={cn("grid w-full max-w-lg mx-auto mb-6", `grid-cols-${tabs.length}`)}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="next-tasks">
            <div className="w-full max-w-3xl mx-auto">
                {displayedDay ? (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="flex items-center gap-3 text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    <CalendarIcon className="h-6 w-6 text-primary"/>
                                    <span>{format(displayedDay, "EEEE, d MMMM", { locale: ro })}</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={handlePrevDay}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleNextDay}>
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                            <HomeworkList displayDate={displayedDay} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <h3 className="text-xl font-semibold">Nicio temă viitoare</h3>
                            <p className="text-muted-foreground">Nu ai nicio temă programată în curând. Bucură-te de timpul liber!</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TabsContent>

        
          {isWeekendVisible && (
            <TabsContent value="weekend">
              <WeekendView />
            </TabsContent>
          )}
        

        <TabsContent value="calendar">
            <ExpandableCalendarView />
        </TabsContent>
      </Tabs>
      
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={handleSettingsToggle} initialTab={initialSettingsTab} />

      <AlertDialog open={isCoinInfoOpen} onOpenChange={setIsCoinInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex flex-col items-center text-center gap-2">
                <Coins className="h-12 w-12 text-yellow-500" />
                <AlertDialogTitle>Sistemul de Monede</AlertDialogTitle>
                 <div className="font-bold text-2xl flex items-center gap-2">
                    <span>Ai</span>
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span>{userData.coins || 0}</span>
                </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-center pt-2 text-sm text-muted-foreground">
              <p>
                Câștigi monede pentru finalizarea temelor înainte de termen. Cu cât termini mai devreme, cu atât recompensa e mai mare!
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-left">
                <li><span className="font-semibold">Finalizată cu peste 2 zile înainte:</span> 10 monede</li>
                <li><span className="font-semibold">Finalizată cu 2 zile înainte:</span> 7 monede</li>
                <li><span className="font-semibold">Finalizată cu 1 zi înainte:</span> 5 monede</li>
              </ul>
              <p>
                Folosește monedele în Magazin pentru a debloca teme de culori noi și pentru a-ți personaliza aplicația!
              </p>
            </div>
            </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Închide</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToStore}>Mergi la Magazin</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
