
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { HomeworkTask, UserData, Subject } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, getDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { signOut } from 'firebase/auth';

const initialUserData: UserData = {
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
  notifications: {
    enabled: false,
    afterSchoolTime: '15:00',
    eveningTime: '20:00',
    weekendEnabled: true,
    saturdayMorningTime: '10:00',
    saturdayEveningTime: '20:00',
    sundayMorningTime: '11:00',
    sundayEveningTime: '20:00',
  },
  theme: 'purple',
};

type AppContextType = {
  userData: UserData | null;
  tasks: HomeworkTask[];
  updateUser: (data: Partial<UserData>) => void;
  updateSubjects: (subjects: Subject[]) => void;
  addTask: (task: Omit<HomeworkTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<HomeworkTask>) => void;
  deleteTask: (taskId: string) => void;
  deleteAllTasks: () => Promise<void>;
  resetData: () => Promise<void>;
  logout: () => Promise<void>;
  isDataLoaded: boolean;
  currentDate: Date;
  getNextSchoolDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
  user: any;
  isUserLoading: boolean;
  generateAndSyncTasks: (schedule: UserData['schedule'], subjects: UserData['subjects']) => Promise<void>;
  createUserDocument: (user: any) => Promise<void>;
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

  const [currentDate] = useState(new Date());
  
  const isDataLoaded = !isUserDataLoading && !areTasksLoading && !isUserLoading;

  useEffect(() => {
    const themeToApply = (isDataLoaded && userData?.theme) ? userData.theme : 'purple';
    if (themeToApply) {
        const root = window.document.documentElement;
        
        root.classList.remove(...Array.from(root.classList).filter(c => c.startsWith('theme-')));
        root.classList.add(`theme-${themeToApply}`);
    }
  }, [userData?.theme, isDataLoaded]);

  const updateUser = useCallback(async (data: Partial<UserData>) => {
    if (userDocRef) {
      await setDoc(userDocRef, data, { merge: true });
    }
  }, [userDocRef]);

  const createUserDocument = useCallback(async (user: any) => {
      if (!user) return;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
          const initialData = {
              ...initialUserData,
              name: user.displayName || 'Utilizator',
          };
          await setDoc(userDocRef, initialData);
      }
  }, [firestore]);


   const updateSubjects = useCallback(async (subjects: Subject[]) => {
    if (userDocRef) {
        await setDoc(userDocRef, { subjects }, { merge: true });
    }
   }, [userDocRef]);

  const addTask = useCallback(async (task: Omit<HomeworkTask, 'id'>) => {
      if (tasksCollectionRef) {
        await addDoc(tasksCollectionRef, task);
      }
  }, [tasksCollectionRef]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<HomeworkTask>) => {
    if (user) {
      const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
      await setDoc(taskDocRef, updates, { merge: true });
    }
  }, [firestore, user]);


  const deleteTask = useCallback(async (taskId: string) => {
    if (user) {
        const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        await deleteDoc(taskDocRef);
    }
  }, [firestore, user]);

  const deleteAllTasks = useCallback(async () => {
    if (!tasksCollectionRef) return;
    try {
        const q = query(tasksCollectionRef);
        const snapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error deleting all tasks:", error);
        throw error;
    }
  }, [firestore, tasksCollectionRef]);

  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const resetData = useCallback(async () => {
    if (userDocRef && userData) {
        await deleteAllTasks();
        await setDoc(userDocRef, initialUserData, { merge: false });
        window.location.reload();
    }
  }, [userDocRef, userData, deleteAllTasks]);
  
    const generateAndSyncTasks = useCallback(async (schedule: UserData['schedule'], subjects: UserData['subjects']) => {
        if (!tasksCollectionRef || !tasks) return;

        const batch = writeBatch(firestore);
        const today = startOfDay(new Date());

        const automaticTasks = tasks.filter(t => !t.isManual);
        const tasksToDelete: HomeworkTask[] = [];

        // Identify tasks to delete or that already exist
        const existingTasks = new Set<string>();
        for (const task of automaticTasks) {
            const taskDate = startOfDay(new Date(task.dueDate));
            const dayIndex = getDay(taskDate) === 0 ? 7 : getDay(taskDate);
            const subjectStillExists = subjects.some(s => s.id === task.subjectId);
            const isScheduled = schedule[task.subjectId]?.includes(dayIndex);

            if (!subjectStillExists || !isScheduled) {
                tasksToDelete.push(task);
            } else {
                 existingTasks.add(`${task.subjectId}_${task.dueDate}`);
            }
        }
        
        // Delete tasks that are no longer relevant
        tasksToDelete.forEach(task => {
            const taskRef = doc(tasksCollectionRef, task.id);
            batch.delete(taskRef);
        });

        // Create new tasks
        for (let i = -7; i < 14; i++) {
            const dateToCheck = addDays(today, i);
            const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);

            if (dayIndex >= 1 && dayIndex <= 5) {
                for (const subject of subjects) {
                    if (schedule[subject.id]?.includes(dayIndex)) {
                        const taskKey = `${subject.id}_${dateToCheck.toISOString()}`;
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

    }, [firestore, tasksCollectionRef, tasks]);

  const getNextSchoolDayWithTasks = useCallback(() => {
    if (!tasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = tasks.filter(task => !task.isCompleted);
    const futureTasks = incompleteTasks.filter(task => startOfDay(new Date(task.dueDate)) >= today);

    if (futureTasks.length > 0) {
      futureTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return startOfDay(new Date(futureTasks[0].dueDate));
    }
  
    return today;
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
    deleteAllTasks,
    resetData,
    logout,
    isDataLoaded,
    currentDate,
    getNextSchoolDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
    generateAndSyncTasks,
    createUserDocument,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
