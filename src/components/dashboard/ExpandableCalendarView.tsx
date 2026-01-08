
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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import HomeworkList from './HomeworkList';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import type { HomeworkTask } from '@/lib/types';

export default function ExpandableCalendarView() {
  const context = useContext(AppContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 0 is Sunday, so we adjust to make Monday the first day (0)
  const startingDayIndex = (getDay(monthStart) + 6) % 7;

  const daysOfWeek = ['LU', 'MA', 'MI', 'JO', 'VI', 'SÂ', 'DU'];

  const progressByDay = useMemo(() => {
    const tasksByDayMap = new Map<string, HomeworkTask[]>();
    context?.tasks.forEach(task => {
        const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!tasksByDayMap.has(dateStr)) {
            tasksByDayMap.set(dateStr, []);
        }
        tasksByDayMap.get(dateStr)!.push(task);
    });

    const progressMap = new Map<string, { completed: number; total: number; percentage: number }>();
    for (const [dateStr, tasks] of tasksByDayMap.entries()) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        progressMap.set(dateStr, { completed, total, percentage });
    }
    return progressMap;
  }, [context?.tasks]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <Card className="bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Side: Calendar */}
            <div className="w-full">
                {/* Calendar Header */}
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

                {/* Calendar Grid */}
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
                        const progress = progressByDay.get(dayKey);

                        return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                'relative flex items-center justify-center h-14 text-xl font-bold rounded-lg cursor-pointer transition-colors duration-200',
                                isSameDay(day, selectedDate)
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                    : 'hover:bg-accent',
                                {
                                    'text-primary': isWeekend && !isSameDay(day, selectedDate),
                                    'bg-accent/50': isToday(day) && !isSameDay(day, selectedDate),
                                }
                            )}
                        >
                            <span>{format(day, 'd')}</span>
                             {progress && progress.total > 0 && !isSameDay(day, selectedDate) && (
                                <>
                                  {progress.percentage === 100 ? (
                                    <div className="absolute bottom-1.5 right-1.5 h-4 w-4 bg-green-600 text-white rounded-full flex items-center justify-center">
                                        <Check className="h-3 w-3" />
                                    </div>
                                  ) : (
                                    <span
                                      className='absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500'
                                    />
                                  )}
                                </>
                            )}
                             {progress && progress.total > 0 && isSameDay(day, selectedDate) && (
                                <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 bg-destructive-foreground rounded-full" />
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Side: Homework List */}
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold font-headline mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Teme pentru <span className="text-primary">{format(selectedDate, 'd MMMM yyyy', { locale: ro })}</span>
                </h2>
                <ScrollArea className="flex-1 pr-3 -mr-3">
                     <HomeworkList displayDate={selectedDate} />
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
  );
}
