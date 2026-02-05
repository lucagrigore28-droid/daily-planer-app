
'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, CalendarClock, CalendarCheck } from 'lucide-react';
import { format, isSameDay, startOfToday } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Separator } from '../ui/separator';

export default function AllTasksView() {
  const context = useContext(AppContext);
  const { tasks } = context!;

  const { tasksByDueDate, plannedTasks } = useMemo(() => {
    const uncompletedTasks = tasks.filter(task => !task.isCompleted);

    const tasksByDueDate = uncompletedTasks
      .filter(task => !task.scheduledDate) // Tasks WITHOUT a scheduled date
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const plannedTasks = uncompletedTasks
      .filter(task => !!task.scheduledDate) // Tasks WITH a scheduled date
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

    return { tasksByDueDate, plannedTasks };
  }, [tasks]);

  if (tasksByDueDate.length === 0 && plannedTasks.length === 0) {
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

  const today = startOfToday();

  return (
    <div className="space-y-8">
      {/* Section 1: Tasks sorted by Due Date */}
      {tasksByDueDate.length > 0 && (
        <div className="space-y-6">
          {tasksByDueDate.map((task, index) => {
            const taskDate = new Date(task.dueDate);
            const isFirstInGroup = index === 0 || !isSameDay(taskDate, new Date(tasksByDueDate[index - 1].dueDate));
            
            return (
              <div key={task.id}>
                {isFirstInGroup && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                        <CalendarClock className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold font-headline">
                      {format(taskDate, "EEEE, d MMMM", { locale: ro })}
                    </h3>
                  </div>
                )}
                <div className="ml-5 pl-8 border-l-2 border-border">
                  <HomeworkItem task={task} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2: Planned Tasks */}
      {plannedTasks.length > 0 && (
        <div>
          {tasksByDueDate.length > 0 && <Separator className="my-8" />}
          <div className="flex items-center gap-4 mb-6">
             <h2 className="text-2xl font-bold text-center flex-1">Teme Planificate</h2>
          </div>
          <div className="space-y-6">
            {plannedTasks.map((task, index) => {
              const taskDate = new Date(task.scheduledDate!);
              const isFirstInGroup = index === 0 || !isSameDay(taskDate, new Date(plannedTasks[index - 1].scheduledDate!));

              return (
                <div key={task.id}>
                  {isFirstInGroup && (
                     <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent text-accent-foreground">
                            <CalendarCheck className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-semibold font-headline">
                          {format(taskDate, "EEEE, d MMMM", { locale: ro })}
                        </h3>
                    </div>
                  )}
                  <div className="ml-5 pl-8 border-l-2 border-border">
                     <HomeworkItem task={task} showDueDate />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
