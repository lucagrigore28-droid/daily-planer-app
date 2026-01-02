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

    const nextSchoolDayDate = startOfDay(displayDate);
    const nextDayIndex = getDay(nextSchoolDayDate);

    const subjectsForNextDay = userData.subjects.filter(subject =>
      userData.schedule[subject.id]?.includes(nextDayIndex)
    );
    
    // We will collect new tasks here and add them all at once.
    let generatedTasks: HomeworkTask[] = [];

    subjectsForNextDay.forEach(subject => {
        // The check must be against the existing tasks in the state.
        const taskExists = tasks.some(task => 
            task.subjectId === subject.id && 
            !task.isManual && // Make sure we are not clashing with a manually added task
            startOfDay(new Date(task.dueDate)).getTime() === nextSchoolDayDate.getTime()
        );

        if (!taskExists) {
            const newScheduledTask: HomeworkTask = {
                id: `${subject.id}-${nextSchoolDayDate.toISOString()}`, // Use a predictable ID
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
      setTasks(prevTasks => {
        const newTasksToAdd = generatedTasks.filter(
          genTask => !prevTasks.some(prevTask => prevTask.id === genTask.id)
        );
        return [...prevTasks, ...newTasksToAdd];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.setupComplete, userData.subjects, userData.schedule, displayDate]);


  const sortedTasks = useMemo(() => {
    const tasksForDisplayDate = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === startOfDay(displayDate).getTime());
    
    // Deduplicate tasks just in case, before rendering
    const uniqueTasks = tasksForDisplayDate.reduce((acc, current) => {
        if (!current.isManual) {
            if (!acc.find(item => item.subjectId === current.subjectId && !item.isManual)) {
                acc.push(current);
            }
        } else {
            acc.push(current);
        }
        return acc;
    }, [] as HomeworkTask[]);

    // Sort tasks: incomplete first, then completed
    return uniqueTasks.sort((a, b) => {
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
