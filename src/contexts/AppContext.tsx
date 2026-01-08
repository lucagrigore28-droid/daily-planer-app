
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { HomeworkTask, UserData, Subject } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek, format, isSaturday, isSunday } from 'date-fns';
import { useUser, useFirestore } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, query, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
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


function useTasksForSubjects(subjects: Subject[] | undefined) {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const [allTasks, setAllTasks] = useState<HomeworkTask[]>([]);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [overallLoading, setOverallLoading] = useState(true);

    useEffect(() => {
        if (!user || !subjects) {
            setOverallLoading(subjects === undefined);
            if (subjects?.length === 0) setAllTasks([]);
            return;
        }

        const initialLoadingStates = subjects.reduce((acc, subject) => {
            acc[subject.id] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setLoadingStates(initialLoadingStates);
        
        const unsubscribes = subjects.map(subject => {
            const q = query(collection(firestore, 'users', user.uid, 'subjects', subject.id, 'tasks'));
            return onSnapshot(q, (snapshot) => {
                const tasksForSubject = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HomeworkTask));
                
                setAllTasks(prevTasks => {
                    const otherTasks = prevTasks.filter(t => t.subjectId !== subject.id);
                    return [...otherTasks, ...tasksForSubject];
                });

                setLoadingStates(prev => ({ ...prev, [subject.id]: false }));

            }, (error) => {
                console.error(`Error fetching tasks for subject ${subject.id}:`, error);
                setLoadingStates(prev => ({ ...prev, [subject.id]: false }));
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());

    }, [user, subjects, firestore]);

    useEffect(() => {
        if (!subjects) {
            setOverallLoading(true);
            return;
        }
        if (subjects.length === 0) {
            setOverallLoading(false);
            return;
        }
        const anyLoading = Object.values(loadingStates).some(isLoading => isLoading);
        setOverallLoading(anyLoading);
    }, [loadingStates, subjects]);


    return { tasks: allTasks, areTasksLoading: overallLoading };
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);
  const { tasks, areTasksLoading } = useTasksForSubjects(userData?.subjects);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const isDataLoaded = !isUserDataLoading && !areTasksLoading && !isUserLoading;

  useEffect(() => {
    if (isDataLoaded && userData?.theme) {
        const root = window.document.documentElement;
        
        const themeClasses = ['theme-purple', 'theme-orange', 'theme-blue', 'theme-green', 'theme-red'];
        root.classList.remove(...themeClasses);
        root.classList.add(`theme-${userData.theme}`);
    }
  }, [userData?.theme, isDataLoaded]);

  // TODO: Add back notifications logic
  // ...

  const updateUser = useCallback(async (data: Partial<UserData>) => {
    if (userDocRef) {
      await setDoc(userDocRef, data, { merge: true });
    }
  }, [userDocRef]);

  const addTask = useCallback(async (task: Omit<HomeworkTask, 'id'>) => {
      if (!user || !task.subjectId) return;
      const tasksCollectionRef = collection(firestore, 'users', user.uid, 'subjects', task.subjectId, 'tasks');
      await addDoc(tasksCollectionRef, task);
  }, [firestore, user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<HomeworkTask>) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (user && taskToUpdate) {
      const taskDocRef = doc(firestore, 'users', user.uid, 'subjects', taskToUpdate.subjectId, 'tasks', taskId);
      await setDoc(taskDocRef, updates, { merge: true });
    }
  }, [firestore, user, tasks]);


  const deleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (user && taskToDelete) {
        const taskDocRef = doc(firestore, 'users', user.uid, 'subjects', taskToDelete.subjectId, 'tasks', taskId);
        await deleteDoc(taskDocRef);
    }
  }, [firestore, user, tasks]);

  const logout = useCallback(async () => {
    await signOut(auth);
    window.location.href = '/login';
  }, [auth]);

  const resetData = useCallback(async () => {
    if (userDocRef && userData) {
        // This is a destructive operation. We first delete all tasks in all subcollections.
        for (const subject of userData.subjects) {
             const subjectTasksQuery = query(collection(firestore, 'users', user!.uid, 'subjects', subject.id, 'tasks'));
             const tasksSnapshot = await getDocs(subjectTasksQuery);
             for (const taskDoc of tasksSnapshot.docs) {
                await deleteDoc(taskDoc.ref);
             }
        }
        
        await setDoc(userDocRef, initialUserData, { merge: false });
        
        window.location.reload(); // Reload to reflect changes
    }
  }, [userDocRef, userData, firestore, user]);


  // Effect to auto-generate scheduled tasks
  useEffect(() => {
      if (!isDataLoaded || !userData || !userData.setupComplete || userData.subjects.length === 0 || !user) {
          return;
      }
  
      const today = startOfDay(new Date());
  
      for (let i = -7; i < 14; i++) { // Check from a week ago to two weeks in the future
          const dateToCheck = addDays(today, i);
          const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);
  
          if (dayIndex >= 1 && dayIndex <= 5) { // Only school days
              userData.subjects.forEach(subject => {
                  if (userData.schedule[subject.id]?.includes(dayIndex)) {
                      const tasksCollectionRef = collection(firestore, 'users', user.uid, 'subjects', subject.id, 'tasks');
                      
                      const existingTaskForDay = tasks.find(t => 
                        !t.isManual &&
                        t.subjectId === subject.id && 
                        startOfDay(new Date(t.dueDate)).getTime() === dateToCheck.getTime()
                      );
                      
                      if (!existingTaskForDay) {
                           addDoc(tasksCollectionRef, {
                              subjectId: subject.id,
                              subjectName: subject.name,
                              description: '',
                              dueDate: dateToCheck.toISOString(),
                              isCompleted: false,
                              isManual: false
                          }).catch(err => console.log("Silently failed to create task", err));
                      }
                  }
              });
          }
      }
  }, [isDataLoaded, userData, tasks, firestore, user]);

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

    for (const task of upcomingTasks) {
        if (!firstOccurrenceMap.has(task.subjectId)) {
            firstOccurrenceMap.set(task.subjectId, task);
        }
    }

    return Array.from(firstOccurrenceMap.values());
  }, [tasks, currentDate]);

  const memoizedUserData = useMemo(() => {
    if (isUserDataLoading || userData === undefined) return null; // Still loading, but we need to return a consistent shape.
    if (userData === null) return initialUserData; // No data in Firestore, use initial
    return { ...initialUserData, ...userData }; // Merge fetched data with initial
  }, [userData, isUserDataLoading]);
  
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
