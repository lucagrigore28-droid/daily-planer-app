
export interface HomeworkTask {
  id: string; // Firestore document ID
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  dueDate: string; // ISO string
  description: string;
  isCompleted: boolean;
  isManual: boolean;
  scheduledDate?: string; // ISO string - The date the user plans to work on the task
  scheduledTime?: string; // "HH:mm" - The time the user plans to work on the task
  estimatedTime?: number; // in minutes
  timeSpent?: number; // in milliseconds
  timerStartTime?: number | null; // Unix timestamp
  isLocked?: boolean; // UI-only, not in Firestore
  coinsAwarded?: boolean;
  isDisappearing?: boolean; // UI-only for animations
}

export interface PersonalEvent {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  eventDate: string; // ISO string
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
}

export interface Subject {
  id: string;
  name: string;
  isCustom: boolean;
}

export type Schedule = {
  [subjectId: string]: number[]; // day of week 1-7
};

export interface Theme {
  name: string;
  label: string;
  className: string;
  primary: string;
  accent: string;
  cost: number;
}

export interface UserData {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
  theme: string;
  customThemeColors?: string[];
  weekendTabStartDay: number; // 1-7
  coins: number;
  unlockedThemes: string[];
  // Old fields that might exist
  username?: string;
}
