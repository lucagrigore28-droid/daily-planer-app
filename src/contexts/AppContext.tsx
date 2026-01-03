
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { HomeworkTask, UserData, UserNotifications } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek, format, isSaturday, isSunday } from 'date-fns';
import { themes } from '@/lib/themes';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { signOut, Auth } from 'firebase/auth';
import { useAuth } from '@/firebase';

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
  addTask: (task: Omit<HomeworkTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<HomeworkTask>) => void;
  deleteTask: (taskId: string) => void;
  resetData: () => Promise<void>;
  logout: () => Promise<void>;
  isDataLoaded: boolean;
  currentDate: Date;
  getRelevantSchoolDays: () => Date[];
  getNextSchoolDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
  user: any;
  isUserLoading: boolean;
};

export const AppContext = createContext<AppContextType | null>(null);

const sendNotification = (notificationTitle: string, notificationBody: string) => {
    new Notification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.svg' 
  });
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const tasksCollectionRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);
  const { data: tasks, isLoading: areTasksLoading } = useCollection<HomeworkTask>(tasksCollectionRef);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const isDataLoaded = !isUserDataLoading && !areTasksLoading && !isUserLoading;

  useEffect(() => {
    if (isDataLoaded && userData) {
      const themeName = userData.theme || 'purple';
      const themeClass = themes.find(t => t.name === themeName)?.className || 'theme-purple';
      const root = window.document.documentElement;
      
      themes.forEach(t => root.classList.remove(t.className));
      root.classList.add(themeClass);
    }
  }, [userData, isDataLoaded]);

  // TODO: Add back notifications logic
  // ...

  const updateUser = useCallback((data: Partial<UserData>) => {
    if (userDocRef) {
        const updateData: Partial<UserData> = { ...data };

        if (!userData) {
            const payloadForCreation = { ...initialUserData, ...updateData };
            setDocumentNonBlocking(userDocRef, payloadForCreation, { merge: true });
        } else {
            setDocumentNonBlocking(userDocRef, updateData, { merge: true });
        }
    }
  }, [userDocRef, userData]);


  const addTask = useCallback((task: Omit<HomeworkTask, 'id'>) => {
      if (!tasksCollectionRef) return;
      addDocumentNonBlocking(tasksCollectionRef, task);
  }, [tasksCollectionRef]);

  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    if (tasksCollectionRef) {
      const taskDocRef = doc(tasksCollectionRef, taskId);
      setDocumentNonBlocking(taskDocRef, updates, { merge: true });
    }
  }, [tasksCollectionRef]);


  const deleteTask = useCallback((taskId: string) => {
    if (tasksCollectionRef) {
      const taskDocRef = doc(tasksCollectionRef, taskId);
      deleteDocumentNonBlocking(taskDocRef);
    }
  }, [tasksCollectionRef]);

  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const resetData = useCallback(async () => {
    if (userDocRef) {
        await deleteDoc(userDocRef);
    }
    await logout();
  }, [userDocRef, logout]);


  // Effect to auto-generate scheduled tasks
  useEffect(() => {
      if (!isDataLoaded || !userData || !userData.setupComplete || userData.subjects.length === 0) {
          return;
      }
  
      const today = startOfDay(new Date());
  
      for (let i = -14; i < 21; i++) { // Check a wider range to be safe
          const dateToCheck = addDays(today, i);
          const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);
  
          if (dayIndex >= 1 && dayIndex <= 5) { // Only school days
              userData.subjects.forEach(subject => {
                  if (userData.schedule[subject.id]?.includes(dayIndex)) {
                      const sanitizedSubjectId = subject.id.replace(/[^a-zA-Z0-9]/g, '');
                      const dateString = format(dateToCheck, 'yyyy-MM-dd');
                      const taskId = `${sanitizedSubjectId}-${dateString}`;
                      const taskExists = tasks?.some(t => t.id === taskId);
                      
                      if (!taskExists && tasksCollectionRef) {
                           setDocumentNonBlocking(doc(tasksCollectionRef, taskId), {
                              subjectId: subject.id,
                              subjectName: subject.name,
                              description: '',
                              dueDate: dateToCheck.toISOString(),
                              isCompleted: false,
                              isManual: false,
                              estimatedTime: undefined
                          }, { merge: true });
                      }
                  }
              });
          }
      }
  }, [isDataLoaded, userData, tasks, tasksCollectionRef]);

  const isSchoolDay = useCallback((date: Date) => {
    if (!userData) return false;
    const dayIndex = getDay(date) === 0 ? 7 : getDay(date);
    if (dayIndex < 1 || dayIndex > 5) return false;
    const hasSubjects = Object.values(userData.schedule).some(days => days.includes(dayIndex));
    return hasSubjects;
  }, [userData]);
  

  const getRelevantSchoolDays = useCallback(() => {
    if (!userData) return [];
    const relevantDays: Date[] = [];
    const today = startOfDay(currentDate);

    relevantDays.push(today);

    let futureDay = addDays(today, 1);
    let daysAheadCount = 0;
    while (daysAheadCount < 14) {
      if (isSchoolDay(futureDay)) {
          relevantDays.push(futureDay);
      }
       futureDay = addDays(futureDay, 1);
       daysAheadCount++;
    }
    
    (tasks || []).forEach(task => {
        const taskDate = startOfDay(new Date(task.dueDate));
        if (taskDate < today) {
            relevantDays.push(taskDate);
        }
    });
    
    const uniqueDays = Array.from(new Set(relevantDays.map(d => d.getTime()))).map(time => new Date(time));
    uniqueDays.sort((a,b) => a.getTime() - b.getTime());

    return uniqueDays.slice(0, 7);

  }, [currentDate, isSchoolDay, tasks, userData]);

  const getNextSchoolDayWithTasks = useCallback(() => {
    if (!tasks || !userData) return null;
    const today = startOfDay(currentDate);
    
    const incompleteTasks = tasks.filter(task => !task.isCompleted);
    const futureTasks = incompleteTasks.filter(task => startOfDay(new Date(task.dueDate)) >= today);

    if (futureTasks.length > 0) {
      futureTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return startOfDay(new Date(futureTasks[0].dueDate));
    }
  
    // If no tasks are found, default to today
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
    const sortedTasks = upcomingTasks.sort((a, b) => (a.isManual === b.isManual) ? 0 : a.isManual ? -1 : 1);

    for (const task of sortedTasks) {
        if (!firstOccurrenceMap.has(task.subjectId)) {
            firstOccurrenceMap.set(task.subjectId, task);
        }
    }

    return Array.from(firstOccurrenceMap.values());
  }, [tasks, currentDate]);

  const memoizedUserData = useMemo(() => userData ? { ...initialUserData, ...userData } : null, [userData]);
  
  const value = {
    userData: memoizedUserData,
    tasks: tasks || [],
    updateUser,
    addTask,
    updateTask,
    deleteTask,
    resetData,
    logout,
    isDataLoaded,
    currentDate,
    getRelevantSchoolDays,
    getNextSchoolDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
