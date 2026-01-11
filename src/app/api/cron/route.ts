
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData } from '@/lib/types';

// Initialize Firebase Admin SDK
let adminApp: App;

if (!getApps().length) {
    try {
        // This will only work in a Vercel environment where the env var is set
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Cron job will not be able to authenticate with Firebase.");
        }
    } catch (e) {
        console.error("Firebase Admin initialization failed:", e);
    }
} else {
    adminApp = getApps()[0];
}


const db = adminApp ? getFirestore(adminApp) : null;
const messaging = adminApp ? getMessaging(adminApp) : null;


export async function GET(request: Request) {
    if (!db || !messaging) {
        console.error("Cron job failed: Firebase Admin SDK not properly initialized.");
        return new NextResponse('Firebase Admin SDK not initialized', { status: 500 });
    }

    console.log("Cron job started: Checking for homework notifications.");

    try {
        const now = new Date();
        const nowInBucharest = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
        const currentHour = nowInBucharest.getHours(); // Get the current hour (0-23)
        
        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .where("notifications.dailyTime", "==", `${currentHour.toString().padStart(2, '0')}:00`)
            .get();

        if (usersSnapshot.empty) {
            console.log(`No users to notify at hour: ${currentHour}:00.`);
            return NextResponse.json({ message: "No users to notify at this time." });
        }

        for (const doc of usersSnapshot.docs) {
            const userId = doc.id;
            const userData = doc.data() as UserData;

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

        console.log("Finished sending notifications for hour:", currentHour);
        return NextResponse.json({ message: "Notifications sent successfully." });

    } catch (error) {
        console.error("Error in cron job:", error);
        return new NextResponse('Error in cron job', { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
