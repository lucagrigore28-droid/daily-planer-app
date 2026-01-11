"use server";

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
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
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


export async function triggerNotificationChecks() {
    const admin = initializeFirebaseAdmin();
    if (!admin) {
        console.error("Notification trigger failed: Firebase Admin SDK not properly initialized.");
        return;
    }
    const { db, messaging } = admin;

    console.log("Checking for pending notifications...");

    try {
        const now = new Date();
        const nowInBucharest = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
        const currentTime = `${nowInBucharest.getHours().toString().padStart(2, '0')}:${nowInBucharest.getMinutes().toString().padStart(2, '0')}`;
        
        // Find users whose notification time has passed and who haven't been checked recently
        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .where("notifications.dailyTime", "<=", currentTime)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users need notification checks at this time.");
            return;
        }

        const batch = db.batch();
        const promises = [];

        for (const doc of usersSnapshot.docs) {
            const userId = doc.id;
            const userData = doc.data() as UserData & { lastNotificationCheck?: Timestamp };
            
            // Check if a notification has been sent in the last 23 hours to avoid spamming
            if (userData.lastNotificationCheck) {
                const lastCheck = userData.lastNotificationCheck.toDate();
                const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastCheck < 23) {
                    continue; // Skip if checked recently
                }
            }
            
            console.log(`Processing notifications for user ${userId}`);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);

            const tasksPromise = db
                .collection(`users/${userId}/tasks`)
                .where("isCompleted", "==", false)
                .where("dueDate", ">=", today.toISOString())
                .where("dueDate", "<", dayAfterTomorrow.toISOString())
                .get()
                .then(tasksSnapshot => {
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

                        console.log(`Sending notification to ${userData.name}`, { userId, tasksCount: upcomingTasks.length });
                        return messaging.sendEachForMulticast(message);
                    }
                });

            promises.push(tasksPromise);
            
            // Update the last check time for this user
            const userRef = db.collection('users').doc(userId);
            batch.update(userRef, { lastNotificationCheck: Timestamp.now() });
        }
        
        await Promise.all(promises);
        await batch.commit();

        console.log("Finished checking for pending notifications.");

    } catch (error) {
        console.error("Error triggering notification checks:", error);
    }
}
