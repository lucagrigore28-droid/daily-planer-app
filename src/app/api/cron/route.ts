import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Define types locally as they are no longer in a separate project
type HomeworkTask = {
    id: string;
    subjectId: string;
    subjectName: string;
    dueDate: string; // ISO string
    isCompleted: boolean;
};

type UserNotifications = {
    enabled: boolean;
    afterSchoolTime: string; // e.g. "15:00"
    eveningTime: string; // e.g. "20:00"
    weekendEnabled?: boolean;
    saturdayMorningTime?: string;
    saturdayEveningTime?: string;
    sundayMorningTime?: string;
    sundayEveningTime?: string;
};

type UserData = {
    name: string;
    notifications: UserNotifications;
    fcmTokens?: string[];
};

// Initialize Firebase Admin SDK
let adminApp: App;

if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    adminApp = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const messaging = getMessaging(adminApp);

export async function GET(request: Request) {
    console.log("Cron job started: Checking for homework notifications.");

    try {
        const now = new Date();
        // Get current time in HH:MM format, adjusted for Bucharest timezone.
        const currentTime = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });

        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users with notifications enabled.");
            return NextResponse.json({ message: "No users with notifications enabled." });
        }

        const usersToNotify: { id: string, data: UserData }[] = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data() as UserData;
            
            const isTimeMatch =
                userData.notifications.afterSchoolTime === currentTime ||
                userData.notifications.eveningTime === currentTime ||
                (userData.notifications.weekendEnabled && (
                    userData.notifications.saturdayMorningTime === currentTime ||
                    userData.notifications.saturdayEveningTime === currentTime ||
                    userData.notifications.sundayMorningTime === currentTime ||
                    userData.notifications.sundayEveningTime === currentTime
                ));

            if (isTimeMatch) {
                usersToNotify.push({ id: doc.id, data: userData });
            }
        });

        if (usersToNotify.length === 0) {
            console.log("No users to notify at this time.", { time: currentTime });
            return NextResponse.json({ message: "No users to notify at this time." });
        }

        for (const user of usersToNotify) {
            const { id: userId, data: userData } = user;

            if (!userData.fcmTokens || userData.fcmTokens.length === 0) {
                console.warn(`User ${userId} has no FCM tokens. Skipping.`);
                continue;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);

            const tasksSnapshot = await db
                .collection(`users/${userId}/tasks`)
                .where("isCompleted", "==", false)
                .where("dueDate", ">=", today.toISOString())
                .where("dueDate", "<", dayAfterTomorrow.toISOString())
                .get();

            const upcomingTasks = tasksSnapshot.docs.map(
                (doc) => doc.data() as HomeworkTask,
            );

            if (upcomingTasks.length > 0) {
                const body = `Salut ${userData.name}! Mai ai ${upcomingTasks.length} ${upcomingTasks.length === 1 ? "temă" : "teme"} pentru mâine. Nu uita de ${upcomingTasks[0].subjectName}!`;

                const message = {
                    notification: {
                        title: "Memento teme",
                        body: body,
                    },
                    tokens: userData.fcmTokens,
                };

                console.log(`Sending notification to ${userData.name}`, {
                    userId: userId,
                    tasksCount: upcomingTasks.length,
                });
                
                await messaging.sendEachForMulticast(message);

            } else {
                console.log(`No upcoming tasks for user ${userId}. No notification sent.`);
            }
        }

        console.log("Finished sending notifications.");
        return NextResponse.json({ message: "Notifications sent successfully." });

    } catch (error) {
        console.error("Error in cron job:", error);
        return new NextResponse('Error in cron job', { status: 500 });
    }
}
