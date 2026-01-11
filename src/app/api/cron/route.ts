
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData } from '@/lib/types';
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin(): { db: ReturnType<typeof getFirestore>, messaging: ReturnType<typeof getMessaging> } | null {
    if (getApps().length > 0) {
        const adminApp = getApps()[0];
        return { db: getFirestore(adminApp), messaging: getMessaging(adminApp) };
    }

    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountString) {
            const serviceAccount = JSON.parse(serviceAccountString);
            const adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
            return { db: getFirestore(adminApp), messaging: getMessaging(adminApp) };
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side Firebase operations will not be authenticated.");
            return null;
        }
    } catch (e) {
        console.error("Firebase Admin initialization failed:", e);
        return null;
    }
}

export const dynamic = 'force-dynamic'; // Ensures the route is not cached

export async function GET() {
    const admin = initializeFirebaseAdmin();
    if (!admin) {
        return NextResponse.json({ message: "Error: Firebase Admin SDK not properly initialized." }, { status: 500 });
    }
    const { db, messaging } = admin;

    const timeZone = 'Europe/Bucharest';
    const now = new Date();
    const zonedNow = utcToZonedTime(now, timeZone);
    const currentTime = formatInTimeZone(zonedNow, timeZone, 'HH:mm');
    const todayDateStr = formatInTimeZone(zonedNow, timeZone, 'yyyy-MM-dd');
    const todayDayOfWeek = zonedNow.getDay(); // Sunday is 0, Friday is 5

    console.log(`Cron job started at ${currentTime} in ${timeZone}`);

    try {
        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .get();

        if (usersSnapshot.empty) {
            return NextResponse.json({ message: "No users have notifications enabled." });
        }
        
        console.log(`Found ${usersSnapshot.docs.length} potential users for notifications.`);
        const notificationPromises = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserData;
            const userNotifs = userData.notifications;

            // --- Daily Notification Logic ---
            const dailyTimes = [{ type: 'daily1', time: userNotifs.dailyTime, enabled: true }, { type: 'daily2', time: userNotifs.secondDailyTime, enabled: userNotifs.secondDailyTimeEnabled }];
            
            for (const { type, time, enabled } of dailyTimes) {
                 if (enabled && time === currentTime && userNotifs.lastNotificationSent?.[type] !== todayDateStr) {
                    const tasks = await getTasksForTomorrow(db, userId, zonedNow);
                    if (tasks.length > 0) {
                        const body = `Salut ${userData.name}! Mai ai ${tasks.length} ${tasks.length === 1 ? "temă" : "teme"} pentru mâine. Nu uita de ${tasks[0].subjectName}!`;
                        console.log(`[${type}] Sending daily notification to ${userData.name}`);
                        notificationPromises.push(messaging.sendEachForMulticast({ notification: { title: "Memento teme zilnice", body }, tokens: userData.fcmTokens || [] }));
                        notificationPromises.push(db.collection('users').doc(userId).set({ notifications: { lastNotificationSent: { [type]: todayDateStr } } }, { merge: true }));
                    }
                 }
            }
            
            // --- Weekend Summary Notification Logic ---
            if (userNotifs.weekendSummaryEnabled && todayDayOfWeek === 5 && userNotifs.weekendSummaryTime === currentTime && userNotifs.lastNotificationSent?.['weekend'] !== todayDateStr) {
                const tasks = await getTasksForNextWeek(db, userId, zonedNow);
                if (tasks.length > 0) {
                    const body = `Salut ${userData.name}! Pentru weekend și săptămâna viitoare ai ${tasks.length} ${tasks.length === 1 ? "temă nouă" : "teme noi"}. Planifică-ți timpul!`;
                    console.log(`[weekend] Sending weekend summary to ${userData.name}`);
                    notificationPromises.push(messaging.sendEachForMulticast({ notification: { title: "Sumar teme weekend", body }, tokens: userData.fcmTokens || [] }));
                    notificationPromises.push(db.collection('users').doc(userId).set({ notifications: { lastNotificationSent: { ['weekend']: todayDateStr } } }, { merge: true }));
                }
            }
        }
        
        await Promise.all(notificationPromises);

        const message = "Finished checking for pending notifications.";
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Error in cron job:", error);
        return NextResponse.json({ message: `Error triggering notifications: ${error}` }, { status: 500 });
    }
}

async function getTasksForTomorrow(db: FirebaseFirestore.Firestore, userId: string, now: Date): Promise<HomeworkTask[]> {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where("isCompleted", "==", false)
        .where("dueDate", ">=", startOfTomorrow.toISOString())
        .where("dueDate", "<", dayAfterTomorrow.toISOString())
        .get();
        
    return tasksSnapshot.docs.map(doc => doc.data() as HomeworkTask);
}

async function getTasksForNextWeek(db: FirebaseFirestore.Firestore, userId: string, now: Date): Promise<HomeworkTask[]> {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfNextWeek = new Date(startOfToday);
    endOfNextWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()) + 7); // End of next Sunday

    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where("isCompleted", "==", false)
        .where("dueDate", ">=", startOfToday.toISOString())
        .where("dueDate", "<", endOfNextWeek.toISOString())
        .get();
        
    return tasksSnapshot.docs.map(doc => doc.data() as HomeworkTask);
}
