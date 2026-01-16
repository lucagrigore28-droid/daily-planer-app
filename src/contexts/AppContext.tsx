
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { HomeworkTask, UserData, Subject, Schedule } from '@/lib/types';
import { addDays, getDay, startOfDay, startOfWeek, endOfWeek, isAfter, parseISO } from 'date-fns';
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
  getNextSchoolDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
  user: any;
  isUserLoading: boolean;
  generateAndSyncTasks: (schedule: UserData['schedule'], subjects: UserData['subjects']) => Promise<void>;
  createUserDocument: (user: any, name: string) => Promise<void>;
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
  const isSyncing = useRef(false);

  const isDataLoaded = !isUserDataLoading && !isUserLoading;

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

  const generateAndSyncTasks = useCallback(async (schedule: Schedule, subjects: Subject[]) => {
    if (!tasksCollectionRef || !tasks || !user) return;
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
        const today = startOfDay(new Date());
        const batch = writeBatch(firestore);

        const automaticTasks = tasks.filter(t => !t.isManual);
        const existingTasks = new Map<string, string>(); // Map of "subjectId_dateString" to "taskId"
        
        // Identify tasks to delete or that already exist
        automaticTasks.forEach(task => {
            const taskDate = startOfDay(parseISO(task.dueDate));
            if (isAfter(today, taskDate) && !task.isCompleted) {
                 batch.delete(doc(tasksCollectionRef, task.id));
                 return;
            }

            const dayIndex = getDay(taskDate) === 0 ? 7 : getDay(taskDate);
            const subjectStillExists = subjects.some(s => s.id === task.subjectId);
            const isScheduled = schedule[task.subjectId]?.includes(dayIndex);
            const dateStr = task.dueDate.split('T')[0];

            if (!subjectStillExists || !isScheduled) {
                batch.delete(doc(tasksCollectionRef, task.id));
            } else {
                existingTasks.set(`${task.subjectId}_${dateStr}`, task.id);
            }
        });

        // Create new tasks for the next 14 days
        for (let i = 0; i < 14; i++) {
            const dateToCheck = addDays(today, i);
            const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);
            const dateStr = dateToCheck.toISOString().split('T')[0];

            if (dayIndex >= 1 && dayIndex <= 5) {
                for (const subject of subjects) {
                    if (schedule[subject.id]?.includes(dayIndex)) {
                        const taskKey = `${subject.id}_${dateStr}`;
                        if (!existingTasks.has(taskKey)) {
                            const newTaskRef = doc(tasksCollectionRef);
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
        isSyncing.current = false;
        setAreTasksSynced(true); // Signal that sync is complete
    }
  }, [firestore, user, tasksCollectionRef, tasks]);

  useEffect(() => {
    // This effect runs once when data is ready to perform the initial sync.
    if (isDataLoaded && userData?.setupComplete && tasks !== null && !areTasksSynced) {
      generateAndSyncTasks(userData.schedule, userData.subjects);
    } else if (isDataLoaded && (!userData?.setupComplete || tasks === null)) {
      // If setup is not complete, or tasks haven't loaded, we can consider it "synced" for now
      // to unblock the UI.
      setAreTasksSynced(true);
    }
  }, [isDataLoaded, userData, tasks, areTasksSynced, generateAndSyncTasks]);


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
    
    // Create a temporary object to avoid mutating `data`
    const updates = { ...data };

    // When updating theme to non-custom, clear custom colors to avoid conflicts
    if (updates.theme && updates.theme !== 'custom') {
        updates.customThemeColors = deleteField() as any;
    }

    await setDoc(userDocRef, updates, { merge: true });
    
    // If setup is being completed, trigger task sync immediately.
    if (updates.setupComplete === true && userData) {
      const fullSchedule = updates.schedule || userData.schedule;
      const fullSubjects = updates.subjects || userData.subjects;
      await generateAndSyncTasks(fullSchedule, fullSubjects);
    }
  }, [userDocRef, userData, generateAndSyncTasks]);

  const updateSubjects = useCallback(async (subjects: Subject[]) => {
    if (userDocRef) {
        await updateUser({ subjects });
        if(userData) {
          await generateAndSyncTasks(userData.schedule, subjects);
        }
    }
  }, [userDocRef, updateUser, userData, generateAndSyncTasks]);

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
    await setDoc(userDocRef, initialUserData);
    
    window.location.reload();
  }, [firestore, user, userDocRef, userData]);
  
  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const getNextSchoolDayWithTasks = useCallback(() => {
    if (!tasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = tasks.filter(task => !task.isCompleted);
    const futureTasks = incompleteTasks.filter(task => !isAfter(today, startOfDay(new Date(task.dueDate))));

    if (futureTasks.length > 0) {
      futureTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return startOfDay(new Date(futureTasks[0].dueDate));
    }
  
    return null; // Return null if no tasks are found
  }, [currentDate, tasks, userData]);

  const getWeekendTasks = useCallback(() => {
    if (!tasks) return [];
    const today = startOfDay(currentDate);
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

    const upcomingTasks = tasks.filter(task => {
        const taskDate = startOfDay(new Date(task.dueDate));
        return taskDate >= nextWeekStart && taskDate <= nextWeekEnd;
    });

    const firstOccurrenceMap = new Map<string, HomeworkTask>();
    // Sort by due date to get the earliest task first
    upcomingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    for (const task of upcomingTasks) {
        if (!firstOccurrenceMap.has(task.subjectId)) {
            firstOccurrenceMap.set(task.subjectId, task);
        }
    }
    return Array.from(firstOccurrenceMap.values());
  }, [tasks, currentDate]);

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
    getNextSchoolDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
    generateAndSyncTasks,
    createUserDocument,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
