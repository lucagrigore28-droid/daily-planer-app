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
};

export type UserData = {
  name: string;
  subjects: Subject[];
  schedule: Schedule;
  setupComplete: boolean;
};
