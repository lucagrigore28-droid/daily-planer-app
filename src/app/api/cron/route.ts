
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData } from '@/lib/types';
import { formatInTimeZone } from 'date-fns-tz';

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

    console.log("Cron job started: Checking for pending notifications...");

    try {
        const timeZone = 'Europe/Bucharest';
        const now = new Date();
        const currentTime = formatInTimeZone(now, timeZone, 'HH:mm');
        const todayDateStr = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');


        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .where("notifications.dailyTime", "<=", currentTime)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users match time-based query for notifications.");
            return NextResponse.json({ message: "No users due for notifications based on time." });
        }
        
        console.log(`Found ${usersSnapshot.docs.length} potential users for notifications.`);

        const batch = db.batch();
        const notificationPromises = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserData;
            
            // Check if a notification has already been sent today
            if (userData.lastNotificationSent === todayDateStr) {
                continue; // Skip if already notified today
            }
            
            console.log(`Processing notifications for user ${userId} (${userData.name})`);

            // Define "tomorrow" based on the Romanian time zone
            const tomorrow = new Date(now.toLocaleString('en-US', { timeZone }));
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

            const tasksSnapshot = await db
                .collection(`users/${userId}/tasks`)
                .where("isCompleted", "==", false)
                .where("dueDate", ">=", tomorrow.toISOString())
                .where("dueDate", "<", dayAfterTomorrow.toISOString())
                .get();

            const upcomingTasks = tasksSnapshot.docs.map(doc => doc.data() as HomeworkTask);

            if (upcomingTasks.length > 0 && userData.fcmTokens && userData.fcmTokens.length > 0) {
                const body = `Salut ${userData.name}! Mai ai ${upcomingTasks.length} ${upcomingTasks.length === 1 ? "temă" : "teme"} pentru mâine. Nu uita de ${upcomingTasks[0].subjectName}!`;
                
                const message = {
                    notification: {
                        title: "Memento teme",
                        body: body,
                    },
                    tokens: userData.fcmTokens,
                };

                console.log(`Sending notification to ${userData.name} for ${upcomingTasks.length} tasks.`);
                notificationPromises.push(messaging.sendEachForMulticast(message));
                
                // Mark that we've sent a notification for this user today
                const userRef = db.collection('users').doc(userId);
                batch.update(userRef, { lastNotificationSent: todayDateStr });

            }
        }
        
        await Promise.all(notificationPromises);
        await batch.commit();

        const message = "Finished checking for pending notifications.";
        console.log(message);
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Error in cron job:", error);
        return NextResponse.json({ message: `Error triggering notifications: ${error}` }, { status: 500 });
    }
}
