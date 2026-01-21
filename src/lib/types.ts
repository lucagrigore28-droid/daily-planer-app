
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
  timeSpent?: number; // in milliseconds
  timerStartTime?: number; // timestamp in milliseconds
};

export type UserData = {
  username: string;
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  theme: string;
  customThemeColors?: string[]; // Array of hex color strings
  weekendTabStartDay?: number; // 1 for Monday, 7 for Sunday
};
