
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

// Helper to play a sound
const playCompletionSound = () => {
  if (typeof window === 'undefined' || !window.AudioContext) {
    return;
  }
  const audioContext = new (window.AudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

// Helper to show a browser notification
const showCompletionNotification = (taskName: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Timpul a expirat!', {
      body: `Tema pentru "${taskName}" a fost finalizată.`,
      icon: '/logo.svg',
      badge: '/logo.svg',
    });
  }
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
    const handleTimerEnd = () => {
        playCompletionSound();
        showCompletionNotification(task.subjectName);
        completeTaskWithTimer(task.id);
    }
    
    if (isRunning) {
      if (timeRemaining <= 0) {
        handleTimerEnd();
        return;
      }

      const interval = setInterval(() => {
        // We calculate remaining time from scratch each tick to avoid drift
        const elapsedSinceStart = Date.now() - (task.timerStartTime as number);
        const newRemaining = totalDuration - (timeAlreadySpent + elapsedSinceStart);

        if (newRemaining <= 0) {
          clearInterval(interval);
          handleTimerEnd();
        } else {
          setTimeRemaining(newRemaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, task.id, task.timerStartTime, totalDuration, timeAlreadySpent, completeTaskWithTimer, timeRemaining, task.subjectName]);
  
  const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100) : 0;

  const handleStopAndComplete = () => {
    playCompletionSound();
    showCompletionNotification(task.subjectName);
    completeTaskWithTimer(task.id);
  }

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
              onClick={handleStopAndComplete}
            >
                <StopCircle className="h-7 w-7" />
                <span className="sr-only">Oprește și finalizează</span>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
