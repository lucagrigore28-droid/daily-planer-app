'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import type { HomeworkTask } from '@/lib/types';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, StopCircle, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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

type TaskTimerProps = {
  task: HomeworkTask;
};


export default function TaskTimer({ task }: TaskTimerProps) {
  const { tasks, startTimer, pauseTimer, updateTask } = useContext(AppContext)!;
  
  const [isIos, setIsIos] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const calculateTimeRemaining = () => {
    const totalDuration = (task.estimatedTime || 0) * 60 * 1000;
    const timeAlreadySpent = task.timeSpent || 0;

    if (!task.timerStartTime) { // Timer is paused or stopped
      return totalDuration - timeAlreadySpent;
    }
    // Timer is running
    const elapsedSinceStart = Date.now() - task.timerStartTime;
    return totalDuration - (timeAlreadySpent + elapsedSinceStart);
  };

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    // This effect ensures the displayed time is correct whenever the task data from Firestore changes.
    setTimeRemaining(calculateTimeRemaining());
  }, [task]);

  useEffect(() => {
    const isRunning = !!task.timerStartTime;

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    // Stop any existing timers if the timer shouldn't be running or if the 'Time Up' dialog is active.
    if (!isRunning || isTimeUp) {
      stopInterval();
      return;
    }
    
    // --- This is the main timer logic ---

    const tick = () => {
      const remaining = calculateTimeRemaining();
      
      if (remaining <= 0) {
        // Timer has finished.
        stopInterval();
        
        // Use a functional update for `setIsTimeUp` to prevent race conditions
        // where this might be called multiple times before a re-render.
        setIsTimeUp(wasTimeUp => {
            if (!wasTimeUp) { // Only run the 'end' logic if it hasn't run before
                playCompletionSound();
                showCompletionNotification(task.subjectName);
                pauseTimer(task.id); // This updates timeSpent and removes timerStartTime
            }
            return true; // Set state to true
        });

      } else {
        // Timer is still running, update the displayed time.
        setTimeRemaining(remaining);
      }
    };

    // Immediately call tick() to check the current state when the effect starts.
    // This handles the case of starting a timer that should have already finished.
    tick();

    // Set up the interval to tick every second.
    intervalRef.current = setInterval(tick, 1000);

    // Cleanup function to clear the interval when the component unmounts or dependencies change.
    return () => stopInterval();

  }, [task, isTimeUp, pauseTimer]); // Effect depends on the task data and the isTimeUp flag.


  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  }, []);

  const totalDuration = (task.estimatedTime || 0) * 60 * 1000;
  const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100) : 0;
  const isRunning = !!task.timerStartTime;

  const handleStopAndComplete = () => {
    playCompletionSound();
    showCompletionNotification(task.subjectName);
    
    let finalTimeSpent = task.timeSpent || 0;
    if (task.timerStartTime) { // If timer was running, calculate final elapsed time
        const elapsed = Date.now() - task.timerStartTime;
        finalTimeSpent += elapsed;
    }
    updateTask(task.id, { isCompleted: true, timeSpent: finalTimeSpent, timerStartTime: null });
  }

  const handleConfirmCompletion = () => {
    // The timer has been paused by the effect, so timeSpent is already correct.
    updateTask(task.id, { isCompleted: true });
    setIsTimeUp(false);
  };

  const handleAddTime = (minutes: number) => {
    // Find the latest version of the task from the context to get the most up-to-date data
    const currentTaskData = tasks.find(t => t.id === task.id) || task;
    const newEstimatedTime = (currentTaskData.estimatedTime || 0) + minutes;
    
    // We update the task and then restart the timer.
    // The `pauseTimer` call in the effect has already synced the latest `timeSpent`.
    updateTask(task.id, { estimatedTime: newEstimatedTime }).then(() => {
        startTimer(task.id);
    });

    setIsTimeUp(false);
  };

  return (
    <>
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
          {isIos && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground text-center max-w-xs pt-2">
              <Info className="h-4 w-4 shrink-0" />
              <p>
                Pe iPhone, notificările pot întârzia dacă ecranul este blocat.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isTimeUp} onOpenChange={setIsTimeUp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Timpul a expirat!</AlertDialogTitle>
            <AlertDialogDescription>
              Ai terminat tema pentru "{task.subjectName}"? Poți finaliza acum sau poți adăuga mai mult timp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4">
             <div className="flex justify-start gap-2">
                <Button variant="outline" onClick={() => handleAddTime(5)}>+5 min</Button>
                <Button variant="outline" onClick={() => handleAddTime(10)}>+10 min</Button>
                <Button variant="outline" onClick={() => handleAddTime(15)}>+15 min</Button>
            </div>
            <AlertDialogAction onClick={handleConfirmCompletion}>Da, am terminat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
