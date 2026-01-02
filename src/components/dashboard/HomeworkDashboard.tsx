"use client";

import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { addDays, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HomeworkList from './HomeworkList';
import ManualTimeDialog from './ManualTimeDialog';
import AddTaskDialog from './AddTaskDialog';

export default function HomeworkDashboard() {
  const context = useContext(AppContext);
  const [isManualTimeOpen, setManualTimeOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);

  useEffect(() => {
    if (context?.isDataLoaded && context.hasGpsAccess === null) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          context.setHasGpsAccess(false);
          setManualTimeOpen(true);
        } else {
          context.setHasGpsAccess(true);
        }
        permissionStatus.onchange = () => {
            const hasAccess = permissionStatus.state !== 'denied';
            context.setHasGpsAccess(hasAccess);
            if(!hasAccess) setManualTimeOpen(true);
        };
      });
    } else if (context?.isDataLoaded && context.hasGpsAccess === false) {
      setManualTimeOpen(true);
    }
  }, [context?.isDataLoaded, context?.hasGpsAccess, context]);

  if (!context) return null;
  const { userData, currentDate } = context;

  const nextDay = addDays(currentDate, 1);
  const formattedDate = format(nextDay, "EEEE, d MMMM", { locale: ro });

  return (
    <main className="container mx-auto max-w-3xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Salut, {userData.name}!
        </h1>
        <p className="text-muted-foreground">
          Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
        </p>
      </header>
      
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-headline font-semibold capitalize">
              Teme pentru {formattedDate}
            </h2>
            <Button size="sm" onClick={() => setAddTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adaugă temă
            </Button>
          </div>
          <HomeworkList displayDate={nextDay} />
        </div>
      </div>
      
      <ManualTimeDialog open={isManualTimeOpen} onOpenChange={setManualTimeOpen} />
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen} />
    </main>
  );
}
