"use client";

import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import HomeworkList from './HomeworkList';
import AllTasksView from './AllTasksView';
import AlternatingTimelineView from './AlternatingTimelineView';
import { Separator } from '../ui/separator';

export type TasksViewMode = 'daily' | 'timeline' | 'alternating-timeline';

type TasksViewProps = {
    viewMode: TasksViewMode;
};

export default function TasksView({ viewMode }: TasksViewProps) {
    const context = useContext(AppContext);
    const [displayedDay, setDisplayedDay] = useState<Date | null>(null);

    const { areTasksSynced, isDataLoaded, getNextDayWithTasks } = context!;

    useEffect(() => {
        if (areTasksSynced && isDataLoaded && !displayedDay) {
            const nextDay = getNextDayWithTasks();
            setDisplayedDay(nextDay ? startOfDay(nextDay) : startOfDay(new Date()));
        }
    }, [areTasksSynced, isDataLoaded, displayedDay, getNextDayWithTasks]);

    const handlePrevDay = () => {
        if (displayedDay) {
            setDisplayedDay(subDays(displayedDay, 1));
        }
    };

    const handleNextDay = () => {
        if (displayedDay) {
            setDisplayedDay(addDays(displayedDay, 1));
        }
    };

    if (viewMode === 'daily') {
        if (!displayedDay) {
            return (
                <Card>
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-semibold">Nicio temă viitoare</h3>
                        <p className="text-muted-foreground">Nu ai nicio temă programată în curând. Bucură-te de timpul liber!</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <CalendarIcon className="h-10 w-10 text-primary" />
                            <div>
                                <h2 className="text-base text-muted-foreground">Teme pentru</h2>
                                <h3 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    {format(displayedDay, "EEEE, d MMMM", { locale: ro })}
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="hover:bg-muted">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNextDay} className="hover:bg-muted">
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <HomeworkList displayDate={displayedDay} />
                </CardContent>
            </Card>
        );
    }

    if (viewMode === 'timeline') {
        return <AllTasksView />;
    }

    return <AlternatingTimelineView />;
}
