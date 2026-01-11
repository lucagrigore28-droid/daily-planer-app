
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { HomeworkTask, UserData, Subject } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { useUser, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, arrayUnion } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const initialUserData: UserData = {
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
  notifications: {
    enabled: false,
    dailyTime: '19:00',
  },
  theme: 'purple',
  fcmTokens: [],
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
  addFcmToken: (token: string) => void;
  isDataLoaded: boolean;
  currentDate: Date;
  getNextSchoolDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
  user: any;
  isUserLoading: boolean;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);
  
  const tasksCollectionRef = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'tasks') : null), [user, firestore]);
  const { data: tasks, isLoading: areTasksLoading } = useCollection<HomeworkTask>(tasksCollectionRef);

  const [currentDate] = useState(new Date());
  
  const isDataLoaded = !isUserDataLoading && !areTasksLoading && !isUserLoading;

  useEffect(() => {
    const themeToApply = (isDataLoaded && userData?.theme) ? userData.theme : initialUserData.theme;
    if (themeToApply) {
        const root = window.document.documentElement;
        
        root.classList.remove(...Array.from(root.classList).filter(c => c.startsWith('theme-')));
        root.classList.add(`theme-${themeToApply}`);
    }
  }, [userData?.theme, isDataLoaded]);

  const updateUser = useCallback((data: Partial<UserData>) => {
    if (userDocRef) {
      setDocumentNonBlocking(userDocRef, data, { merge: true });
    }
  }, [userDocRef]);

   const updateSubjects = useCallback((subjects: Subject[]) => {
    if (userDocRef) {
        setDocumentNonBlocking(userDocRef, { subjects }, { merge: true });
    }
   }, [userDocRef]);

  const addTask = useCallback((task: Omit<HomeworkTask, 'id'>) => {
      if (tasksCollectionRef) {
        addDocumentNonBlocking(tasksCollectionRef, task);
      }
  }, [tasksCollectionRef]);

  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    if (user) {
      const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
      setDocumentNonBlocking(taskDocRef, updates, { merge: true });
    }
  }, [firestore, user]);


  const deleteTask = useCallback((taskId: string) => {
    if (user) {
        const taskDocRef = doc(firestore, 'users', user.uid, 'tasks', taskId);
        deleteDocumentNonBlocking(taskDocRef);
    }
  }, [firestore, user]);

  const deleteAllTasks = useCallback(async () => {
    if (!tasksCollectionRef) return;

    const q = query(tasksCollectionRef);
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

  }, [firestore, tasksCollectionRef]);

  const addFcmToken = useCallback(async (token: string) => {
    if (!userDocRef || !userData) return;
    if (userData.fcmTokens && userData.fcmTokens.includes(token)) return;

    updateUser({ fcmTokens: arrayUnion(token) });
  }, [userDocRef, userData, updateUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const resetData = useCallback(async () => {
    if (!user || !userDocRef) return;

    // This will delete all tasks for the user.
    await deleteAllTasks();

    if (user.isAnonymous) {
        // For anonymous users, delete their document and the user account itself.
        // This will trigger onAuthStateChanged, leading to a redirect to /login.
        await deleteDoc(userDocRef);
        await user.delete();
    } else {
        // For authenticated users, reset their data to initial state but keep their name/theme.
        // This will effectively re-trigger the setup wizard.
        await setDoc(userDocRef, {
            ...initialUserData,
            name: userData?.name || '', 
            theme: userData?.theme || initialUserData.theme,
        }, { merge: false });
    }
  }, [user, userDocRef, userData, deleteAllTasks, auth, router]);
  
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
  
  const value = {
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
    addFcmToken,
    isDataLoaded,
    currentDate,
    getNextSchoolDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
