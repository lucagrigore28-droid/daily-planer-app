'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function AllTasksView() {
  const context = useContext(AppContext);
  const { tasks } = context!;

  const allVisibleTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Filter for incomplete and unlocked tasks, then sort by due date
    return tasks
      .filter(task => !task.isCompleted && !task.isLocked)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  }, [tasks]);

  if (allVisibleTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold">Felicitări!</h3>
            <p className="text-muted-foreground">Nu mai ai nicio temă de făcut. Ești la zi!</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {allVisibleTasks.map((task, taskIdx) => (
          <li key={task.id}>
            <div className="relative pb-8">
              {taskIdx !== allVisibleTasks.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
              ) : null}
              <div className="relative flex items-start space-x-4">
                <div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-8 ring-background">
                    <CalendarClock className="h-5 w-5 text-primary-foreground" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="text-sm font-semibold text-muted-foreground">
                    {format(new Date(task.dueDate), "EEEE, d MMMM", { locale: ro })}
                  </div>
                  <div className="mt-2">
                    <HomeworkItem task={task} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
