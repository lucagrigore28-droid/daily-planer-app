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
  getNextSchoolDayWithTasks: () => Date | null;
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
    // For manual tasks, we add a random string to ensure uniqueness even if others details are the same
    const uniqueId = task.isManual
        ? `${task.subjectId}-${task.dueDate}-${Math.random().toString(36).substring(2, 9)}`
        : `${task.subjectId}-${task.dueDate}`;
        
    const newTask = { ...task, id: uniqueId };

    setTasks(prev => {
        // Prevent adding duplicates based on the generated ID.
        if (prev.some(t => t.id === newTask.id)) {
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

    // Add today
    relevantDays.push(today);

    // Look forward 14 days to find the next school days
    let futureDay = addDays(today, 1);
    let daysAheadCount = 0;
    while (daysAheadCount < 14) {
      if (isSchoolDay(futureDay)) {
          relevantDays.push(futureDay);
      }
       futureDay = addDays(futureDay, 1);
       daysAheadCount++;
    }
    
    // Get past days that still have tasks, up to 7 days ago
    for (let i = 1; i <= 7; i++) {
        const pastDay = subDays(today, i);
        const tasksForDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === pastDay.getTime());
        if (tasksForDay.length > 0) {
            relevantDays.push(pastDay);
        }
    }
    
    // Deduplicate and sort
    const uniqueDays = Array.from(new Set(relevantDays.map(d => d.getTime()))).map(time => new Date(time));
    uniqueDays.sort((a,b) => a.getTime() - b.getTime());

    return uniqueDays.slice(0, 7);

  }, [currentDate, isSchoolDay, tasks]);

  const getNextSchoolDayWithTasks = useCallback(() => {
    const today = startOfDay(currentDate);
    
    // Check today first if it has any incomplete tasks
    const tasksForToday = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === today.getTime());
    if (tasksForToday.some(t => !t.isCompleted)) {
      return today;
    }
  
    // If today's tasks are all done, or there are no tasks, find the next day
    let nextDay = addDays(today, 1);
    for (let i = 0; i < 30; i++) { // Search up to 30 days in the future
      if (isSchoolDay(nextDay)) {
        return nextDay;
      }
      const tasksForNextDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === nextDay.getTime());
      if (tasksForNextDay.length > 0) {
        return nextDay;
      }
      nextDay = addDays(nextDay, 1);
    }
  
    // Fallback to today if no future day is found
    return today;
  }, [currentDate, tasks, isSchoolDay]);
  
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
    getNextSchoolDayWithTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
