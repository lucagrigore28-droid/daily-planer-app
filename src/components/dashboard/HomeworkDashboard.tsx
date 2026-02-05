
"use client";

import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import AddTaskDialog from './AddTaskDialog';
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
import TasksView, { TasksViewMode } from './TasksView';
import DashboardHeader from './DashboardHeader';
import { Coins, Book, Calendar } from 'lucide-react';
import AddEventDialog from './AddEventDialog';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [isAddEventOpen, setAddEventOpen] = useState(false);
  const [isAddChoiceOpen, setAddChoiceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState('profile');
  const [isCoinInfoOpen, setIsCoinInfoOpen] = useState(false);
  const [tasksViewMode, setTasksViewMode] = useState<TasksViewMode>('daily');
  const [activeTab, setActiveTab] = useState('next-tasks');
  const isInitialMount = useRef(true);

  const { userData, currentDate } = context!;

  useEffect(() => {
    if (isInitialMount.current) {
      const savedMode = localStorage.getItem('dailyPlannerPro_viewMode') as TasksViewMode;
      if (savedMode) {
          setTasksViewMode(savedMode);
      }
      isInitialMount.current = false;
    } else {
      localStorage.setItem('dailyPlannerPro_viewMode', tasksViewMode);
    }
  }, [tasksViewMode]);

  const handleGoToStore = () => {
    setInitialSettingsTab('appearance');
    setIsCoinInfoOpen(false);
    setTimeout(() => {
      setIsSettingsOpen(true);
    }, 300);
  };
  
  const handleSettingsToggle = (isOpen: boolean) => {
    setIsSettingsOpen(isOpen);
    if (!isOpen) {
      setInitialSettingsTab('profile');
    }
  };

  const openChoiceDialog = (choice: 'task' | 'event') => {
    setAddChoiceOpen(false);
    // Replicăm soluția care a funcționat pentru bug-ul cu magazinul.
    // O durată mai mare permite primului dialog să se închidă complet.
    setTimeout(() => {
      if (choice === 'task') {
        setAddTaskOpen(true);
      } else {
        setAddEventOpen(true);
      }
    }, 300); // Am mărit durata la 300ms, identic cu soluția pentru magazin.
  };

  if (!context || !context.userData) return null;

  const dayOfWeekRaw = getDay(currentDate);
  const dayOfWeek = dayOfWeekRaw === 0 ? 7 : dayOfWeekRaw;
  const weekendStartDay = userData?.weekendTabStartDay ?? 5;
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
      <DashboardHeader 
        onOpenAddDialog={() => setAddChoiceOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCoinInfo={() => setIsCoinInfoOpen(true)}
        tasksViewMode={tasksViewMode}
        setTasksViewMode={setTasksViewMode}
        activeTab={activeTab}
      />
      
      <Tabs defaultValue="next-tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full max-w-lg mx-auto mb-6", `grid-cols-${tabs.length}`)}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="next-tasks">
            <div className="w-full max-w-3xl mx-auto">
              <TasksView viewMode={tasksViewMode} />
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
      <AddEventDialog open={isAddEventOpen} onOpenChange={setAddEventOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={handleSettingsToggle} initialTab={initialSettingsTab} />

      <AlertDialog open={isAddChoiceOpen} onOpenChange={setAddChoiceOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Ce dorești să adaugi?</AlertDialogTitle>
                <AlertDialogDescription>
                    Alege dacă vrei să adaugi o temă pentru școală sau un eveniment personal.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => openChoiceDialog('task')}>
                    <Book className="h-8 w-8"/>
                    Temă nouă
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => openChoiceDialog('event')}>
                    <Calendar className="h-8 w-8" />
                    Eveniment personal
                </Button>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
