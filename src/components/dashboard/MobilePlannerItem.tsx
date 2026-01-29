
"use client";

import type { HomeworkTask } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import HomeworkItem from "./HomeworkItem";
import { cn } from "@/lib/utils";

type MobilePlannerItemProps = {
    title: string;
    tasks: HomeworkTask[];
    onPlanDay: (taskId: string, day: 'friday' | 'saturday' | 'sunday' | null) => void;
};

export function MobilePlannerItem({ title, tasks, onPlanDay }: MobilePlannerItemProps) {
    if (tasks.length === 0 && title !== 'Teme neplanificate') return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {tasks.map((task, index) => (
                    <div 
                        key={task.id} 
                        className="space-y-2 fade-in-up" 
                        style={{ animationDelay: `${index * 75}ms` }}
                    >
                        <HomeworkItem task={task} />
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-muted-foreground mr-2">Alocă:</span>
                            <Button
                                size="sm"
                                variant={task.plannedDate ? 'outline' : 'default'}
                                onClick={() => onPlanDay(task.id, 'friday')}
                                className={cn(
                                    "w-10 h-8",
                                    title === 'Vineri' && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                V
                            </Button>
                            <Button
                                size="sm"
                                variant={task.plannedDate ? 'outline' : 'default'}
                                onClick={() => onPlanDay(task.id, 'saturday')}
                                className={cn(
                                    "w-10 h-8",
                                    title === 'Sâmbătă' && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                S
                            </Button>
                            <Button
                                size="sm"
                                variant={task.plannedDate ? 'outline' : 'default'}
                                onClick={() => onPlanDay(task.id, 'sunday')}
                                className={cn(
                                    "w-10 h-8",
                                     title === 'Duminică' && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                D
                            </Button>
                            {task.plannedDate && (
                                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onPlanDay(task.id, null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                 {tasks.length === 0 && title === 'Teme neplanificate' && (
                    <p className="text-sm text-muted-foreground text-center py-4">Toate temele au fost planificate!</p>
                )}
            </CardContent>
        </Card>
    )
}
