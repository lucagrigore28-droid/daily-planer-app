
"use client";

import React, { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Coins, CalendarDays, List, GitFork } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TasksViewMode } from './TasksView';

const viewModes = {
    daily: { icon: CalendarDays, label: 'Vizualizare Zilnică' },
    timeline: { icon: List, label: 'Cronologie' },
    'alternating-timeline': { icon: GitFork, label: 'Cronologie Alternantă' },
};

type DashboardHeaderProps = {
    onOpenAddTask: () => void;
    onOpenSettings: () => void;
    onOpenCoinInfo: () => void;
    tasksViewMode: TasksViewMode;
    setTasksViewMode: (mode: TasksViewMode) => void;
    activeTab: string;
};

export default function DashboardHeader({
    onOpenAddTask,
    onOpenSettings,
    onOpenCoinInfo,
    tasksViewMode,
    setTasksViewMode,
    activeTab,
}: DashboardHeaderProps) {
    const context = useContext(AppContext);
    const { userData, currentDate } = context!;
    const CurrentViewIcon = viewModes[tasksViewMode].icon;

    return (
        <header className="mb-6 flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 rounded-lg border bg-card/90 p-4 backdrop-blur-sm">
                <div>
                    <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-shadow-elegant">
                        Salutare, {userData.name}!
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Azi este {format(currentDate, "EEEE, d MMMM", { locale: ro })}.
                    </p>
                </div>
                <Button variant="ghost" onClick={onOpenCoinInfo} className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1 border self-start mt-1 h-auto">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-lg">{userData.coins || 0}</span>
                </Button>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                    <Settings className="h-6 w-6" />
                    <span className="sr-only">Setări</span>
                </Button>
                <Button onClick={onOpenAddTask} size="icon" variant="default" className="w-12 h-12">
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Adaugă temă</span>
                </Button>
                {activeTab === 'next-tasks' && (
                    <Select value={tasksViewMode} onValueChange={(value) => { if (value) setTasksViewMode(value as TasksViewMode) }}>
                        <SelectTrigger className="w-12 h-12 sm:h-10 sm:w-auto gap-2 justify-center sm:justify-start">
                            <div className="flex items-center gap-2">
                                <CurrentViewIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">{viewModes[tasksViewMode].label}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(viewModes).map(([value, { icon: Icon, label }]) => (
                                <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </header>
    );
}
