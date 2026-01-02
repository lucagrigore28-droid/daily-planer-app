
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
  // Using single letters as requested
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return days[day.getDay()];
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
    },
  };


  return (
    <Card className="h-[75vh] overflow-hidden">
        <CardContent className="flex flex-row h-full p-0">
            <div className="w-3/5 xl:w-2/3 border-r-2 border-black p-4">
                 <Calendar
                    mode="single"
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    className="h-full w-full"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    locale={ro}
                    formatters={{ formatWeekdayName }}
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 h-full",
                        month: "space-y-4 h-full flex flex-col",
                        caption: "flex items-center justify-center relative mb-4 h-10",
                        caption_label: "text-2xl font-bold font-headline absolute right-0",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-8 w-8",
                        table: "w-full border-collapse flex-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-full text-center font-normal text-base",
                        tbody: "mt-2",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex-1 flex justify-center items-center h-16",
                        day: "h-14 w-14 text-lg p-0 font-normal aria-selected:opacity-100 rounded-full flex items-center justify-center",
                        day_selected:
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground rounded-full",
                        day_outside: "day-outside text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
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
