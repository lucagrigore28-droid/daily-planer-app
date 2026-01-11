
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData } from '@/lib/types';

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
        const now = new Date();
        // Use Romanian time zone to match user settings
        const nowInBucharest = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
        const currentTime = `${nowInBucharest.getHours().toString().padStart(2, '0')}:${nowInBucharest.getMinutes().toString().padStart(2, '0')}`;

        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .where("notifications.dailyTime", "<=", currentTime)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users due for notifications at this time.");
            return NextResponse.json({ message: "No users due for notifications." });
        }
        
        console.log(`Found ${usersSnapshot.docs.length} potential users for notifications.`);

        const batch = db.batch();
        const notificationPromises = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserData & { lastNotificationCheck?: Timestamp };
            
            // Check if a notification has been sent in the last 23 hours to avoid spamming
            if (userData.lastNotificationCheck) {
                const lastCheck = userData.lastNotificationCheck.toDate();
                const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastCheck < 23) {
                    continue; // Skip if checked recently
                }
            }
            
            console.log(`Processing notifications for user ${userId} (${userData.name})`);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);

            const tasksSnapshot = await db
                .collection(`users/${userId}/tasks`)
                .where("isCompleted", "==", false)
                .where("dueDate", ">=", tomorrow.toISOString().split('T')[0] + 'T00:00:00.000Z')
                .where("dueDate", "<", dayAfterTomorrow.toISOString().split('T')[0] + 'T00:00:00.000Z')
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
                
                // Mark that we've checked this user
                const userRef = db.collection('users').doc(userId);
                batch.update(userRef, { lastNotificationCheck: Timestamp.now() });

            } else {
                 // Even if there are no tasks, update the check time to avoid re-checking them constantly today
                 const userRef = db.collection('users').doc(userId);
                 batch.update(userRef, { lastNotificationCheck: Timestamp.now() });
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
