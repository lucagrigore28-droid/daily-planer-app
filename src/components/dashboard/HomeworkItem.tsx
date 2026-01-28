
"use client";

import React, { useContext, useState, useEffect } from 'react';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';
import { CornerDownLeft, Trash2, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from '../ui/slider';
import TaskTimer from './TaskTimer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { isBefore, startOfDay } from 'date-fns';

type HomeworkItemProps = {
  task: HomeworkTask;
};

export default function HomeworkItem({ task }: HomeworkItemProps) {
  const context = useContext(AppContext);
  const { updateTask, startTimer, activeTimerTaskId } = context!;
  const [description, setDescription] = useState(task.description);
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isOverdue = !task.isCompleted && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));
  
  const handleCompletionChange = (checked: boolean) => {
    context?.updateTask(task.id, { isCompleted: checked });
  };
  
  const handleSaveDetails = () => {
    setIsSaving(true);
    context?.updateTask(task.id, { 
        description,
        estimatedTime: estimatedTime > 0 ? estimatedTime : undefined,
    });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleDelete = () => {
    context?.deleteTask(task.id);
    setIsDeleteDialogOpen(false);
  }
  
  useEffect(() => {
    setDescription(task.description);
    setEstimatedTime(task.estimatedTime || 0);
  }, [task]);

  const hasChanged = description !== task.description || estimatedTime !== (task.estimatedTime || 0);

  const anotherTimerIsRunning = activeTimerTaskId !== null && activeTimerTaskId !== task.id;

  if (activeTimerTaskId === task.id) {
    return <TaskTimer task={task} />;
  }

  return (
    <>
      <Card className={cn(
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
         task.isCompleted ? 'border-gradient' : 'bg-card'
      )}>
        <div className="p-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-b-0">
              <div className={cn("flex items-center gap-4")}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center">
                                <Checkbox
                                    id={`task-${task.id}`}
                                    checked={task.isCompleted}
                                    onCheckedChange={handleCompletionChange}
                                    disabled={isOverdue}
                                    className="h-6 w-6 rounded-full"
                                />
                            </div>
                        </TooltipTrigger>
                        {isOverdue && (
                            <TooltipContent>
                                <p>Termenul pentru această temă a expirat.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <div className="flex-1">
                  <Label 
                      htmlFor={`task-${task.id}`} 
                      className={cn(
                          "text-lg font-medium cursor-pointer transition-colors",
                          task.isCompleted && "text-muted-foreground",
                          isOverdue && "cursor-not-allowed text-muted-foreground/50"
                      )}
                  >
                    {task.subjectName}
                  </Label>
                  {(task.estimatedTime || task.timeSpent) && (
                      <div className={cn("flex items-center gap-1.5 text-xs", task.isCompleted ? "text-muted-foreground" : "text-muted-foreground")}>
                          <Clock className="h-3 w-3" />
                          <span>
                            {task.timeSpent ? `${Math.round(task.timeSpent / 1000)} sec lucrate` : `${task.estimatedTime} min estimate`}
                          </span>
                      </div>
                  )}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                {!task.isCompleted && (
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        startTimer(task.id);
                                    }}
                                    disabled={anotherTimerIsRunning || isOverdue}
                                    className="mr-1"
                                    >
                                    <Timer className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{anotherTimerIsRunning ? 'Un alt timer este deja activ' : 'Pornește cronometru'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <AccordionTrigger disabled={isOverdue || task.isCompleted} className="p-2 [&[data-state=open]>svg]:text-primary" />
              </div>
              <AccordionContent className="pl-12 pr-4 pt-2 animate-accordion-down">
                <div className="space-y-4">
                  <div className="grid gap-2">
                      <Label htmlFor={`description-${task.id}`}>Descriere</Label>
                       <Textarea
                        id={`description-${task.id}`}
                        placeholder="Adaugă detalii despre temă..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[80px]"
                       />
                  </div>
                  
                   <div className="grid gap-2">
                      <Label htmlFor={`estimated-time-${task.id}`}>Timp estimat (minute)</Label>
                      <div className="flex items-center gap-4 pt-2">
                           <Slider 
                              value={[estimatedTime]} 
                              max={180} 
                              step={1} 
                              onValueChange={(value) => setEstimatedTime(value[0])}
                              className="flex-1"
                          />
                          <div className="flex items-center gap-2">
                              <span className="font-bold w-12 text-right">{estimatedTime > 0 ? `${estimatedTime} min` : 'N/A'}</span>
                          </div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <div>
                          {hasChanged && (
                            <Button size="sm" onClick={handleSaveDetails} disabled={isSaving}>
                                <CornerDownLeft className="mr-2 h-4 w-4"/>
                                {isSaving ? 'Se salvează...' : 'Salvează detaliile'}
                            </Button>
                          )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Șterge
                      </Button>
                   </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești absolut sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Tema pentru <strong>{task.subjectName}</strong> va fi ștearsă definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
