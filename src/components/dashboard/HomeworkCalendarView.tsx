
"use client";

import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Calendar } from '@/components/ui/calendar';
import HomeworkList from './HomeworkList';
import { startOfDay } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { ro } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';

const formatWeekdayName = (day: Date) => {
  const dayIndex = day.getDay();
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return days[dayIndex];
};


export default function HomeworkCalendarView() {
  const context = useContext(AppContext);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const tasksByDay = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    context?.tasks.forEach(task => {
      const day = startOfDay(new Date(task.dueDate)).toISOString();
      const existing = map.get(day) || { total: 0, completed: 0 };
      existing.total++;
      if (task.isCompleted) {
        existing.completed++;
      }
      map.set(day, existing);
    });
    return map;
  }, [context?.tasks]);

  const modifiers = {
    hasTasks: (date: Date) => {
      const day = startOfDay(date).toISOString();
      return tasksByDay.has(day);
    },
    allTasksCompleted: (date: Date) => {
      const day = startOfDay(date).toISOString();
      const stats = tasksByDay.get(day);
      return stats ? stats.total > 0 && stats.total === stats.completed : false;
    }
  };

  const modifiersStyles = {
    hasTasks: {
        fontWeight: 'bold',
        textDecoration: 'underline',
        textDecorationColor: 'hsl(var(--accent))',
        textDecorationThickness: '2px',
    },
    allTasksCompleted: {
      border: '2px solid hsl(var(--primary))',
      backgroundColor: 'hsla(var(--primary) / 0.1)',
      borderRadius: '50%',
    },
    selected: {
        backgroundColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        borderRadius: '50%',
    }
  };


  return (
    <Card className="flex flex-col h-[75vh] overflow-hidden">
        <CardContent className="flex-grow p-0 sm:p-2 flex flex-col">
            <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            className="w-full"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={ro}
            formatters={{ formatWeekdayName }}
            classNames={{
                head_cell: "w-full",
                day: "w-full h-12",
                cell: "w-full"
            }}
            />
            <div className="flex-shrink border-t mt-auto">
                <ScrollArea className="h-48 p-2 sm:p-4">
                    {selectedDay && <HomeworkList displayDate={selectedDay} />}
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
  );
}
