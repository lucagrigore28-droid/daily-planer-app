'use client';

import React, { useState, useEffect, useContext } from 'react';
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

export default function TaskTimer({ task }: TaskTimerProps) {
  const context = useContext(AppContext);
  const { tasks, startTimer, pauseTimer, updateTask } = context!;
  
  const [isIos, setIsIos] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    // Detect if the user is on an iOS device. This runs only on the client.
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  }, []);

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
    // This function handles the end of the timer.
    const handleTimerEnd = () => {
        playCompletionSound();
        showCompletionNotification(task.subjectName);
        // Pause timer to correctly save progress before showing dialog
        pauseTimer(task.id);
        setIsTimeUp(true);
    }
    
    if (!isRunning) {
      return;
    }
    
    // On the initial run of this effect, we check if time is already up.
    // This handles cases where the app was closed and reopened after the timer should have ended.
    const initialRemaining = getInitialTimeRemaining();
    if (initialRemaining <= 0) {
      handleTimerEnd();
      return; // Stop here, the timer is already done.
    }

    const interval = setInterval(() => {
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
  }, [isRunning, task.id, task.timerStartTime, totalDuration, timeAlreadySpent, pauseTimer, task.subjectName]);
  
  const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100) : 0;

  const handleStopAndComplete = () => {
    playCompletionSound();
    showCompletionNotification(task.subjectName);
    // The timer might be running or paused here, so we need to handle both.
    let finalTimeSpent = task.timeSpent || 0;
    if (task.timerStartTime) {
        const elapsed = Date.now() - task.timerStartTime;
        finalTimeSpent += elapsed;
    }
    updateTask(task.id, { isCompleted: true, timeSpent: finalTimeSpent, timerStartTime: null });
  }

  const handleConfirmCompletion = () => {
    // The timer has been paused by handleTimerEnd, so timeSpent is already correct.
    updateTask(task.id, { isCompleted: true });
    setIsTimeUp(false);
  };

  const handleAddTime = (minutes: number) => {
    // Find the latest version of the task from the context to get the most up-to-date data
    const currentTask = tasks.find(t => t.id === task.id) || task;
    const newEstimatedTime = (currentTask.estimatedTime || 0) + minutes;
    
    // The timer was paused by `handleTimerEnd`, so `timeSpent` is already updated.
    // We just need to update the total estimated time and then restart the timer.
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
