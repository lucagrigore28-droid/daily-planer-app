
"use client";

import React, { useContext, useEffect, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { getDay, startOfDay } from 'date-fns';
import type { HomeworkTask } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, ClipboardList } from 'lucide-react';

type HomeworkListProps = {
  displayDate: Date;
};

export default function HomeworkList({ displayDate }: HomeworkListProps) {
  const context = useContext(AppContext);
  const { tasks, userData, addTask } = context!;

  useEffect(() => {
    if (!userData.setupComplete || !displayDate) return;

    const relevantDate = startOfDay(displayDate);
    const dayIndex = getDay(relevantDate);

    const subjectsForDay = userData.subjects.filter(subject =>
      userData.schedule[subject.id]?.includes(dayIndex)
    );

    subjectsForDay.forEach(subject => {
        addTask({
            subjectId: subject.id,
            subjectName: subject.name,
            description: '',
            dueDate: relevantDate.toISOString(),
            isCompleted: false,
            isManual: false,
            estimatedTime: undefined,
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.setupComplete, userData.subjects, userData.schedule, displayDate, addTask]);


  const sortedTasks = useMemo(() => {
    const tasksForDisplayDate = tasks.filter(task => {
        if (!displayDate) return false;
        return startOfDay(new Date(task.dueDate)).getTime() === startOfDay(displayDate).getTime()
    });
    
    // Sort tasks: incomplete first, then completed
    return tasksForDisplayDate.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
    });
  }, [tasks, displayDate]);

  const allTasksCompleted = sortedTasks.length > 0 && sortedTasks.every(task => task.isCompleted);

  if (sortedTasks.length === 0) {
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

  if (allTasksCompleted) {
    return (
      <>
        <Card>
            <CardContent className="p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Gata pentru azi!</h3>
                <p className="text-muted-foreground">Toate temele pentru această zi sunt finalizate. Bravo!</p>
            </CardContent>
        </Card>
        <div className="space-y-3 mt-4">
            {sortedTasks.map(task => (
              <HomeworkItem key={task.id} task={task} />
            ))}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map(task => (
        <HomeworkItem key={task.id} task={task} />
      ))}
    </div>
  );
}
