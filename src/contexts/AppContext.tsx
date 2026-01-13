
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { HomeworkTask, UserData, Subject } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, getDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
  lastTaskGeneration: null,
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
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const taskGenRef = useRef(false); // Ref to prevent multiple runs

  const userDocRef = useMemo(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);
  
  const tasksCollectionRef = useMemo(() => (user ? collection(firestore, 'users', user.uid, 'tasks') : null), [user, firestore]);
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

  const updateUser = useCallback(async (data: Partial<UserData>) => {
    if (userDocRef) {
      await setDoc(userDocRef, data, { merge: true });
    }
  }, [userDocRef]);

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
    router.push('/login');
  }, [auth, router]);

  const resetData = useCallback(async () => {
    if (!user || !userDocRef) return;

    if (user.isAnonymous) {
      await deleteAllTasks();
      await deleteDoc(userDocRef); // Delete the guest user document
      await user.delete(); // Delete the anonymous user account
      router.push('/login');
      return;
    }
    
    // For authenticated users, fetch current data one last time to preserve name/theme
    const currentUserDataSnap = await getDoc(userDocRef);
    const currentUserData = currentUserDataSnap.data() as UserData | undefined;

    await deleteAllTasks();
    await setDoc(userDocRef, {
      ...initialUserData,
      name: currentUserData?.name || '', // Keep the name
      theme: currentUserData?.theme || initialUserData.theme, // Keep the theme
    }, { merge: false });
    
  }, [user, userDocRef, deleteAllTasks, router]);

  useEffect(() => {
    // Ensure this runs only once after all data is loaded and conditions are met
    if (!isDataLoaded || !userData?.setupComplete || (userData.subjects?.length ?? 0) === 0 || !tasksCollectionRef || taskGenRef.current) {
      return;
    }

    const checkAndCreateTasks = async () => {
      taskGenRef.current = true; // Mark as running
      const today = startOfDay(new Date());
      const lastGenDate = userData.lastTaskGeneration ? startOfDay(new Date(userData.lastTaskGeneration)) : null;

      // If tasks were already generated for today or a future date, don't run again.
      if (lastGenDate && !isBefore(lastGenDate, today)) {
        return;
      }

      const batch = writeBatch(firestore);
      let writes = 0;
      
      const allTasksSnap = await getDocs(query(tasksCollectionRef));
      const existingTasks = new Set(
          allTasksSnap.docs.map(d => {
              const task = d.data();
              if (task.isManual) return null;
              return `${task.subjectId}_${format(new Date(task.dueDate), 'yyyy-MM-dd')}`;
          }).filter(Boolean)
      );

      for (let i = 0; i < 14; i++) {
        const dateToCheck = addDays(today, i);
        const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);

        if (dayIndex >= 1 && dayIndex <= 5) {
          for (const subject of userData.subjects) {
            if (userData.schedule?.[subject.id]?.includes(dayIndex)) {
              const taskKey = `${subject.id}_${format(dateToCheck, 'yyyy-MM-dd')}`;
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
                writes++;
              }
            }
          }
        }
      }

      if (writes > 0) {
        try {
          await batch.commit();
        } catch (err) {
          console.error("Silently failed to create tasks in batch", err);
        }
      }
      
      // Update last generation timestamp
      if (userDocRef) {
        await setDoc(userDocRef, { lastTaskGeneration: new Date().toISOString() }, { merge: true });
      }
    };

    checkAndCreateTasks();
  }, [isDataLoaded, userData, tasks, tasksCollectionRef, firestore, userDocRef]);
  
  const getNextSchoolDayWithTasks = useCallback(() => {
    if (!tasks || !userData) return null;
    
    const today = startOfDay(currentDate);
    const incompleteTasks = tasks.filter(task => !task.isCompleted);
    
    if (incompleteTasks.length === 0) {
      return null;
    }

    // Find the earliest due date among incomplete tasks
    const sortedTasks = incompleteTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const earliestDueDate = startOfDay(new Date(sortedTasks[0].dueDate));

    // If there are past due tasks, show the earliest one. Otherwise, show the next future one.
    const tasksDueTodayOrLater = sortedTasks.filter(task => startOfDay(new Date(task.dueDate)) >= today);
    if (tasksDueTodayOrLater.length > 0) {
        return startOfDay(new Date(tasksDueTodayOrLater[0].dueDate));
    }
    
    return earliestDueDate;
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
    // Sort tasks by due date to ensure the "first" occurrence is correct chronologically
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
    isDataLoaded,
    currentDate,
    getNextSchoolDayWithTasks,
    getWeekendTasks,
    user,
    isUserLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
