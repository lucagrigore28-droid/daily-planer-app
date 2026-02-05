
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
import { Input } from '../ui/input';
import { CornerDownLeft, Trash2, Clock, Timer, Lock, Coins, Star, Share2, CalendarClock } from 'lucide-react';
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
import { isBefore, startOfDay, format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type HomeworkItemProps = {
  task: HomeworkTask;
  showDueDate?: boolean; 
};

const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export default function HomeworkItem({ task, showDueDate }: HomeworkItemProps) {
  const context = useContext(AppContext);
  const { toast } = useToast();
  const { 
    updateTask, 
    startTimer, 
    activeTimerTaskId, 
    lastCoinReward, 
    setLastCoinReward,
    lastCompletedTaskIdForProgress,
    setLastCompletedTaskIdForProgress
  } = context!;
  
  // State for editable fields
  const [description, setDescription] = useState(task.description);
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime || 0);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(task.scheduledDate ? new Date(task.scheduledDate) : null);
  const [scheduledTime, setScheduledTime] = useState(task.scheduledTime || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [coinReward, setCoinReward] = useState<{ amount: number; key: number } | null>(null);
  const [showStar, setShowStar] = useState<boolean>(false);

  useEffect(() => {
    if (lastCoinReward && lastCoinReward.taskId === task.id) {
        setCoinReward({ amount: lastCoinReward.amount, key: Date.now() });
        setLastCoinReward(null);
    }
  }, [lastCoinReward, task.id, setLastCoinReward]);

  useEffect(() => {
    if (lastCompletedTaskIdForProgress && lastCompletedTaskIdForProgress === task.id) {
      setShowStar(true);
      setLastCompletedTaskIdForProgress(null); 
      const timer = setTimeout(() => setShowStar(false), 1200); 
      return () => clearTimeout(timer);
    }
  }, [lastCompletedTaskIdForProgress, task.id, setLastCompletedTaskIdForProgress]);

  const isLocked = task.isLocked;
  const isOverdue = !task.isCompleted && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));
  
  const handleCompletionChange = (checked: boolean) => {
    context?.updateTask(task.id, { isCompleted: checked });
  };
  
  const handleSaveDetails = () => {
    setIsSaving(true);
    context?.updateTask(task.id, { 
        description,
        estimatedTime: estimatedTime > 0 ? estimatedTime : undefined,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : undefined,
        scheduledTime: scheduledTime || undefined,
    });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleDelete = () => {
    context?.deleteTask(task.id);
    setIsDeleteDialogOpen(false);
  }

  const handleShare = async () => {
    const shareData = {
      title: `Temă la ${task.subjectName}`,
      text: `Hei, am de făcut o temă la ${task.subjectName}.\nDescriere: ${task.description || 'Nicio descriere'}\nTermen: ${new Date(task.dueDate).toLocaleDateString('ro-RO')}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Eroare la partajare:", err);
      }
    } else {
        toast({
            title: "Partajare nu este suportată",
            description: "Browser-ul tău nu suportă funcția de partajare.",
        });
    }
  };
  
  // When the task prop updates from parent, reset the local state
  useEffect(() => {
    setDescription(task.description);
    setEstimatedTime(task.estimatedTime || 0);
    setScheduledDate(task.scheduledDate ? new Date(task.scheduledDate) : null);
    setScheduledTime(task.scheduledTime || '');
  }, [task]);

  const originalScheduledDate = task.scheduledDate ? new Date(task.scheduledDate) : null;
  const hasChanged = description !== task.description || 
                     estimatedTime !== (task.estimatedTime || 0) || 
                     (scheduledDate?.getTime() !== originalScheduledDate?.getTime()) ||
                     scheduledTime !== (task.scheduledTime || '');

  const anotherTimerIsRunning = activeTimerTaskId !== null && activeTimerTaskId !== task.id;

  if (activeTimerTaskId === task.id) {
    return <TaskTimer task={task} />;
  }
  
  const handleScheduledDateChange = (dateString: string) => {
      if (dateString) {
          const date = new Date(dateString + 'T00:00:00');
          setScheduledDate(date);
      } else {
          setScheduledDate(null);
          setScheduledTime(''); // Also clear time if date is cleared
      }
  }

  return (
    <>
      <Card className={cn(
        "transition-all duration-300",
        isLocked ? "bg-muted/50" : "hover:shadow-md hover:-translate-y-0.5",
        task.isCompleted ? 'border-gradient' : 'bg-card'
      )}>
        <div className="p-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-b-0">
              <div className={cn("flex items-center gap-4", isLocked && "opacity-60")}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="relative flex items-center">
                                <Checkbox
                                    id={`task-${task.id}`}
                                    checked={task.isCompleted}
                                    onCheckedChange={handleCompletionChange}
                                    disabled={isOverdue || isLocked}
                                    className="h-6 w-6 rounded-full"
                                />
                                {coinReward && (
                                    <div key={coinReward.key} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-coin-fly flex items-center gap-1 font-bold text-yellow-500 text-lg">
                                            <Coins className="h-5 w-5" />
                                            <span>+{coinReward.amount}</span>
                                        </div>
                                    </div>
                                )}
                                {showStar && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-star-fly">
                                            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TooltipTrigger>
                        {isOverdue && !isLocked && (
                            <TooltipContent>
                                <p>Termenul pentru această temă a expirat.</p>
                            </TooltipContent>
                        )}
                        {isLocked && (
                            <TooltipContent>
                                <p>Finalizează tema anterioară la această materie pentru a o debloca.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <div className="flex-1">
                  <Label 
                      htmlFor={`task-${task.id}`} 
                      className={cn(
                          "text-lg font-medium transition-colors",
                          isLocked ? "cursor-not-allowed" : "cursor-pointer",
                          task.isCompleted && "text-muted-foreground",
                          (isOverdue || isLocked) && "cursor-not-allowed text-muted-foreground/50"
                      )}
                  >
                    {task.subjectName}
                  </Label>
                  <div className={cn("flex items-center gap-3 text-xs", task.isCompleted ? "text-muted-foreground" : "text-muted-foreground")}>
                    {(task.estimatedTime || task.timeSpent) && (
                        <div className="flex items-center gap-1.5">
                           <Clock className="h-3 w-3" />
                           <span>
                               {task.timeSpent ? `${Math.round(task.timeSpent / 1000)} sec` : `${task.estimatedTime} min`}
                           </span>
                        </div>
                    )}
                    {showDueDate && (
                         <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                           <CalendarClock className="h-3 w-3" />
                           <span>
                               Termen: {format(new Date(task.dueDate), "d MMM", { locale: ro })}
                           </span>
                        </div>
                    )}
                  </div>
                </div>
                
                {isLocked ? (
                    <div className="flex items-center justify-end w-[72px]">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                ) : (
                    <>
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
                    </>
                )}
              </div>
              <AccordionContent className="pl-12 pr-4 pt-2 animate-accordion-down">
                <div className="space-y-4">
                  <div className="grid gap-2 fade-in-up" style={{animationDelay: '50ms'}}>
                      <Label htmlFor={`description-${task.id}`}>Descriere</Label>
                       <Textarea
                        id={`description-${task.id}`}
                        placeholder="Adaugă detalii despre temă..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[80px]"
                       />
                  </div>
                  
                  {/* --- Planning Section --- */}
                  <div className="grid gap-4 fade-in-up pt-2" style={{animationDelay: '150ms'}}>
                    <Label>Planificare (Opțional)</Label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={`scheduled-date-${task.id}`} className="text-xs text-muted-foreground">Ziua de lucru</Label>
                            <Input
                                id={`scheduled-date-${task.id}`}
                                type="date"
                                value={scheduledDate ? formatDateForInput(scheduledDate) : ''}
                                onChange={(e) => handleScheduledDateChange(e.target.value)}
                                />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={`scheduled-time-${task.id}`} className="text-xs text-muted-foreground">Ora de început</Label>
                            <Input
                                id={`scheduled-time-${task.id}`}
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                disabled={!scheduledDate} // Disable time if no date is set
                                />
                        </div>
                     </div>
                  </div>

                   <div className="grid gap-2 fade-in-up" style={{animationDelay: '250ms'}}>
                      <Label htmlFor={`estimated-time-${task.id}`}>Timp estimat (minute)</Label>
                      <div className="flex items-center gap-4 pt-1">
                           <Slider 
                              value={[estimatedTime]} 
                              max={180} 
                              step={5} 
                              onValueChange={(value) => setEstimatedTime(value[0])}
                              className="flex-1"
                          />
                          <div className="flex items-center gap-2">
                              <span className="font-bold w-12 text-right">{estimatedTime > 0 ? `${estimatedTime} min` : 'N/A'}</span>
                          </div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center fade-in-up pt-2" style={{animationDelay: '350ms'}}>
                      <div className="flex items-center gap-2">
                          {hasChanged && (
                            <Button size="sm" onClick={handleSaveDetails} disabled={isSaving}>
                                <CornerDownLeft className="mr-2 h-4 w-4"/>
                                {isSaving ? 'Se salvează...' : 'Salvează'}
                            </Button>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Partajează
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Șterge
                          </Button>
                      </div>
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
