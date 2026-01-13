
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

export type UserData = {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  theme: string;
};
