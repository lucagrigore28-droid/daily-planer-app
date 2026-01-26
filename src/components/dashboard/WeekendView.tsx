
"use client";

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HomeworkItem from './HomeworkItem';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { format, nextFriday, nextSaturday, nextSunday, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '../ui/button';
import { GripVertical } from 'lucide-react';
import type { HomeworkTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePlannerItem } from './MobilePlannerItem';

type PlanningColumnProps = {
  title: string;
  date: Date;
  tasks: HomeworkTask[];
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
};

function PlanningColumn({ title, date, tasks, onDragOver, onDrop, isDragging }: PlanningColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsOver(false);
    onDrop(e);
  };

  return (
    <div className="flex-1 rounded-lg border bg-muted/40 p-3 min-h-[300px] flex flex-col">
      <h3 className="text-lg font-bold text-center mb-4 flex-shrink-0">{title}</h3>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "h-full space-y-3 p-2 rounded-md transition-colors flex-grow",
          isOver && isDragging && "bg-primary/20",
        )}
      >
        {tasks.map(task => (
            <DraggableHomeworkItem key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                <p>Trage o temă aici</p>
            </div>
        )}
      </div>
    </div>
  );
}

function DraggableHomeworkItem({ task }: {task: HomeworkTask}) {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("taskId", task.id);
        e.currentTarget.style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };

    return (
        <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} className="flex items-center gap-2 group flex-1">
             <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:text-foreground transition-colors" />
             <div className="min-w-0 flex-1">
                <HomeworkItem task={task} />
             </div>
        </div>
    )
}

