
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
  completedAt?: string; // ISO string when the task was completed
};

export type NotificationTime = {
    enabled: boolean;
    time: string; // "HH:mm"
}

export type WeekendNotifications = {
    saturdayMorning: NotificationTime;
    saturdayEvening: NotificationTime;
    sundayMorning: NotificationTime;
    sundayEvening: NotificationTime;
}

export type UserNotifications = {
  enabled: boolean; // Master switch
  
  // Weekday notifications
  dailyTime: string; // e.g. "19:00"
  secondDailyTimeEnabled: boolean;
  secondDailyTime: string; // e.g. "08:00"
  
  // Weekend summary (Friday)
  weekendSummaryEnabled: boolean;
  weekendSummaryTime: string; // e.g. "20:00" on Friday

  // Detailed weekend notifications
  weekend: WeekendNotifications;

  lastNotificationSent: Record<string, string>; // e.g. { daily1: "2024-07-31", weekend: "2024-07-26", sat_morning: "2024-08-03" }
};

export type UserData = {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  notifications: UserNotifications;
  theme: string;
  fcmTokens?: string[];
};
