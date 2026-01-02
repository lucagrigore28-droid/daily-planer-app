"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { HomeworkTask, UserData } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays } from 'date-fns';

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
  isDataLoaded: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  hasGpsAccess: boolean | null;
  setHasGpsAccess: (hasAccess: boolean) => void;
  getRelevantSchoolDays: () => Date[];
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
    const uniqueId = `${task.subjectId}-${task.dueDate}-${Math.random().toString(36).substring(2, 9)}`;
    const newTask = { ...task, id: uniqueId };
    setTasks(prev => {
        // Prevent adding duplicates
        if (prev.some(t => t.id === newTask.id || (t.subjectId === newTask.subjectId && t.dueDate === newTask.dueDate && !t.isManual))) {
            return prev;
        }
        return [...prev, newTask];
    });
  }, []);
  
  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
  }, []);

  const isSchoolDay = useCallback((date: Date) => {
    const dayIndex = getDay(date);
    // School days are Monday (1) to Friday (5)
    if (dayIndex < 1 || dayIndex > 5) return false;
    const hasSubjects = Object.values(userData.schedule).some(days => days.includes(dayIndex));
    return hasSubjects;
  }, [userData.schedule]);
  

  const getRelevantSchoolDays = useCallback(() => {
    const relevantDays: Date[] = [];
    const today = startOfDay(currentDate);

    // Look back 7 days
    for (let i = 7; i > 0; i--) {
      const pastDay = subDays(today, i);
      const tasksForDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === pastDay.getTime());
      if (tasksForDay.length > 0) {
        relevantDays.push(pastDay);
      }
    }

    // Add today
    relevantDays.push(today);

    // Look forward 14 days to find the next 5-7 school days with tasks
    let futureDay = addDays(today, 1);
    let daysAheadCount = 0;
    while (daysAheadCount < 14) {
      if (isSchoolDay(futureDay)) {
          relevantDays.push(futureDay);
      }
       futureDay = addDays(futureDay, 1);
       daysAheadCount++;
    }
    
    // Deduplicate and sort
    const uniqueDays = Array.from(new Set(relevantDays.map(d => d.getTime()))).map(time => new Date(time));
    uniqueDays.sort((a,b) => a.getTime() - b.getTime());

    return uniqueDays;

  }, [currentDate, isSchoolDay, tasks]);
  
  const value = {
    userData,
    tasks,
    setUserData,
    setTasks,
    updateUser,
    addTask,
    updateTask,
    isDataLoaded,
    currentDate,
    setCurrentDate,
    hasGpsAccess,
    setHasGpsAccess,
    getRelevantSchoolDays,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
