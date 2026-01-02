"use client";

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, ClipboardList } from 'lucide-react';

type HomeworkListProps = {
  displayDate: Date;
};

export default function HomeworkList({ displayDate }: HomeworkListProps) {
  const context = useContext(AppContext);
  const { tasks, userData, getTasksForNextDay } = context!;
  const [currentDayTasks, setCurrentDayTasks] = useState(getTasksForNextDay);

  useEffect(() => {
    const nextDayTasks = getTasksForNextDay();
    setCurrentDayTasks(nextDayTasks);
  }, [tasks, userData, displayDate, getTasksForNextDay]);

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
