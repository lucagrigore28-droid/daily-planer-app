
export type Subject = {
  id: string;
  name: string;
  isCustom: boolean;
};

export type Schedule = Record<string, number[]>; // subjectId: [dayOfWeek1, dayOfWeek2, ...]

export type HomeworkTask = {
  id: string;
  subjectId: string;
  subjectName: string;
  description: string;
  dueDate: string; // ISO string
  isCompleted: boolean;
  isManual: boolean;
  plannedDate?: string | null; // ISO string for the day it's planned for weekend work
  estimatedTime?: number; // in minutes
};

export type UserNotifications = {
  enabled: boolean; // Master switch
  dailyTime: string; // e.g. "19:00"
  
  // Advanced notifications
  secondDailyTimeEnabled: boolean;
  secondDailyTime: string; // e.g. "08:00"
  
  weekendSummaryEnabled: boolean;
  weekendSummaryTime: string; // e.g. "20:00" on Friday

  lastNotificationSent?: Record<string, string>; // e.g. { daily: "2024-07-31", weekend: "2024-07-26" }
};

export type UserData = {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  notifications: UserNotifications;
  theme: string;
  fcmTokens?: string[];
  lastNotificationSent?: string; // YYYY-MM-DD - DEPRECATED
};