export default function WeekendView() {
  const context = useContext(AppContext);
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();


  const weekendTasks = useMemo(() => {
    if (!context) return [];
    const tasks = context.getWeekendTasks();
    // Sort by completion status first (incomplete tasks first), then by due date
    return tasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
        }
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
    });
  }, [context]);

  const { currentDate, updateTask } = context!;

  const friday = nextFriday(startOfDay(currentDate));
  const saturday = nextSaturday(startOfDay(currentDate));
  const sunday = nextSunday(startOfDay(currentDate));

  const sortTasks = (tasks: HomeworkTask[]) => {
    return tasks.sort((a, b) => {
      if (a.isCompleted === b.isCompleted) return 0;
      return a.isCompleted ? 1 : -1;
    });
  };

  const plannedTasks = useMemo(() => {
    const fridayTasks: HomeworkTask[] = [];
    const saturdayTasks: HomeworkTask[] = [];
    const sundayTasks: HomeworkTask[] = [];
    const unplannedTasks: HomeworkTask[] = [];

    weekendTasks.forEach(task => {
      if (task.plannedDate) {
        const plannedDay = startOfDay(new Date(task.plannedDate));
        if (plannedDay.getTime() === friday.getTime()) {
          fridayTasks.push(task);
        } else if (plannedDay.getTime() === saturday.getTime()) {
          saturdayTasks.push(task);
        } else if (plannedDay.getTime() === sunday.getTime()) {
          sundayTasks.push(task);
        } else {
            unplannedTasks.push(task);
        }
      } else {
        unplannedTasks.push(task);
      }
    });

    return { 
        fridayTasks: sortTasks(fridayTasks), 
        saturdayTasks: sortTasks(saturdayTasks), 
        sundayTasks: sortTasks(sundayTasks), 
        unplannedTasks: sortTasks(unplannedTasks)
    };
  }, [weekendTasks, friday, saturday, sunday]);


  if (!context) return null;

  if (weekendTasks.length === 0 && !isPlanningMode) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Nicio temă pentru săptămâna viitoare</h3>
            <p className="text-muted-foreground">Se pare că ești liber! Bucură-te de weekend.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const taskId = e.dataTransfer.getData("taskId");
    if(taskId) {
        setDraggedTaskId(taskId);
        setIsDragging(true);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setIsDragging(false);
  };
  
  const handleDrop = (targetDate: Date | null) => (e: React.DragEvent<HTMLDivElement>) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
        updateTask(taskId, { plannedDate: targetDate ? targetDate.toISOString() : null });
    }
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const completedTasksCount = weekendTasks.filter(t => t.isCompleted).length;
  const totalTasksCount = weekendTasks.length;
  const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
  const allTasksCompleted = totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  const handlePlanDay = (taskId: string, day: 'friday' | 'saturday' | 'sunday' | null) => {
    let targetDate: Date | null = null;
    if (day === 'friday') targetDate = friday;
    if (day === 'saturday') targetDate = saturday;
    if (day === 'sunday') targetDate = sunday;
    
    updateTask(taskId, { plannedDate: targetDate ? targetDate.toISOString() : null });
  };


  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">
             <div className="flex-1 rounded-lg border bg-card/90 p-4 backdrop-blur-sm">
                <h2 className="text-2xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Planificator Weekend
                </h2>
                <p className="text-muted-foreground">Organizează-ți temele pentru zilele următoare.</p>
                {totalTasksCount > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1 text-sm font-medium">
                            <span className="text-muted-foreground">Progres</span>
                            <span className="text-primary">{completedTasksCount} / {totalTasksCount} teme</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                )}
            </div>
            <div className="mt-4">
                <Button onClick={() => setIsPlanningMode(!isPlanningMode)} className="w-full">
                    {isPlanningMode ? 'Vezi Lista' : 'Organizare'}
                </Button>
            </div>
        </div>

        {!isPlanningMode ? (
             <Card>
                <CardContent className="p-4">
                    {allTasksCompleted ? (
                         <div className="p-6 text-center">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                            <h3 className="text-xl font-semibold">Felicitări!</h3>
                            <p className="text-muted-foreground">Ai terminat toate temele pentru săptămâna viitoare. Ești gata de weekend!</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground mb-6">Finalizează prima temă de la fiecare materie pentru a fi cu un pas înainte.</p>
                    )}
                    <div className="space-y-4">
                        {weekendTasks.map(task => (
                             <div key={task.id} className="flex items-center justify-between">
                                <div className="flex-grow"><HomeworkItem task={task} /></div>
                                <div className="ml-4 text-right text-sm text-muted-foreground">
                                    <p className="font-semibold">{format(new Date(task.dueDate), "EEEE", { locale: ro })}</p>
                                    <p>{format(new Date(task.dueDate), "d MMMM", { locale: ro })}</p>
                                </div>
                             </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        ) : isMobile ? (
            <div className="space-y-4">
              <MobilePlannerItem title="Teme neplanificate" tasks={plannedTasks.unplannedTasks} onPlanDay={handlePlanDay} />
              <MobilePlannerItem title="Vineri" tasks={plannedTasks.fridayTasks} onPlanDay={handlePlanDay} />
              <MobilePlannerItem title="Sâmbătă" tasks={plannedTasks.saturdayTasks} onPlanDay={handlePlanDay} />
              <MobilePlannerItem title="Duminică" tasks={plannedTasks.sundayTasks} onPlanDay={handlePlanDay} />
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-4" onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {/* Unplanned Column */}
                <div className="lg:w-72 flex-shrink-0 rounded-lg border bg-muted/40 p-3 flex flex-col">
                    <h3 className="text-lg font-bold text-center mb-4 flex-shrink-0">Teme neplanificate</h3>
                     <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(null)}
                        className={cn(
                          "h-full space-y-3 p-2 rounded-md transition-colors flex-grow",
                           isDragging && "border-2 border-dashed border-gray-400"
                        )}
                     >
                        {plannedTasks.unplannedTasks.map(task => (
                            <DraggableHomeworkItem key={task.id} task={task} />
                        ))}
                     </div>
                </div>
                {/* Planning Columns */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PlanningColumn title="Vineri" date={friday} tasks={plannedTasks.fridayTasks} onDragOver={handleDragOver} onDrop={handleDrop(friday)} isDragging={isDragging} />
                    <PlanningColumn title="Sâmbătă" date={saturday} tasks={plannedTasks.saturdayTasks} onDragOver={handleDragOver} onDrop={handleDrop(saturday)} isDragging={isDragging} />
                    <PlanningColumn title="Duminică" date={sunday} tasks={plannedTasks.sundayTasks} onDragOver={handleDragOver} onDrop={handleDrop(sunday)} isDragging={isDragging} />
                </div>
            </div>
        )}
    </div>
  );
}
