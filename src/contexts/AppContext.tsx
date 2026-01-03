

"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { HomeworkTask, UserData, UserNotifications } from '@/lib/types';
import { addDays, getDay, startOfDay, subDays, startOfWeek, endOfWeek, format, isSaturday, isSunday } from 'date-fns';
import { themes } from '@/lib/themes';

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
const hasSentNotification = (timeSlot: string) => {
  const lastSent = localStorage.getItem(`dailyPlannerPro_lastNotification_${timeSlot}`);
  if (!lastSent) return false;
  return startOfDay(new Date(lastSent)).getTime() === startOfDay(new Date()).getTime();
};

// Helper function to mark a notification as sent
const markNotificationAsSent = (timeSlot: string) => {
  localStorage.setItem(`dailyPlannerPro_lastNotification_${timeSlot}`, new Date().toISOString());
};

const sendNotification = (notificationTitle: string, notificationBody: string) => {
    new Notification(notificationTitle, {
    body: notificationBody,
    icon: '/icon.svg' 
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
        // Deep merge for notifications
        const mergedNotifications = {
            ...initialUserData.notifications,
            ...(parsedData.notifications || {})
        };
        const mergedData = { 
            ...initialUserData, 
            ...parsedData, 
            notifications: mergedNotifications,
            theme: parsedData.theme || 'purple' // Ensure theme is loaded
        };
        setUserData(mergedData);
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
        
        // Handle color theme
        const themeName = userData.theme || 'purple';
        const themeClass = themes.find(t => t.name === themeName)?.className || 'theme-purple';
        const root = window.document.documentElement;
        
        // Remove old theme classes
        themes.forEach(t => root.classList.remove(t.className));
        
        // Add new theme class
        root.classList.add(themeClass);

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
      
      // Weekday notifications
      if (currentTime === userData.notifications.afterSchoolTime && !hasSentNotification('afterSchool')) {
        if(tasksForTomorrow.length > 0) {
            const subjectNames = Array.from(new Set(tasksForTomorrow.map(t => t.subjectName))).join(', ');
            sendNotification(`Salut, ${userData.name}!`, `Pentru mâine mai ai de lucrat la: ${subjectNames}.`);
        }
        markNotificationAsSent('afterSchool');
      }
      
      if (currentTime === userData.notifications.eveningTime && !hasSentNotification('evening')) {
        if(tasksForTomorrow.length > 0) {
            const subjectNames = Array.from(new Set(tasksForTomorrow.map(t => t.subjectName))).join(', ');
            sendNotification(`Salut, ${userData.name}!`, `Un ultim memento: mai ai de lucrat la: ${subjectNames}.`);
        }
        markNotificationAsSent('evening');
      }

      // Weekend notifications
      if (userData.notifications.weekendEnabled) {
          const weekendTasks = getWeekendTasks();
          const incompleteWeekendTasks = weekendTasks.filter(t => !t.isCompleted);
          
          if(isSaturday(now)) {
              // Saturday Morning
              if(currentTime === userData.notifications.saturdayMorningTime && !hasSentNotification('saturdayMorning')) {
                  if(incompleteWeekendTasks.length > 0) {
                      const plural = incompleteWeekendTasks.length > 1 ? 'teme' : 'temă';
                      sendNotification('Salut, e sâmbătă!', `Ai ${incompleteWeekendTasks.length} ${plural} pentru săptămâna viitoare. Acum e un moment bun să te apuci de ele!`);
                  }
                  markNotificationAsSent('saturdayMorning');
              }
              // Saturday Evening
              if(currentTime === userData.notifications.saturdayEveningTime && !hasSentNotification('saturdayEvening')) {
                   if(incompleteWeekendTasks.length > 0) {
                      const completedCount = weekendTasks.length - incompleteWeekendTasks.length;
                      const completedText = completedCount > 0 ? `Bravo, ai terminat deja ${completedCount}!` : `Nu uita să te și relaxezi.`;
                      sendNotification('Sumar de sâmbătă seara', `${completedText} Mai ai ${incompleteWeekendTasks.length} teme. O poți face!`);
                   }
                  markNotificationAsSent('saturdayEvening');
              }
          }

          if(isSunday(now)) {
              // Sunday Morning
              if(currentTime === userData.notifications.sundayMorningTime && !hasSentNotification('sundayMorning')) {
                  if(incompleteWeekendTasks.length > 0) {
                      const subjectNames = Array.from(new Set(incompleteWeekendTasks.map(t => t.subjectName))).slice(0,3).join(', ');
                      sendNotification('Neața de duminică!', `Mai ai de lucru la: ${subjectNames}. Profită de zi pentru a le termina!`);
                  }
                   markNotificationAsSent('sundayMorning');
              }
              // Sunday Evening
              if(currentTime === userData.notifications.sundayEveningTime && !hasSentNotification('sundayEvening')) {
                  if(incompleteWeekendTasks.length > 0) {
                     sendNotification('Pregătit pentru o nouă săptămână?', `Mai ai ${incompleteWeekendTasks.length} teme nerezolvate. Verifică-le pentru a fi sigur că ești la zi!`);
                  } else if (weekendTasks.length > 0) {
                     sendNotification('Ești gata de săptămâna viitoare!', 'Felicitări, ai terminat toate temele importante. Acum relaxează-te!');
                  }
                  markNotificationAsSent('sundayEvening');
              }
          }
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
      : `${task.subjectId}-${startOfDay(new Date(task.dueDate)).toISOString()}`;
    
    setTasks(prev => {
        // Prevent adding duplicate scheduled tasks
        if (!task.isManual && prev.some(t => t.id === uniqueId)) {
            return prev;
        }
        const newTask = { ...task, id: uniqueId };
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
      // Clear all related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dailyPlannerPro_')) {
          localStorage.removeItem(key);
        }
      });
      setUserData(initialUserData);
      setTasks(initialTasks);
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset data", error);
    }
  }, []);

  // Effect to auto-generate scheduled tasks
  useEffect(() => {
    if (!isDataLoaded || !userData.setupComplete || userData.subjects.length === 0) {
        return;
    }

    setTasks(prevTasks => {
        const newTasks: HomeworkTask[] = [];
        const taskIds = new Set(prevTasks.map(t => t.id));

        const today = startOfDay(new Date());

        for (let i = -14; i < 21; i++) { // Check a wider range to be safe
            const dateToCheck = addDays(today, i);
            const dayIndex = getDay(dateToCheck) === 0 ? 7 : getDay(dateToCheck);

            if (dayIndex >= 1 && dayIndex <= 5) { // Only school days
                userData.subjects.forEach(subject => {
                    if (userData.schedule[subject.id]?.includes(dayIndex)) {
                        const taskId = `${subject.id}-${startOfDay(dateToCheck).toISOString()}`;
                        if (!taskIds.has(taskId)) {
                            newTasks.push({
                                id: taskId,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                description: '',
                                dueDate: dateToCheck.toISOString(),
                                isCompleted: false,
                                isManual: false,
                                estimatedTime: undefined
                            });
                            taskIds.add(taskId); // prevent duplicates in the same run
                        }
                    }
                });
            }
        }

        if (newTasks.length > 0) {
            return [...prevTasks, ...newTasks];
        }
        
        return prevTasks;
    });
}, [isDataLoaded, userData.setupComplete, userData.subjects, userData.schedule]);

  const isSchoolDay = useCallback((date: Date) => {
    const dayIndex = getDay(date) === 0 ? 7 : getDay(date);
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
      const dayStart = startOfDay(nextDay);
      const tasksForNextDay = tasks.filter(task => startOfDay(new Date(task.dueDate)).getTime() === dayStart.getTime());
      
      const dayIndex = getDay(dayStart) === 0 ? 7 : getDay(dayStart);
      const isScheduledDay = userData.subjects.some(subject => userData.schedule[subject.id]?.includes(dayIndex));

      if (tasksForNextDay.length > 0 || isScheduledDay) {
        return dayStart;
      }
      nextDay = addDays(nextDay, 1);
    }
  
    // If no tasks are found, default to today
    return today;
  }, [currentDate, tasks, userData.subjects, userData.schedule]);

  const getWeekendTasks = useCallback(() => {
    const today = startOfDay(currentDate);
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

    const upcomingTasks = tasks.filter(task => {
        const taskDate = startOfDay(new Date(task.dueDate));
        return taskDate >= nextWeekStart && taskDate <= nextWeekEnd;
    });

    const firstOccurrenceMap = new Map<string, HomeworkTask>();
    // Prioritize manual tasks
    const sortedTasks = upcomingTasks.sort((a, b) => (a.isManual === b.isManual) ? 0 : a.isManual ? -1 : 1);

    for (const task of sortedTasks) {
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
