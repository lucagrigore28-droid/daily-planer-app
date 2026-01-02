
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
    <Card className="h-[75vh] overflow-hidden">
        <CardContent className="flex flex-row h-full p-0">
            <div className="w-3/5 xl:w-2/3 border-r">
                 <Calendar
                    mode="single"
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    className="h-full w-full flex-1 p-4"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    locale={ro}
                    formatters={{ formatWeekdayName }}
                    classNames={{
                        months: "h-full flex-1",
                        month: "h-full flex flex-col",
                        table: "flex-1",
                        head_cell: "w-full",
                        row: "w-full",
                        day: "w-full h-16 text-lg",
                        cell: "w-full"
                    }}
                />
            </div>
            <div className="w-2/5 xl:w-1/3">
                <ScrollArea className="h-full p-4">
                    {selectedDay && <HomeworkList displayDate={selectedDay} />}
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
  );
}
