'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    <div className="relative py-4">
      {/* The vertical line */}
      <div className="absolute top-0 border-border border-2 h-full" style={{ left: '50%', transform: 'translateX(-50%)' }} />

      {allVisibleTasks.map((task, taskIdx) => {
        const isLeft = taskIdx % 2 !== 0;

        return (
          <div key={task.id} className={cn(
            "mb-8 flex justify-between items-center w-full",
            isLeft && "flex-row-reverse"
          )}>
            {/* Spacer */}
            <div className="order-1 w-5/12" />

            {/* Dot */}
            <div className="z-10 flex items-center order-1 bg-primary ring-8 ring-background shadow-xl w-8 h-8 rounded-full">
              <CalendarClock className="h-5 w-5 text-primary-foreground mx-auto" />
            </div>

            {/* Content */}
            <div className="order-1 w-5/12 px-1 md:px-4">
               <p className={cn(
                 "mb-2 text-sm sm:text-base font-semibold text-muted-foreground",
                 isLeft ? "text-right" : "text-left"
               )}>
                {format(new Date(task.dueDate), "EEEE, d MMMM", { locale: ro })}
              </p>
              <HomeworkItem task={task} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
