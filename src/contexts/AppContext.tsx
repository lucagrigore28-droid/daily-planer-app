"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { UserData, Subject, Schedule, HomeworkTask } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, isSameDay } from 'date-fns';

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
  findNextSchoolDay: () => Date;
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
    const hasSubjects = Object.values(userData.schedule).some(days => days.includes(dayIndex));
    return hasSubjects;
  }, [userData.schedule]);
  
  const findNextSchoolDay = useCallback(() => {
    let nextDay = addDays(startOfDay(currentDate), 1);
    let i = 0;
    while (i < 7) {
        if (isSchoolDay(nextDay)) {
            return nextDay;
        }
        nextDay = addDays(nextDay, 1);
        i++;
    }
    return addDays(startOfDay(currentDate), 1);
  }, [currentDate, isSchoolDay]);

  const getRelevantSchoolDays = useCallback(() => {
    const relevantDays: Date[] = [];
    const today = startOfDay(currentDate);

    // Look back 7 days
    for (let i = 7; i > 0; i--) {
      const pastDay = subDays(today, i);
      if (isSchoolDay(pastDay)) {
        relevantDays.push(pastDay);
      }
    }

    // Add today if it's a school day
    if (isSchoolDay(today)) {
      relevantDays.push(today);
    }

    // Look forward 14 days to find the next 5 school days
    let futureDay = addDays(today, 1);
    while (relevantDays.filter(d => d > today).length < 5 && relevantDays.length < 15) {
        if (isSchoolDay(futureDay)) {
            relevantDays.push(futureDay);
        }
        futureDay = addDays(futureDay, 1);
    }
    
    // Ensure today is in the list if there are no other school days around
    if (relevantDays.length === 0) {
      return [today];
    }

    return relevantDays;

  }, [currentDate, isSchoolDay]);
  
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
    findNextSchoolDay,
    getRelevantSchoolDays,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
