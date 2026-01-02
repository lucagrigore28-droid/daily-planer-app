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
  const { tasks, userData, setTasks } = context!;

  useEffect(() => {
    if (!userData.setupComplete) return;

    const nextSchoolDayDate = displayDate;
    const nextDayIndex = getDay(nextSchoolDayDate);

    const subjectsForNextDay = userData.subjects.filter(subject =>
      userData.schedule[subject.id]?.includes(nextDayIndex)
    );
    
    let generatedTasks: HomeworkTask[] = [];

    subjectsForNextDay.forEach(subject => {
        const taskExists = tasks.some(task => 
            task.subjectId === subject.id && 
            startOfDay(new Date(task.dueDate)).getTime() === nextSchoolDayDate.getTime()
        );

        if (!taskExists) {
            const newScheduledTask: HomeworkTask = {
                id: `${subject.id}-${nextSchoolDayDate.toISOString()}`,
                subjectId: subject.id,
                subjectName: subject.name,
                description: '',
                dueDate: nextSchoolDayDate.toISOString(),
                isCompleted: false,
                isManual: false,
            };
            generatedTasks.push(newScheduledTask);
        }
    });

    if (generatedTasks.length > 0) {
      setTasks(prevTasks => [...prevTasks, ...generatedTasks]);
    }
  }, [userData, tasks, displayDate, setTasks]);


  const tasksForDisplayDate = useMemo(() => {
    return tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === startOfDay(displayDate).getTime());
  }, [tasks, displayDate]);

  const incompleteTasks = useMemo(() => {
    return tasksForDisplayDate.filter(task => !task.isCompleted);
  }, [tasksForDisplayDate]);
  
  const allTasksCompleted = tasksForDisplayDate.length > 0 && incompleteTasks.length === 0;

  if (allTasksCompleted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold">Gata pentru azi!</h3>
            <p className="text-muted-foreground">Toate temele pentru această zi sunt finalizate. Bravo!</p>
        </CardContent>
      </Card>
    );
  }

  if (incompleteTasks.length === 0) {
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

  return (
    <div className="space-y-3">
      {incompleteTasks.map(task => (
        <HomeworkItem key={task.id} task={task} />
      ))}
    </div>
  );
}
