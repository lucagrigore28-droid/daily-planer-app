"use client";

import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HomeworkList from './HomeworkList';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

export default function ExpandableCalendarView() {
  const context = useContext(AppContext);
  const { tasks, events } = context!;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayIndex = (getDay(monthStart) + 6) % 7;

  const daysOfWeek = ['LU', 'MA', 'MI', 'JO', 'VI', 'SÂ', 'DU'];

  const itemsByDay = useMemo(() => {
    const map = new Map<string, { tasks: number; events: number }>();
    if (!tasks || !events) return map;

    tasks.forEach(task => {
        if (!task.isCompleted) {
            const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
            const current = map.get(dateStr) || { tasks: 0, events: 0 };
            map.set(dateStr, { ...current, tasks: current.tasks + 1 });
        }
    });

    events.forEach(event => {
        const dateStr = format(new Date(event.eventDate), 'yyyy-MM-dd');
        const current = map.get(dateStr) || { tasks: 0, events: 0 };
        map.set(dateStr, { ...current, events: current.events + 1 });
    });

    return map;
  }, [tasks, events]);


  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
                            {format(currentMonth, 'LLLL', { locale: ro })}
                        </span>
                        <span className="text-4xl font-extrabold text-foreground">
                            {format(currentMonth, 'yyyy', { locale: ro })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center font-bold text-muted-foreground text-sm">
                            {day}
                        </div>
                    ))}
                    {Array.from({ length: startingDayIndex }).map((_, index) => (
                        <div key={`empty-${index}`} />
                    ))}
                    {daysInMonth.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayOfWeek = getDay(day);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const dayItems = itemsByDay.get(dayKey);
                        const hasTasks = !!dayItems?.tasks;
                        const hasEvents = !!dayItems?.events;

                        return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                'relative flex items-center justify-center h-14 text-xl font-bold rounded-lg cursor-pointer transition-colors duration-200',
                                isSameDay(day, selectedDate)
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                    : 'hover:bg-accent/80',
                                {
                                    'text-primary': isWeekend && !isSameDay(day, selectedDate),
                                    'bg-accent/50': isToday(day) && !isSameDay(day, selectedDate),
                                }
                            )}
                        >
                            <span>{format(day, 'd')}</span>
                            {hasTasks && (
                                <span className={cn(
                                    "absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full",
                                    isSameDay(day, selectedDate) ? 'bg-primary-foreground' : 'bg-destructive'
                                )} />
                            )}
                             {hasEvents && (
                                <span className={cn(
                                    "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                                    isSameDay(day, selectedDate) ? 'bg-primary-foreground' : 'bg-blue-500'
                                )} />
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col">
                <h2 className="text-2xl font-bold font-headline mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Activități pentru <span className="text-primary">{format(selectedDate, 'd MMMM yyyy', { locale: ro })}</span>
                </h2>
                <ScrollArea className="flex-1 pr-3 -mr-3">
                     <HomeworkList displayDate={selectedDate} />
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
  );
}
