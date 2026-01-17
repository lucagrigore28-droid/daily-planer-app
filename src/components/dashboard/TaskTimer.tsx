
'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, StopCircle } from 'lucide-react';

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
    new Notification('Temă finalizată!', {
      body: `Ai finalizat de lucrat la "${taskName}".`,
      icon: '/logo.svg',
      badge: '/logo.svg',
    });
  }
};

type TaskTimerProps = {
  task: HomeworkTask;
};


export default function TaskTimer({ task }: TaskTimerProps) {
  const { startTimer, pauseTimer, stopAndCompleteTimer } = useContext(AppContext)!;
  
  const calculateTimeElapsed = () => {
    const timeAlreadySpent = task.timeSpent || 0;
    if (!task.timerStartTime) { // Timer is paused or stopped
      return timeAlreadySpent;
    }
    // Timer is running
    const elapsedSinceStart = Date.now() - task.timerStartTime;
    return timeAlreadySpent + elapsedSinceStart;
  };

  const [timeElapsed, setTimeElapsed] = useState(calculateTimeElapsed());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    // This effect ensures the displayed time is correct whenever the task data from Firestore changes.
    setTimeElapsed(calculateTimeElapsed());
  }, [task]);

  useEffect(() => {
    const isRunning = !!task.timerStartTime;

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    if (!isRunning) {
      stopInterval();
      return;
    }

    const tick = () => {
      setTimeElapsed(calculateTimeElapsed());
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => stopInterval();
  }, [task.timerStartTime]);


  const totalDuration = (task.estimatedTime || 0) * 60 * 1000;
  const progress = totalDuration > 0 ? Math.min(100, (timeElapsed / totalDuration) * 100) : 0;
  const isRunning = !!task.timerStartTime;

  const handleStopAndComplete = () => {
    playCompletionSound();
    showCompletionNotification(task.subjectName);
    stopAndCompleteTimer(task.id);
  }

  return (
    <Card className="bg-card/90 border-primary border-2 shadow-lg shadow-primary/20">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">{task.subjectName}</p>
        </div>

        <div 
          className="relative flex items-center justify-center w-48 h-48 rounded-full"
          style={{ background: totalDuration > 0 ? `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)` : 'hsl(var(--muted))' }}
        >
            <div className="absolute w-[90%] h-[90%] bg-card rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold font-mono tabular-nums">
                    {formatTime(timeElapsed)}
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
