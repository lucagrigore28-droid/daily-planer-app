
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { HomeworkTask, UserData, Subject, Schedule, Theme } from '@/lib/types';
import { addDays, getDay, startOfDay, startOfWeek, endOfWeek, isAfter, parseISO, isBefore, isWithinInterval, differenceInCalendarDays, isSameDay, subDays } from 'date-fns';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, getDoc, runTransaction, Timestamp, deleteField } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { signOut } from 'firebase/auth';
import { themes } from '@/lib/themes';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const initialUserData: UserData = {
  username: '',
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
  theme: 'classic',
  customThemeColors: ['#A099FF', '#73A7AD'],
  weekendTabStartDay: 5, // Default to Friday
  coins: 0,
  unlockedThemes: ['classic'],
};

type AppContextType = {
  userData: UserData | null;
  tasks: HomeworkTask[];
  updateUser: (data: Partial<UserData>, oldUsername?: string) => void;
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
  unlockTheme: (theme: Theme) => void;
  addCoins: (amount: number) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const userDocRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  const tasksCollectionRef = useMemo(() => (user ? collection(firestore, 'users', user.uid, 'tasks') : null), [user, firestore]);
  const { data: allTasks, isLoading: areTasksLoading } = useCollection<HomeworkTask>(tasksCollectionRef);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [areTasksSynced, setAreTasksSynced] = useState(false);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  
  // Use a ref to track sync status and prevent re-runs
  const syncInProgress = useRef(false);
  const initialSyncCompleted = useRef(false);

  const isDataLoaded = !isUserDataLoading && !isUserLoading;

  const displayableTasks = useMemo(() => {
    if (!allTasks || !userData || !userData.schedule) return [];

    const unlockedTaskIds = new Set<string>();

    for (const subject of userData.subjects) {
      const subjectTasks = allTasks
        .filter(task => task.subjectId === subject.id)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (subjectTasks.length === 0) continue;

      // Find the first incomplete task. This is always a candidate for being unlocked.
      const firstIncompleteTask = subjectTasks.find(task => !task.isCompleted);

      if (firstIncompleteTask) {
         // The very first task of a subject series is always unlocked, regardless of date.
         unlockedTaskIds.add(firstIncompleteTask.id);
      }
      
      // For subsequent tasks, they are unlocked one by one as the previous one is completed,
      // but only after the scheduled class day has passed.
      for (let i = 0; i < subjectTasks.length - 1; i++) {
        const currentTask = subjectTasks[i];
        const nextTask = subjectTasks[i + 1];

        // If the current task is completed, the next one is a candidate for unlocking.
        if (currentTask.isCompleted) {
          const scheduledDays = userData.schedule[currentTask.subjectId] || [];
          if (scheduledDays.length > 0) {
            const dueDateOfNext = startOfDay(new Date(nextTask.dueDate));
            // Find the last class day *before* the next task is due. This is when it was 'assigned'.
            let lastClassDayBeforeNextDue: Date | null = null;

            // Iterate backwards from the day before the due date to find the most recent class day.
            for (let d = 1; d <= 7; d++) {
                const checkDate = subDays(dueDateOfNext, d);
                const dayOfWeek = getDay(checkDate) === 0 ? 7 : getDay(checkDate);
                if (scheduledDays.includes(dayOfWeek)) {
                    lastClassDayBeforeNextDue = checkDate;
                    break;
                }
            }
            
            // The task unlocks if today is on or after the 'assignment' day.
            if (lastClassDayBeforeNextDue && !isBefore(startOfDay(currentDate), lastClassDayBeforeNextDue)) {
              unlockedTaskIds.add(nextTask.id);
            }
          }
        }
      }
    }

    return allTasks.map(task => ({
      ...task,
      isLocked: !task.isManual && !task.isCompleted && !unlockedTaskIds.has(task.id),
    }));
  }, [allTasks, userData, currentDate]);


  useEffect(() => {
    if (allTasks) {
      const runningTask = allTasks.find(t => !!t.timerStartTime);
      setActiveTimerTaskId(runningTask ? runningTask.id : null);
    }
  }, [allTasks]);


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
    if (!user || !userData || !allTasks || syncInProgress.current) return;

    syncInProgress.current = true;
    try {
      const today = startOfDay(new Date());
      const batch = writeBatch(firestore);

      const automaticTasks = allTasks.filter(t => !t.isManual);
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
  }, [firestore, user, userData, allTasks]);

  useEffect(() => {
    if (isDataLoaded && userData?.setupComplete && allTasks !== null) {
      doSync();
    } else if (isDataLoaded && (!userData?.setupComplete || allTasks === null)) {
      setAreTasksSynced(true);
    }
  }, [isDataLoaded, userData?.setupComplete, userData?.schedule, userData?.subjects, allTasks, doSync]);
  
  const createUserDocument = useCallback(async (user: any, name: string) => {
    if (!user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    await setDoc(userDocRef, {
      ...initialUserData,
      name,
    });
  }, [firestore]);
  
  const updateUser = useCallback((data: Partial<UserData>) => {
    if (!userDocRef) return;
    
    const updates = { ...data };

    if (updates.theme && updates.theme !== 'custom') {
        updates.customThemeColors = deleteField() as any;
    }

    setDoc(userDocRef, updates, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
  }, [userDocRef]);

  const updateSubjects = useCallback((subjects: Subject[]) => {
      updateUser({ subjects });
  }, [updateUser]);

  const addTask = useCallback((task: Omit<HomeworkTask, 'id'>) => {
      if (tasksCollectionRef) {
        addDoc(tasksCollectionRef, task).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: tasksCollectionRef.path,
                operation: 'create',
                requestResourceData: task,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }
  }, [tasksCollectionRef]);

  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    if (!user) return;
    const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);

    if (updates.isCompleted === true) {
      const taskData = allTasks?.find(t => t.id === taskId);
      
      // Check to prevent re-awarding coins on re-renders or double-clicks
      if (taskData && !taskData.isCompleted && !taskData.coinsAwarded && userData) {
        const dueDate = startOfDay(new Date(taskData.dueDate));
        const completionDate = startOfDay(new Date());
        const daysEarly = differenceInCalendarDays(dueDate, completionDate);
        
        let coinsEarned = 0;
        if (daysEarly > 2) coinsEarned = 10;
        else if (daysEarly === 2) coinsEarned = 7;
        else if (daysEarly === 1) coinsEarned = 5;

        if (coinsEarned > 0) {
          const userDocRef = doc(firestore, 'users', user.uid);
          const currentCoins = userData.coins || 0;
          // Non-blocking update for user coins
          setDoc(userDocRef, { coins: currentCoins + coinsEarned }, { merge: true }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { coins: currentCoins + coinsEarned },
            });
            errorEmitter.emit('permission-error', permissionError);
          });
        }
      }

      // Optimistically update the task itself, marking coins as awarded
      const taskUpdates = { ...updates, coinsAwarded: true };
      setDoc(taskDocRef, taskUpdates, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: taskDocRef.path,
            operation: 'update',
            requestResourceData: taskUpdates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    } else {
      // Handle other types of updates (e.g., changing description, plannedDate)
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
      setDoc(taskDocRef, finalUpdates, { merge: true }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: taskDocRef.path,
          operation: 'update',
          requestResourceData: finalUpdates,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    }
  }, [firestore, user, allTasks, userData]);


  const deleteTask = useCallback((taskId: string) => {
    if (user) {
        const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        deleteDoc(taskDocRef).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: taskDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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
    if (!displayableTasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = displayableTasks.filter(task => !task.isCompleted && !task.isLocked);
    
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
  }, [currentDate, displayableTasks, userData]);

  const getWeekendTasks = useCallback(() => {
    if (!displayableTasks || !userData || !userData.schedule) return [];
  
    return displayableTasks.filter(task => {
        // Do not show locked tasks in the weekend planner
        if (task.isLocked) {
            return false;
        }
        
        if (!task.isManual) {
            const today = startOfDay(currentDate);
            const currentDayOfWeek = getDay(today) === 0 ? 7 : getDay(today);
            const startOfNextWeek = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
            const endOfNextWeek = endOfWeek(startOfNextWeek, { weekStartsOn: 1 });
            
            const isDueNextWeek = isWithinInterval(startOfDay(parseISO(task.dueDate)), { start: startOfNextWeek, end: endOfNextWeek });
            if (!isDueNextWeek) return false;

            const scheduledDays = userData.schedule[task.subjectId] || [];
            if (scheduledDays.length === 0) return false;

            const lastDayOfClassThisWeek = Math.max(...scheduledDays.filter(d => d <= 5), 0);
            return currentDayOfWeek >= lastDayOfClassThisWeek;
        }
        return false;
    });
  }, [displayableTasks, userData, currentDate]);

  const startTimer = useCallback(async (taskId: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    }
    updateTask(taskId, { timerStartTime: Date.now() });
  }, [updateTask]);

  const pauseTimer = useCallback((taskId: string) => {
    const task = allTasks?.find(t => t.id === taskId);
    if (task && task.timerStartTime) {
      const elapsed = Date.now() - task.timerStartTime;
      const newTimeSpent = (task.timeSpent || 0) + elapsed;
      updateTask(taskId, { 
        timeSpent: newTimeSpent,
        timerStartTime: null 
      });
    }
  }, [allTasks, updateTask]);
  
  const completeTaskWithTimer = useCallback((taskId: string) => {
    const task = allTasks?.find(t => t.id === taskId);
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
  }, [allTasks, updateTask]);

  const stopAndCompleteTimer = useCallback((taskId: string) => {
    completeTaskWithTimer(taskId);
  }, [completeTaskWithTimer]);

  const unlockTheme = useCallback((theme: Theme) => {
    if (!user || !userData) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    const currentCoins = userData.coins || 0;
    const currentUnlocked = userData.unlockedThemes || [];

    if (currentCoins >= theme.cost && !currentUnlocked.includes(theme.name)) {
        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }

            const data = userDoc.data() as UserData;
            const newCoins = (data.coins || 0) - theme.cost;
            const newUnlockedThemes = [...(data.unlockedThemes || []), theme.name];
            
            transaction.update(userDocRef, {
                coins: newCoins,
                unlockedThemes: newUnlockedThemes,
            });
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: {
                    coins: (userData.coins || 0) - theme.cost,
                    unlockedThemes: [...(userData.unlockedThemes || []), theme.name],
                }
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  }, [user, userData, firestore]);
  
  const addCoins = useCallback((amount: number) => {
    if (!userData) return;
    const currentCoins = userData.coins || 0;
    updateUser({ coins: currentCoins + amount });
  }, [userData, updateUser]);

  const memoizedUserData = useMemo(() => {
    if (isUserDataLoading || userData === undefined) return null;
    if (userData === null) return initialUserData;
    return { ...initialUserData, ...userData };
  }, [userData, isUserDataLoading]);
  
  const value: AppContextType = {
    userData: memoizedUserData,
    tasks: displayableTasks,
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
    unlockTheme,
    addCoins,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
