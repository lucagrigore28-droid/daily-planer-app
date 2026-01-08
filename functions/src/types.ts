
export type HomeworkTask = {
    id: string;
    subjectId: string;
    subjectName: string;
    dueDate: string; // ISO string
    isCompleted: boolean;
};

export type UserNotifications = {
    enabled: boolean;
    afterSchoolTime: string; // e.g. "15:00"
    eveningTime: string; // e.g. "20:00"
}

export type UserData = {
    name: string;
    notifications: UserNotifications;
    fcmTokens?: string[];
};
