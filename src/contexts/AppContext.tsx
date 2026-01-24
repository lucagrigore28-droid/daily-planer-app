
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { HomeworkTask, UserData, Subject, Schedule } from '@/lib/types';
import { addDays, getDay, startOfDay, startOfWeek, endOfWeek, isAfter, parseISO, isBefore, isWithinInterval } from 'date-fns';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, getDoc, runTransaction, Timestamp, deleteField } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { signOut } from 'firebase/auth';
import { themes } from '@/lib/themes';

const initialUserData: UserData = {
  username: '',
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
  theme: 'classic',
  customThemeColors: ['#A099FF', '#73A7AD'],
  weekendTabStartDay: 5, // Default to Friday
};

type AppContextType = {
  userData: UserData | null;
  tasks: HomeworkTask[];
  updateUser: (data: Partial<UserData>, oldUsername?: string) => Promise<void>;
  updateSubjects: (subjects: Subject[]) => void;
  addTask: (task: Omit<HomeworkTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<HomeworkTask>) => void;
  deleteTask: (taskId: string) => void;
  resetData: () => Promise<void>;
  logout: () => Promise<void>;
  isDataLoaded: boolean;
  areTasksSynced: boolean; // New flag
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  getNextDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
  user: any;
  isUserLoading: boolean;
  createUserDocument: (user: any, name: string) => Promise<void>;
  activeTimerTaskId: string | null;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  stopAndCompleteTimer: (taskId: string) => void;
  completeTaskWithTimer: (taskId: string) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const userDocRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  const tasksCollectionRef = useMemo(() => (user ? collection(firestore, 'users', user.uid, 'tasks') : null), [user, firestore]);
  const { data: tasks, isLoading: areTasksLoading } = useCollection<HomeworkTask>(tasksCollectionRef);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [areTasksSynced, setAreTasksSynced] = useState(false);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  
  // Use a ref to track sync status and prevent re-runs
  const syncInProgress = useRef(false);
  const initialSyncCompleted = useRef(false);

  const isDataLoaded = !isUserDataLoading && !isUserLoading;

  useEffect(() => {
    if (tasks) {
      const runningTask = tasks.find(t => !!t.timerStartTime);
      setActiveTimerTaskId(runningTask ? runningTask.id : null);
    }
  }, [tasks]);


  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const themeName = userData?.theme || 'classic';
  
    // Clear all theme-related classes and styles first
    body.className = body.className.replace(/theme-\w+/g, '');
    body.classList.remove('theme-custom-active');
    body.style.removeProperty('--gradient-bg');
    root.style.removeProperty('--primary-from-custom');
    root.style.removeProperty('--accent-from-custom');

    if (themeName === 'custom' && userData?.customThemeColors?.length) {
      const colors = userData.customThemeColors;
      
      const hexToHsl = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
          r = parseInt(hex.substring(1, 3), 16);
          g = parseInt(hex.substring(3, 5), 16);
          b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      root.style.setProperty('--primary-from-custom', hexToHsl(colors[0]));
      root.style.setProperty('--accent-from-custom', hexToHsl(colors[colors.length - 1]));
      
      body.style.setProperty('--gradient-bg', `linear-gradient(to right, ${colors.join(', ')})`);
      body.classList.add('theme-custom-active');
      body.classList.add('theme-custom');
  
    } else {
      const theme = themes.find(t => t.name === themeName);
      if (theme) {
        body.classList.add(theme.className);
      }
    }

  }, [userData?.theme, userData?.customThemeColors]);

  const doSync = useCallback(async () => {
    if (!user || !userData || !tasks || syncInProgress.current) return;

    syncInProgress.current = true;
    try {
      const today = startOfDay(new Date());
      const batch = writeBatch(firestore);

      const automaticTasks = tasks.filter(t => !t.isManual);
      const existingTasks = new Map<string, string>(); // Map "subjectId_dateString" to "taskId"

      automaticTasks.forEach(task => {
        const taskDate = startOfDay(parseISO(task.dueDate));
        const dayIndex = getDay(taskDate) === 0 ? 7 : getDay(taskDate);
        const subjectStillExists = userData.subjects.some(s => s.id === task.subjectId);
        const isScheduled = userData.schedule[task.subjectId]?.includes(dayIndex);
        const dateStr = task.dueDate.split('T')[0];

        if (isBefore(taskDate, today) && !task.isCompleted || !subjectStillExists || !isScheduled) {
          batch.delete(doc(firestore, 'users', user.uid, 'tasks', task.id));
        } else {
          existingTasks.set(`${task.subjectId}_${dateStr}`, task.id);
        }
      });

      for (let i = 0; i < 14; i++) {
        const dateToCheck = addDays(today, i);
        const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);
        const dateStr = dateToCheck.toISOString().split('T')[0];

        if (dayIndex >= 1 && dayIndex <= 5) {
          for (const subject of userData.subjects) {
            if (userData.schedule[subject.id]?.includes(dayIndex)) {
              const taskKey = `${subject.id}_${dateStr}`;
              if (!existingTasks.has(taskKey)) {
                const newTaskRef = doc(collection(firestore, 'users', user.uid, 'tasks'));
                batch.set(newTaskRef, {
                  subjectId: subject.id,
                  subjectName: subject.name,
                  description: '',
                  dueDate: dateToCheck.toISOString(),
                  isCompleted: false,
                  isManual: false
                });
              }
            }
          }
        }
      }
      await batch.commit();
    } catch (error) {
      console.error("Error syncing tasks:", error);
    } finally {
      syncInProgress.current = false;
      if (!initialSyncCompleted.current) {
        initialSyncCompleted.current = true;
        setAreTasksSynced(true);
      }
    }
  }, [firestore, user, userData, tasks]);

  useEffect(() => {
    if (isDataLoaded && userData?.setupComplete && tasks !== null) {
      doSync();
    } else if (isDataLoaded && (!userData?.setupComplete || tasks === null)) {
      setAreTasksSynced(true);
    }
  }, [isDataLoaded, userData?.setupComplete, userData?.schedule, userData?.subjects, tasks, doSync]);
  
  const createUserDocument = useCallback(async (user: any, name: string) => {
    if (!user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    await setDoc(userDocRef, {
      ...initialUserData,
      name,
    });
  }, [firestore]);
  
  const updateUser = useCallback(async (data: Partial<UserData>) => {
    if (!userDocRef) return;
    
    const updates = { ...data };

    if (updates.theme && updates.theme !== 'custom') {
        updates.customThemeColors = deleteField() as any;
    }

    await setDoc(userDocRef, updates, { merge: true });
    
  }, [userDocRef]);

  const updateSubjects = useCallback(async (subjects: Subject[]) => {
      await updateUser({ subjects });
  }, [updateUser]);

  const addTask = useCallback(async (task: Omit<HomeworkTask, 'id'>) => {
      if (tasksCollectionRef) {
        await addDoc(tasksCollectionRef, task);
      }
  }, [tasksCollectionRef]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<HomeworkTask>) => {
    if (user) {
      const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
      const finalUpdates = { ...updates };

      if ('plannedDate' in finalUpdates && (finalUpdates.plannedDate === undefined || finalUpdates.plannedDate === null)) {
        finalUpdates.plannedDate = deleteField() as any;
      }
      if ('estimatedTime' in finalUpdates && (finalUpdates.estimatedTime === undefined || finalUpdates.estimatedTime <= 0)) {
        finalUpdates.estimatedTime = deleteField() as any;
      }
       if ('timerStartTime' in finalUpdates && (finalUpdates.timerStartTime === undefined || finalUpdates.timerStartTime === null)) {
        finalUpdates.timerStartTime = deleteField() as any;
      }
      
      await setDoc(taskDocRef, finalUpdates, { merge: true });
    }
  }, [firestore, user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (user) {
        const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        await deleteDoc(taskDocRef);
    }
  }, [firestore, user]);

  const resetData = useCallback(async () => {
    if (!user || !userDocRef) return;
    
    // Delete all tasks
    const tasksCollectionRef = collection(firestore, 'users', user.uid, 'tasks');
    const tasksSnapshot = await getDocs(tasksCollectionRef);
    const batch = writeBatch(firestore);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Reset user document
    await setDoc(userDocRef, { ...initialUserData, name: userData?.name || '' });
    
    window.location.reload();
  }, [firestore, user, userDocRef, userData]);
  
  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const getNextDayWithTasks = useCallback(() => {
    if (!tasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = tasks.filter(task => !task.isCompleted);
    
    // Get all future dates that have tasks
    const futureDates = incompleteTasks.reduce((acc, task) => {
        const dueDate = startOfDay(new Date(task.dueDate));
        if (!isBefore(dueDate, today)) {
            acc.add(dueDate.getTime());
        }
        if (task.plannedDate) {
            const plannedDate = startOfDay(new Date(task.plannedDate));
            if (!isBefore(plannedDate, today)) {
                acc.add(plannedDate.getTime());
            }
        }
        return acc;
    }, new Set<number>());

    if (futureDates.size > 0) {
        const sortedDates = Array.from(futureDates).sort();
        return new Date(sortedDates[0]);
    }
  
    return null;
  }, [currentDate, tasks, userData]);

  const getWeekendTasks = useCallback(() => {
    if (!tasks || !userData) return [];

    const today = startOfDay(currentDate);

    // This correctly defines "next week" as the upcoming Monday to Sunday, regardless of the current day.
    const startOfNextWeek = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const endOfNextWeek = endOfWeek(startOfNextWeek, { weekStartsOn: 1 });

    // 1. Get all uncompleted tasks that fall within next week's interval.
    const tasksInNextWeek = tasks.filter(task => {
      if (task.isCompleted) {
        return false;
      }
      const taskDueDate = startOfDay(new Date(task.dueDate));
      return isWithinInterval(taskDueDate, { start: startOfNextWeek, end: endOfNextWeek });
    });
    
    // 2. Group tasks by subject and find the earliest one for each.
    const earliestTasksBySubject = tasksInNextWeek.reduce((acc, task) => {
      // If we haven't seen this subject yet, or if the current task is earlier than the one we stored, update it.
      if (!acc[task.subjectId] || new Date(task.dueDate) < new Date(acc[task.subjectId].dueDate)) {
        acc[task.subjectId] = task;
      }
      return acc;
    }, {} as Record<string, HomeworkTask>);

    // 3. Return the filtered list of tasks.
    return Object.values(earliestTasksBySubject);

  }, [tasks, currentDate, userData]);

  const startTimer = useCallback(async (taskId: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
    updateTask(taskId, { timerStartTime: Date.now() });
  }, [updateTask]);

  const pauseTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.timerStartTime) {
      const elapsed = Date.now() - task.timerStartTime;
      const newTimeSpent = (task.timeSpent || 0) + elapsed;
      updateTask(taskId, { 
        timeSpent: newTimeSpent,
        timerStartTime: null 
      });
    }
  }, [tasks, updateTask]);
  
  const completeTaskWithTimer = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      let finalTimeSpent = task.timeSpent || 0;
      if (task.timerStartTime) {
          const elapsed = Date.now() - task.timerStartTime;
          finalTimeSpent += elapsed;
      }
      updateTask(taskId, { 
        timeSpent: finalTimeSpent,
        timerStartTime: null,
        isCompleted: true
      });
    }
  }, [tasks, updateTask]);

  const stopAndCompleteTimer = useCallback((taskId: string) => {
    completeTaskWithTimer(taskId);
  }, [completeTaskWithTimer]);

  const memoizedUserData = useMemo(() => {
    if (isUserDataLoading || userData === undefined) return null;
    if (userData === null) return initialUserData;
    return { ...initialUserData, ...userData };
  }, [userData, isUserDataLoading]);
  
  const value: AppContextType = {
    userData: memoizedUserData,
    tasks: tasks || [],
    updateUser,
    updateSubjects,
    addTask,
    updateTask,
    deleteTask,
    resetData,
    logout,
    isDataLoaded,
    areTasksSynced,
    currentDate,
    setCurrentDate,
    getNextDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
    createUserDocument,
    activeTimerTaskId,
    startTimer,
    pauseTimer,
    stopAndCompleteTimer,
    completeTaskWithTimer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
