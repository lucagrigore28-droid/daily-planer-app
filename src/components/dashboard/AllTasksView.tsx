'use client';

import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { HomeworkTask } from '@/lib/types';

// Helper hook to get the previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function AllTasksView() {
  const context = useContext(AppContext);
  const { tasks } = context!;

  // Get the list of tasks that *should* be visible (uncompleted ones)
  const currentVisibleTasks = useMemo(() => tasks
    .filter(task => !task.isCompleted && !task.isLocked)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [tasks]);

  const [displayedTasks, setDisplayedTasks] = useState<HomeworkTask[]>(currentVisibleTasks);

  const prevTasks = usePrevious(currentVisibleTasks) || [];

  useEffect(() => {
    const prevTaskIds = new Set(prevTasks.map(t => t.id));
    const currentTaskIds = new Set(currentVisibleTasks.map(t => t.id));

    // Find tasks that were in the previous list but not in the current one (i.e., just completed)
    const disappearingTaskIds = [...prevTaskIds].filter(id => !currentTaskIds.has(id));

    if (disappearingTaskIds.length > 0) {
      const disappearingTasks = prevTasks
        .filter(t => disappearingTaskIds.includes(t.id))
        .map(t => ({ ...t, isDisappearing: true } as HomeworkTask));
      
      // Show the current tasks + the disappearing ones
      const tasksToRender = [...currentVisibleTasks, ...disappearingTasks]
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setDisplayedTasks(tasksToRender);

      // After the animation, remove the disappearing tasks from the display list
      const timer = setTimeout(() => {
        setDisplayedTasks(currentVisibleTasks);
      }, 400); // Match animation duration in globals.css

      return () => clearTimeout(timer);
    } else {
      setDisplayedTasks(currentVisibleTasks);
    }
  }, [currentVisibleTasks]);

  if (displayedTasks.length === 0 && (!prevTasks || prevTasks.length === 0)) {
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
      <div className="absolute top-0 left-12 border-border border-2 h-full" />

      {displayedTasks.map((task, index) => {
        return (
          <div 
            key={task.id} 
            className={cn(
              "mb-8 flex items-center w-full",
              task.isDisappearing ? 'animate-fade-out-shrink' : 'fade-in-up'
            )}
            style={{ animationDelay: task.isDisappearing ? '0ms' : `${index * 75}ms` }}
          >
            {/* Spacer & Dot */}
            <div className="w-24 flex-shrink-0 flex justify-center">
                <div className="z-10 flex items-center bg-primary ring-8 ring-background shadow-xl w-8 h-8 rounded-full">
                  <CalendarClock className="h-5 w-5 text-primary-foreground mx-auto" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow pr-4">
               <p className="mb-2 text-sm sm:text-base font-semibold text-muted-foreground">
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
