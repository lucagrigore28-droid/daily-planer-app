'use client';

import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, CalendarClock, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { HomeworkTask } from '@/lib/types';

// Helper hook to get the previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function AlternatingTimelineView() {
  const context = useContext(AppContext);
  const { tasks } = context!;

  const currentVisibleTasks = useMemo(() => tasks
    .filter(task => !task.isCompleted && !task.isLocked)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [tasks]);

  const [displayedTasks, setDisplayedTasks] = useState<HomeworkTask[]>(currentVisibleTasks);
  const prevTasks = usePrevious(currentVisibleTasks) || [];

  useEffect(() => {
    const prevTaskIds = new Set(prevTasks.map(t => t.id));
    const currentTaskIds = new Set(currentVisibleTasks.map(t => t.id));

    const disappearingTaskIds = [...prevTaskIds].filter(id => !currentTaskIds.has(id));

    if (disappearingTaskIds.length > 0) {
      const disappearingTasks = prevTasks
        .filter(t => disappearingTaskIds.includes(t.id))
        .map(t => ({ ...t, isDisappearing: true } as HomeworkTask));

      const tasksToRender = [...currentVisibleTasks, ...disappearingTasks]
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setDisplayedTasks(tasksToRender);

      const timer = setTimeout(() => {
        setDisplayedTasks(currentVisibleTasks);
      }, 400);

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
      <div className="absolute top-0 border-border border-2 h-full" style={{ left: '50%', transform: 'translateX(-50%)' }} />

      {displayedTasks.map((task, taskIdx) => {
        const isLeft = taskIdx % 2 !== 0;

        return (
          <div key={task.id} className={cn(
            "mb-8 flex justify-between items-center w-full",
            task.isDisappearing ? 'animate-fade-out-shrink' : 'fade-in-up',
            isLeft && "flex-row-reverse"
          )} style={{ animationDelay: task.isDisappearing ? '0ms' : `${taskIdx * 75}ms` }}>
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
              
              <Popover>
                <PopoverTrigger asChild>
                  <Card className={cn(
                    "cursor-pointer transition-shadow hover:shadow-md",
                    task.isCompleted && "bg-muted/50 border-dashed"
                  )}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold truncate",
                          task.isCompleted && "line-through text-muted-foreground"
                        )}>{task.subjectName}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-none" align={isLeft ? 'end' : 'start'}>
                  <HomeworkItem task={task} viewMode="static" />
                </PopoverContent>
              </Popover>

            </div>
          </div>
        );
      })}
    </div>
  );
}
