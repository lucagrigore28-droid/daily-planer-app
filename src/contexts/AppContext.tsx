"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserData, Subject, Schedule, HomeworkTask } from '@/lib/types';
import { addDays, getDay, startOfDay } from 'date-fns';

const initialUserData: UserData = {
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
};

const initialTasks: HomeworkTask[] = [];

type AppContextType = {
  userData: UserData;
  tasks: HomeworkTask[];
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  setTasks: React.Dispatch<React.SetStateAction<HomeworkTask[]>>;
  updateUser: (data: Partial<UserData>) => void;
  addTask: (task: Omit<HomeworkTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<HomeworkTask>) => void;
  getTasksForNextDay: () => HomeworkTask[];
  isDataLoaded: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  hasGpsAccess: boolean | null;
  setHasGpsAccess: (hasAccess: boolean) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [tasks, setTasks] = useState<HomeworkTask[]>(initialTasks);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasGpsAccess, setHasGpsAccess] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('dailyPlannerPro_userData');
      const storedTasks = localStorage.getItem('dailyPlannerPro_tasks');

      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      try {
        localStorage.setItem('dailyPlannerPro_userData', JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to save user data to localStorage", error);
      }
    }
  }, [userData, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      try {
        localStorage.setItem('dailyPlannerPro_tasks', JSON.stringify(tasks));
      } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
      }
    }
  }, [tasks, isDataLoaded]);

  const updateUser = useCallback((data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  }, []);

  const addTask = useCallback((task: Omit<HomeworkTask, 'id'>) => {
    const newTask = { ...task, id: new Date().toISOString() + Math.random() };
    setTasks(prev => [...prev, newTask]);
  }, []);
  
  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
  }, []);

  const getTasksForNextDay = useCallback(() => {
    const nextDayDate = addDays(startOfDay(currentDate), 1);
    const nextDayIndex = getDay(nextDayDate);

    const subjectsForNextDay = userData.subjects.filter(subject =>
      userData.schedule[subject.id]?.includes(nextDayIndex)
    );
    
    let generatedTasks: HomeworkTask[] = [];

    subjectsForNextDay.forEach(subject => {
        const taskExists = tasks.some(task => 
            task.subjectId === subject.id && 
            startOfDay(new Date(task.dueDate)).getTime() === nextDayDate.getTime()
        );

        if (!taskExists) {
            const newScheduledTask: HomeworkTask = {
                id: `${subject.id}-${nextDayDate.toISOString()}`,
                subjectId: subject.id,
                subjectName: subject.name,
                description: '',
                dueDate: nextDayDate.toISOString(),
                isCompleted: false,
                isManual: false,
            };
            generatedTasks.push(newScheduledTask);
        }
    });

    if (generatedTasks.length > 0) {
      // Use a functional update to avoid race conditions
      setTasks(prevTasks => [...prevTasks, ...generatedTasks]);
    }
    
    const allTasksForDay = tasks.filter(task => 
      startOfDay(new Date(task.dueDate)).getTime() === nextDayDate.getTime()
    );
    
    return allTasksForDay;
  }, [userData, tasks, currentDate]);


  const value = {
    userData,
    tasks,
    setUserData,
    setTasks,
    updateUser,
    addTask,
    updateTask,
    getTasksForNextDay,
    isDataLoaded,
    currentDate,
    setCurrentDate,
    hasGpsAccess,
    setHasGpsAccess,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
