"use client";

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { startOfDay, getDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';

export default function HomeworkList({ displayDate }: { displayDate: Date }) {
  const context = useContext(AppContext);
  const { tasks } = context!;

  const { dueTasks, plannedTasks } = useMemo(() => {
    if (!displayDate) return { dueTasks: [], plannedTasks: [] };
    
    const startOfDisplayDate = startOfDay(displayDate).getTime();

    const dueTasksForDay = tasks.filter(task => 
        startOfDay(new Date(task.dueDate)).getTime() === startOfDisplayDate
    );
    
    const plannedTasksForDay = tasks.filter(task => 
        task.plannedDate && startOfDay(new Date(task.plannedDate)).getTime() === startOfDisplayDate
    );
    
    const sortFn = (a: any, b: any) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
    };
    
    return { 
        dueTasks: dueTasksForDay.sort(sortFn), 
        plannedTasks: plannedTasksForDay.sort(sortFn) 
    };
  }, [tasks, displayDate]);

  const dayOfWeek = getDay(displayDate); // Sun=0, Sat=6
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (dueTasks.length === 0 && plannedTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Nicio temă programată</h3>
            <p className="text-muted-foreground">Nu ai nicio temă în orar pentru această zi. Bucură-te de timpul liber!</p>
        </CardContent>
      </Card>
    );
  }

  // Weekend View
  if (isWeekend) {
      if (plannedTasks.length === 0) {
           return (
            <div className="py-4 text-center text-sm text-muted-foreground">
                <p>Nicio temă planificată pentru această zi.</p>
            </div>
           );
      }
      const completedCount = plannedTasks.filter(t => t.isCompleted).length;
      const totalCount = plannedTasks.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const allCompleted = totalCount > 0 && completedCount === totalCount;
      const remainingCount = totalCount - completedCount;

      return (
          <div>
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                    <span className="text-muted-foreground">Progres</span>
                    <span className="text-primary">{`Mai ai ${remainingCount} teme din ce ti-ai propus`}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
            {allCompleted && (
                <Card className='mb-4'>
                    <CardContent className="p-6 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold">Felicitări!</h3>
                        <p className="text-muted-foreground">Ai terminat tot ce ți-ai propus pentru această zi.</p>
                    </CardContent>
                </Card>
            )}
            <div className="space-y-3">
                {plannedTasks.map(task => (
                    <HomeworkItem key={task.id} task={task} />
                ))}
            </div>
          </div>
      )
  }

  // Weekday View
  const allDueTasksCompleted = dueTasks.length > 0 && dueTasks.every(t => t.isCompleted);
  
  return (
    <div className="space-y-4">
      {/* Due Tasks Section */}
      {dueTasks.length > 0 && (
        <div>
            {allDueTasksCompleted && (
                <Card className='mb-4'>
                    <CardContent className="p-6 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold">Teme finalizate!</h3>
                        <p className="text-muted-foreground">Toate temele pentru această zi sunt finalizate. Bravo!</p>
                    </CardContent>
                </Card>
            )}
            <div className="space-y-3">
                {dueTasks.map(task => (
                    <HomeworkItem key={task.id} task={task} />
                ))}
            </div>
        </div>
      )}

      {/* Planned Tasks Section */}
      {plannedTasks.length > 0 && (
        <div>
          {dueTasks.length > 0 && <Separator className="my-6" />}
           <div className="space-y-3">
                {plannedTasks.map(task => (
                    <HomeworkItem key={task.id} task={task} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
