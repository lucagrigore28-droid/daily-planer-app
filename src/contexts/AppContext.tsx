
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { HomeworkTask, UserData, Subject, Schedule, Theme, PersonalEvent } from '@/lib/types';
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
  events: PersonalEvent[];
  updateUser: (data: Partial<UserData>) => void;
  updateSubjects: (subjects: Subject[]) => void;
  addTask: (task: Omit<HomeworkTask, 'id'>) => void;
  addEvent: (event: Omit<PersonalEvent, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<HomeworkTask>) => void;
  deleteTask: (taskId: string) => void;
  resetData: () => Promise<void>;
  logout: () => Promise<void>;
  isDataLoaded: boolean;
  areTasksSynced: boolean;
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
  lastCoinReward: { taskId: string; amount: number } | null;
  setLastCoinReward: (reward: { taskId: string; amount: number } | null) => void;
  lastCompletedTaskIdForProgress: string | null;
  setLastCompletedTaskIdForProgress: (taskId: string | null) => void;
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

  const eventsCollectionRef = useMemo(() => (user ? collection(firestore, 'users', user.uid, 'events') : null), [user, firestore]);
  const { data: allEvents, isLoading: areEventsLoading } = useCollection<PersonalEvent>(eventsCollectionRef);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [areTasksSynced, setAreTasksSynced] = useState(false);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [lastCoinReward, setLastCoinReward] = useState<{ taskId: string; amount: number } | null>(null);
  const [lastCompletedTaskIdForProgress, setLastCompletedTaskIdForProgress] = useState<string | null>(null);
  
  const syncInProgress = useRef(false);

  const isDataLoaded = !isUserDataLoading && !isUserLoading && !areTasksLoading && !areEventsLoading;

  const scheduleJson = useMemo(() => JSON.stringify(userData?.schedule || {}), [userData?.schedule]);
  const subjectsJson = useMemo(() => JSON.stringify(userData?.subjects || []), [userData?.subjects]);

  useEffect(() => {
    const performSync = async () => {
      if (!user || !userData || syncInProgress.current) return;

      syncInProgress.current = true;
      try {
        const tasksCollectionRef = collection(firestore, 'users', user.uid, 'tasks');
        const tasksSnapshot = await getDocs(tasksCollectionRef);
        const currentTasks: HomeworkTask[] = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeworkTask));
        
        const batch = writeBatch(firestore);
        const today = startOfDay(new Date());

        const automaticTasks = currentTasks.filter(t => !t.isManual);
        const existingTasks = new Map<string, string>(); 

        automaticTasks.forEach(task => {
            const taskDate = startOfDay(parseISO(task.dueDate));
            const dayIndex = getDay(taskDate) === 0 ? 7 : getDay(taskDate);
            const subjectStillExists = userData.subjects.some(s => s.id === task.subjectId);
            const isScheduled = userData.schedule[task.subjectId]?.includes(dayIndex);
            const dateStr = task.dueDate.split('T')[0];

            if ((isBefore(taskDate, today) && !task.isCompleted) || !subjectStillExists || !isScheduled) {
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
          setAreTasksSynced(true);
      }
    };
    
    if (isDataLoaded && userData?.setupComplete) {
      performSync();
    } else if (isDataLoaded && !userData?.setupComplete) {
      setAreTasksSynced(true);
    }
  }, [isDataLoaded, userData?.setupComplete, user, firestore, scheduleJson, subjectsJson]);


  const displayableTasks = useMemo(() => {
    if (!allTasks || !userData || !userData.schedule) return [];

    const unlockedTaskIds = new Set<string>();

    for (const subject of userData.subjects) {
      const subjectTasks = allTasks
        .filter(task => task.subjectId === subject.id)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (subjectTasks.length === 0) continue;

      unlockedTaskIds.add(subjectTasks[0].id);

      for (let i = 0; i < subjectTasks.length - 1; i++) {
        const currentTask = subjectTasks[i];
        const nextTask = subjectTasks[i + 1];

        if (currentTask.isCompleted) {
          const scheduledDays = userData.schedule[currentTask.subjectId] || [];
          if (scheduledDays.length > 0) {
            const dueDateOfNext = startOfDay(new Date(nextTask.dueDate));
            let lastClassDayBeforeNextDue: Date | null = null;
            
            for (let d = 1; d <= 7; d++) {
                const checkDate = subDays(dueDateOfNext, d);
                const dayOfWeek = getDay(checkDate) === 0 ? 7 : getDay(checkDate);
                if (scheduledDays.includes(dayOfWeek)) {
                    lastClassDayBeforeNextDue = checkDate;
                    break;
                }
            }
            
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
  
  const createUserDocument = useCallback(async (user: any, name: string) => {
    if (!user) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    setDoc(userDocRef, {
      ...initialUserData,
      name,
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: { ...initialUserData, name },
        });
        errorEmitter.emit('permission-error', permissionError);
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

  const addEvent = useCallback((event: Omit<PersonalEvent, 'id'>) => {
    if (eventsCollectionRef) {
        addDoc(eventsCollectionRef, event).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: eventsCollectionRef.path,
                operation: 'create',
                requestResourceData: event,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  }, [eventsCollectionRef]);

  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    if (!user) return;
    const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);

    if (updates.isCompleted === true) {
      setLastCompletedTaskIdForProgress(taskId);
      const taskData = allTasks?.find(t => t.id === taskId);
      
      if (taskData && !taskData.isCompleted && !taskData.coinsAwarded && userData) {
        const dueDate = startOfDay(new Date(taskData.dueDate));
        const completionDate = startOfDay(new Date());
        const daysEarly = differenceInCalendarDays(dueDate, completionDate);
        
        let coinsEarned = 0;
        if (daysEarly > 2) coinsEarned = 10;
        else if (daysEarly === 2) coinsEarned = 7;
        else if (daysEarly === 1) coinsEarned = 5;

        if (coinsEarned > 0) {
          setLastCoinReward({ taskId, amount: coinsEarned });
          const userDocRef = doc(firestore, 'users', user.uid);
          const currentCoins = userData.coins || 0;
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
      const finalUpdates: Partial<HomeworkTask> = { ...updates };
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
    const tasksCollectionRef = collection(firestore, 'users', user.uid, 'tasks');
    const eventsCollectionRef = collection(firestore, 'users', user.uid, 'events');
  
    try {
      const tasksSnapshot = await getDocs(tasksCollectionRef);
      const eventsSnapshot = await getDocs(eventsCollectionRef);
      const batch = writeBatch(firestore);
  
      tasksSnapshot.forEach(doc => batch.delete(doc.ref));
      eventsSnapshot.forEach(doc => batch.delete(doc.ref));
  
      await batch.commit();
  
      const resetUserData = { ...initialUserData, name: userData?.name || '' };
      await setDoc(userDocRef, resetUserData);
  
      window.location.reload();
  
    } catch (serverError: any) {
        let operation: 'write' | 'delete' = 'write';
        // A more specific error could be constructed if we knew which part of the batch failed.
        // For now, we'll assume a general write error.
        if (serverError.code === 'permission-denied') {
            const path = serverError.message.match(/on resource (.*)/)?.[1] || `users/${user.uid}`;
             if (path.includes('/tasks/') || path.includes('/events/')) {
                operation = 'delete';
            }
        }
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}`, // Or a more specific path if available
            operation: operation,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error('Failed to reset data:', serverError);
    }
  }, [firestore, user, userDocRef, userData?.name]);
  
  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const getNextDayWithTasks = useCallback(() => {
    if (!displayableTasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = displayableTasks.filter(task => !task.isCompleted && !task.isLocked);
    
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

  const startTimer = useCallback(async (taskId: string) => {
    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      pauseTimer(activeTimerTaskId);
    }
    updateTask(taskId, { timerStartTime: Date.now() });
  }, [activeTimerTaskId, updateTask, pauseTimer]);

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
  
  const value = useMemo(() => ({
    userData: memoizedUserData,
    tasks: displayableTasks,
    events: allEvents || [],
    updateUser,
    updateSubjects,
    addTask,
    addEvent,
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
    lastCoinReward,
    setLastCoinReward,
    lastCompletedTaskIdForProgress,
    setLastCompletedTaskIdForProgress,
  }), [
    memoizedUserData,
    displayableTasks,
    allEvents,
    updateUser,
    updateSubjects,
    addTask,
    addEvent,
    updateTask,
    deleteTask,
    resetData,
    logout,
    isDataLoaded,
    areTasksSynced,
    currentDate,
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
    lastCoinReward,
    lastCompletedTaskIdForProgress,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
