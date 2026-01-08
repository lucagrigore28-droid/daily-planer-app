
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { HomeworkTask, UserData, Subject } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs, writeBatch, where, documentId, arrayUnion } from 'firebase/firestore';
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

function useTasksForUser() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const tasksQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'tasks'));
    }, [firestore, user]);

    const { data: tasks, isLoading: areTasksLoading } = useCollection<HomeworkTask>(tasksQuery);
    
    return { tasks: tasks || [], areTasksLoading };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

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

  const addFcmToken = useCallback(async (token: string) => {
    if (!userDocRef || !userData) return;
    if (userData.fcmTokens && userData.fcmTokens.includes(token)) return;

    await updateUser({ fcmTokens: arrayUnion(token) });
  }, [userDocRef, userData, updateUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  const resetData = useCallback(async () => {
    if (!user || !userDocRef) return;

    if (user.isAnonymous) {
      await deleteAllTasks();
      await deleteDoc(userDocRef); // Delete the guest user document
      await user.delete(); // This will trigger onAuthStateChanged, which should redirect to login
      return;
    }
    
    // For authenticated users
    await deleteAllTasks();
    await setDoc(userDocRef, {
        ...initialUserData,
        name: userData?.name || '', // Keep the name if it exists
        theme: userData?.theme || initialUserData.theme, // Keep the theme
    }, { merge: false });
    // The app will reactively show the setup wizard because setupComplete is now false
  }, [user, userDocRef, userData, deleteAllTasks]);

  useEffect(() => {
    if (!isDataLoaded || !userData || !userData.setupComplete || userData.subjects.length === 0 || !tasksCollectionRef) {
      return;
    }

    const checkAndCreateTasks = async () => {
      const today = startOfDay(new Date());
      const batch = writeBatch(firestore);
      let writes = 0;

      for (let i = -7; i < 14; i++) {
        const dateToCheck = addDays(today, i);
        const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);

        if (dayIndex >= 1 && dayIndex <= 5) {
          for (const subject of userData.subjects) {
            if (userData.schedule[subject.id]?.includes(dayIndex)) {
              
              const taskExists = tasks.some(t => 
                !t.isManual &&
                t.subjectId === subject.id && 
                startOfDay(new Date(t.dueDate)).getTime() === dateToCheck.getTime()
              );

              if (!taskExists) {
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
    };

    checkAndCreateTasks();
  }, [isDataLoaded, userData, tasks, tasksCollectionRef, firestore]);
  
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
