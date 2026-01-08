
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
  plannedDate?: string; // ISO string for the day it's planned for weekend work
  estimatedTime?: number; // in minutes
};

export type UserNotifications = {
  enabled: boolean;
  afterSchoolTime: string; // e.g. "15:00"
  eveningTime: string; // e.g. "20:00"
  weekendEnabled: boolean;
  saturdayMorningTime: string;
  saturdayEveningTime: string;
  sundayMorningTime: string;
  sundayEveningTime: string;
}

export type UserData = {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  notifications: UserNotifications;
  theme: string;
  fcmTokens?: string[];
};
