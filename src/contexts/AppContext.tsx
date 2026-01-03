
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { HomeworkTask, UserData, UserNotifications } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek, format } from 'date-fns';

const initialUserData: UserData = {
  name: '',
  subjects: [],
  schedule: {},
  setupComplete: false,
  notifications: {
    enabled: false,
    afterSchoolTime: '15:00',
    eveningTime: '20:00',
  }
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
  deleteTask: (taskId: string) => void;
  resetData: () => void;
  isDataLoaded: boolean;
  currentDate: Date;
  getRelevantSchoolDays: () => Date[];
  getNextSchoolDayWithTasks: () => Date | null;
  getWeekendTasks: () => HomeworkTask[];
};

export const AppContext = createContext<AppContextType | null>(null);

// Helper function to check if a notification has been sent for a specific time slot on the current day
const hasSentNotification = (timeSlot: 'afterSchool' | 'evening') => {
  const lastSent = localStorage.getItem(`dailyPlannerPro_lastNotification_${timeSlot}`);
  if (!lastSent) return false;
  return startOfDay(new Date(lastSent)).getTime() === startOfDay(new Date()).getTime();
};

// Helper function to mark a notification as sent
const markNotificationAsSent = (timeSlot: 'afterSchool' | 'evening') => {
  localStorage.setItem(`dailyPlannerPro_lastNotification_${timeSlot}`, new Date().toISOString());
};

const sendNotification = (userName: string, tasks: HomeworkTask[]) => {
  if (tasks.length === 0) return;

  const subjectNames = Array.from(new Set(tasks.map(t => t.subjectName))).join(', ');
  const notificationTitle = `Salut, ${userName}!`;
  const notificationBody = `Pentru mâine mai ai de lucrat la: ${subjectNames}.`;

  new Notification(notificationTitle, {
    body: notificationBody,
    icon: '/logo.png' // Assuming you have a logo in public folder
  });
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [tasks, setTasks] = useState<HomeworkTask[]>(initialTasks);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('dailyPlannerPro_userData');
      const storedTasks = localStorage.getItem('dailyPlannerPro_tasks');

      if (storedUserData) {
        // Merge stored data with initial data to ensure new fields are present
        const parsedData = JSON.parse(storedUserData);
        setUserData(prevData => ({ ...prevData, ...parsedData }));
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


   // Effect for handling notifications
  useEffect(() => {
    if (!isDataLoaded || !userData.setupComplete || !userData.notifications.enabled) {
      return;
    }
    
    const checkTimeAndNotify = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      const tomorrow = addDays(startOfDay(now), 1);
      const tasksForTomorrow = tasks.filter(task => 
        !task.isCompleted && startOfDay(new Date(task.dueDate)).getTime() === tomorrow.getTime()
      );

      // Check for after-school notification
      if (currentTime === userData.notifications.afterSchoolTime && !hasSentNotification('afterSchool')) {
        sendNotification(userData.name, tasksForTomorrow);
        markNotificationAsSent('afterSchool');
      }
      
      // Check for evening notification
      if (currentTime === userData.notifications.eveningTime && !hasSentNotification('evening')) {
        sendNotification(userData.name, tasksForTomorrow);
        markNotificationAsSent('evening');
      }
    };
    
    // Check every minute
    const intervalId = setInterval(checkTimeAndNotify, 60000);

    return () => clearInterval(intervalId);

  }, [isDataLoaded, userData, tasks]);

  const updateUser = useCallback((data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  }, []);

  const addTask = useCallback((task: Omit<HomeworkTask, 'id'>) => {
    const uniqueId = task.isManual
        ? `${task.subjectId}-${task.dueDate}-${Math.random().toString(36).substring(2, 9)}`
        : `${task.subjectId}-${task.dueDate}`;
        
    const newTask = { ...task, id: uniqueId };

    setTasks(prev => {
        if (prev.some(t => t.id === newTask.id)) {
            return prev;
        }
        return [...prev, newTask];
    });
  }, []);
  
  const updateTask = useCallback((taskId: string, updates: Partial<HomeworkTask>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const resetData = useCallback(() => {
    try {
      localStorage.removeItem('dailyPlannerPro_userData');
      localStorage.removeItem('dailyPlannerPro_tasks');
      localStorage.removeItem('dailyPlannerPro_lastNotification_afterSchool');
      localStorage.removeItem('dailyPlannerPro_lastNotification_evening');
      setUserData(initialUserData);
      setTasks(initialTasks);
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset data", error);
    }
  }, []);

  const isSchoolDay = useCallback((date: Date) => {
    const dayIndex = getDay(date);
    if (dayIndex < 1 || dayIndex > 5) return false;
    const hasSubjects = Object.values(userData.schedule).some(days => days.includes(dayIndex));
    return hasSubjects;
  }, [userData.schedule]);
  

  const getRelevantSchoolDays = useCallback(() => {
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
    
    for (let i = 1; i <= 7; i++) {
        const pastDay = subDays(today, i);
        const tasksForDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === pastDay.getTime());
        if (tasksForDay.length > 0) {
            relevantDays.push(pastDay);
        }
    }
    
    const uniqueDays = Array.from(new Set(relevantDays.map(d => d.getTime()))).map(time => new Date(time));
    uniqueDays.sort((a,b) => a.getTime() - b.getTime());

    return uniqueDays.slice(0, 7);

  }, [currentDate, isSchoolDay, tasks]);

  const getNextSchoolDayWithTasks = useCallback(() => {
    const today = startOfDay(currentDate);
    
    // First, check if there are incomplete tasks for today
    const tasksForToday = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === today.getTime() && !task.isCompleted);
    if (tasksForToday.length > 0) {
      return today;
    }
  
    // If not, find the next day with any scheduled or manual tasks
    let nextDay = addDays(today, 1);
    for (let i = 0; i < 30; i++) { // Check up to 30 days in the future
      const tasksForNextDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === nextDay.getTime() && !task.isCompleted);
      
      const dayIndex = getDay(nextDay);
      const isScheduledDay = userData.subjects.some(subject => userData.schedule[subject.id]?.includes(dayIndex));

      if (tasksForNextDay.length > 0 || isScheduledDay) {
        return nextDay;
      }
      nextDay = addDays(nextDay, 1);
    }
  
    // If no tasks are found, default to today
    return today;
  }, [currentDate, tasks, isSchoolDay, userData]);

  const getWeekendTasks = useCallback(() => {
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
  
  const value = {
    userData,
    tasks,
    setUserData,
    setTasks,
    updateUser,
    addTask,
    updateTask,
    deleteTask,
    resetData,
    isDataLoaded,
    currentDate,
    getRelevantSchoolDays,
    getNextSchoolDayWithTasks,
    getWeekendTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
