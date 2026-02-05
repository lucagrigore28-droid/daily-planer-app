import { DocumentReference, Timestamp } from "firebase/firestore";

export interface ISubject {
    id: string;
    name: string;
    teacher?: string;
    color?: string; // Optional color
    userId: string;
    createdAt: Timestamp;
}

export interface ITask {
    id: string;
    name: string;
    subject: string; // Corresponds to ISubject.id
    deadline: Timestamp;
    urgency: 'low' | 'medium' | 'high';
    completed: boolean;
    userId: string;
    createdAt: Timestamp;
    timeSpent?: number; // in milliseconds
    timerStartTime?: number; // Unix timestamp (ms) when timer started
}

export type PartialTask = Partial<Omit<ITask, 'id' | 'userId'>>;

export interface IEvent {
    id: string;
    userId: string;
    title: string;
    description?: string;
    date: Timestamp;      // Using Firestore Timestamp for consistency
    startTime?: string;   // e.g., "18:00"
    endTime?: string;     // e.g., "20:00"
    createdAt: Timestamp;
}

export type PartialEvent = Partial<Omit<IEvent, 'id' | 'userId'>>;


export interface IUser {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    // App-specific settings
    theme?: string;
    showCompletedTasks?: boolean;
    subjects?: DocumentReference<ISubject>[];
}

export interface IAppContext {
    allTasks: ITask[];
    allSubjects: ISubject[];
    isLoading: boolean;
    isTaskbarVisible: boolean;
    setIsTaskbarVisible: (isVisible: boolean) => void;
    // Task Functions
    addTask: (task: Omit<ITask, 'id' | 'userId' | 'createdAt'>) => Promise<ITask | undefined>;
    updateTask: (taskId: string, updates: PartialTask) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    reorderTasks: (oldIndex: number, newIndex: number) => void;
    // Subject Functions
    addSubject: (subject: Omit<ISubject, 'id' | 'userId' | 'createdAt'>) => Promise<ISubject | undefined>;
    updateSubject: (subjectId: string, updates: Partial<ISubject>) => Promise<void>;
    deleteSubject: (subjectId: string) => Promise<void>;
    // Timer
    isTimerRunning: boolean;
    activeTimerTaskId: string | null;
    startTimer: (taskId: string) => void;
    pauseTimer: (taskId: string, isSwitching?: boolean) => void;
    completeTaskWithTimer: (taskId: string) => void;
}
