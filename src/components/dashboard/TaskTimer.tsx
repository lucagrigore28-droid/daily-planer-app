
'use client';

import React, { useState, useEffect, useContext } from 'react';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, StopCircle } from 'lucide-react';

type TaskTimerProps = {
  task: HomeworkTask;
};

// Helper to format milliseconds into MM:SS
const formatTime = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function TaskTimer({ task }: TaskTimerProps) {
  const context = useContext(AppContext);
  const { startTimer, pauseTimer, completeTaskWithTimer } = context!;

  const totalDuration = (task.estimatedTime || 0) * 60 * 1000;
  const timeAlreadySpent = task.timeSpent || 0;

  const getInitialTimeRemaining = () => {
    if (!task.timerStartTime) { // Timer is paused
      return totalDuration - timeAlreadySpent;
    }
    // Timer is running, calculate current remaining time
    const elapsedSinceStart = Date.now() - task.timerStartTime;
    return totalDuration - (timeAlreadySpent + elapsedSinceStart);
  };

  const [timeRemaining, setTimeRemaining] = useState(getInitialTimeRemaining());
  const isRunning = !!task.timerStartTime;

  useEffect(() => {
    // This effect ensures the timer state is correct when the task prop changes (e.g., from Firestore updates)
    setTimeRemaining(getInitialTimeRemaining());
  }, [task, totalDuration, timeAlreadySpent]);
  
  useEffect(() => {
    if (isRunning) {
      if (timeRemaining <= 0) {
        completeTaskWithTimer(task.id);
        return;
      }

      const interval = setInterval(() => {
        // We calculate remaining time from scratch each tick to avoid drift
        const elapsedSinceStart = Date.now() - (task.timerStartTime as number);
        const newRemaining = totalDuration - (timeAlreadySpent + elapsedSinceStart);

        if (newRemaining <= 0) {
          clearInterval(interval);
          completeTaskWithTimer(task.id);
        } else {
          setTimeRemaining(newRemaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, task.id, task.timerStartTime, totalDuration, timeAlreadySpent, completeTaskWithTimer]);
  
  const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100) : 0;

  return (
    <Card className="bg-card/90 border-primary border-2 shadow-lg shadow-primary/20">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">{task.subjectName}</p>
        </div>

        <div 
          className="relative flex items-center justify-center w-48 h-48 rounded-full"
          style={{ background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`}}
        >
            <div className="absolute w-[90%] h-[90%] bg-card rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold font-mono tabular-nums">
                    {formatTime(timeRemaining)}
                </span>
            </div>
        </div>

        <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="w-16 h-16 rounded-full"
              onClick={() => isRunning ? pauseTimer(task.id) : startTimer(task.id)}
            >
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              <span className="sr-only">{isRunning ? 'Pauză' : 'Pornește'}</span>
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="w-14 h-14 rounded-full"
              onClick={() => completeTaskWithTimer(task.id)}
            >
                <StopCircle className="h-7 w-7" />
                <span className="sr-only">Oprește și finalizează</span>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
