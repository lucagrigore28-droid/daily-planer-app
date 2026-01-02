"use client";

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function WeekendView() {
  const context = useContext(AppContext);
  const weekendTasks = useMemo(() => {
    if (!context) return [];
    // Sort tasks: incomplete first, then completed
    return context.getWeekendTasks().sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
    });
  }, [context]);

  if (!context) return null;

  if (weekendTasks.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Card>
            <CardContent className="p-6 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Nicio temă pentru săptămâna viitoare</h3>
                <p className="text-muted-foreground">Se pare că ești liber! Bucură-te de weekend.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  const allTasksCompleted = weekendTasks.every(task => task.isCompleted);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-2xl font-semibold font-headline mb-4 text-primary">
            Temele pentru săptămâna următoare
          </h2>
          <p className="text-muted-foreground mb-6">Finalizează prima temă de la fiecare materie pentru a fi cu un pas înainte.</p>
          
          {allTasksCompleted && (
             <div className="p-6 text-center rounded-lg bg-green-50 dark:bg-green-900/20 mb-6">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Gata pentru săptămâna viitoare!</h3>
                <p className="text-muted-foreground">Toate temele importante sunt finalizate. Weekend excelent!</p>
            </div>
          )}
          
           <div className="space-y-4">
              {weekendTasks.map(task => (
                  <div key={task.id}>
                      <div className="flex items-center justify-between">
                         <div className="flex-grow">
                           <HomeworkItem task={task} />
                         </div>
                         <div className="ml-4 text-right text-sm text-muted-foreground">
                           <p className="font-semibold">{format(new Date(task.dueDate), "EEEE", { locale: ro })}</p>
                           <p>{format(new Date(task.dueDate), "d MMMM", { locale: ro })}</p>
                         </div>
                      </div>
                  </div>
              ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
