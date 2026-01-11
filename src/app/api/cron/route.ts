
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData, NotificationTime } from '@/lib/types';
import { formatInTimeZone } from 'date-fns-tz';
import { subMinutes, set } from 'date-fns';

let adminApp: App | null = null;
const CRON_INTERVAL_MINUTES = 5; // The interval of our external cron job

function initializeFirebaseAdmin() {
    if (getApps().some(app => app.name === 'firebase-admin-app-notifications')) {
        return getApp('firebase-admin-app-notifications');
    }
    
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
        throw new Error("Server-side Firebase credentials are not configured.");
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        return initializeApp({
            credential: cert(serviceAccount)
        }, 'firebase-admin-app-notifications');
    } catch (e: any) {
        console.error("Firebase Admin initialization failed:", e.message);
        throw new Error(`Firebase Admin initialization failed: ${e.message}`);
    }
}

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Cron job started.");
    
    let app: App;
    try {
        app = initializeFirebaseAdmin();
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error.message);
        return NextResponse.json({ message: "Error: Firebase Admin SDK not properly initialized." }, { status: 500 });
    }
    
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    const timeZone = 'Europe/Bucharest';
    const now = new Date();
    
    // Define the time window for checking notifications.
    // We check for any notification time that falls between (NOW - INTERVAL) and NOW.
    const endRange = set(now, { seconds: 0, milliseconds: 0 });
    const startRange = subMinutes(endRange, CRON_INTERVAL_MINUTES);
    
    const endRangeTime = formatInTimeZone(endRange, timeZone, 'HH:mm');
    const startRangeTime = formatInTimeZone(startRange, timeZone, 'HH:mm');

    console.log(`Cron running. Checking for notification times between ${startRangeTime} and ${endRangeTime} in ${timeZone}.`);
    
    // Query for users with notifications enabled.
    // Firestore does not support inequality checks on different fields, so we filter by time later.
    const usersSnapshot = await db
        .collection("users")
        .where("notifications.enabled", "==", true)
        .get();

    if (usersSnapshot.empty) {
        console.log("No users have notifications enabled.");
        return NextResponse.json({ message: "No users to notify." });
    }
    
    console.log(`Found ${usersSnapshot.docs.length} users with notifications enabled. Checking their schedules...`);
    const notificationPromises: Promise<any>[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data() as UserData;
        
        if (!userData.fcmTokens?.length) {
             console.log(`[${userId}] Skipping user ${userData.name} (no FCM tokens).`);
             continue;
        }

        const userNotifications = userData.notifications;
        const notificationConfigs: { key: string, config: NotificationTime, bodyFn: () => Promise<string | null> }[] = [
            { key: 'daily1', config: { enabled: true, time: userNotifications.dailyTime }, bodyFn: async () => `Reminder: You have homework due tomorrow.` },
            { key: 'daily2', config: { enabled: userNotifications.secondDailyTimeEnabled, time: userNotifications.secondDailyTime }, bodyFn: async () => `Second reminder about your homework.` },
            { key: 'weekend_summary', config: { enabled: userNotifications.weekendSummaryEnabled, time: userNotifications.weekendSummaryTime }, bodyFn: async () => `Here's a summary of your homework for next week.` },
            { key: 'sat_morning', config: userNotifications.weekend.saturdayMorning, bodyFn: async () => `Good morning! Here are your tasks for today.` },
            { key: 'sat_evening', config: userNotifications.weekend.saturdayEvening, bodyFn: async () => `Good evening! Here's a summary of your progress.` },
            { key: 'sun_morning', config: userNotifications.weekend.sundayMorning, bodyFn: async () => `Good morning! Let's plan your Sunday tasks.` },
            { key: 'sun_evening', config: userNotifications.weekend.sundayEvening, bodyFn: async () => `Hope you had a productive weekend! Getting ready for the week.` },
        ];

        for (const { key, config, bodyFn } of notificationConfigs) {
            // Check if the notification time is within our current processing window
            const shouldSend = config.enabled && config.time > startRangeTime && config.time <= endRangeTime;

            if (shouldSend) {
                console.log(`[${userId}] Condition met for notification '${key}' at time ${config.time}.`);
                const body = await bodyFn(); // For now, using generic bodies. This can be customized later.
                
                if (body) {
                    console.log(`[${userId}] - Sending notification to ${userData.name}: "${body}"`);
                    const message = {
                        notification: { title: "Homework Planner Reminder", body },
                        tokens: userData.fcmTokens!,
                    };
                    
                    const promise = messaging.sendEachForMulticast(message)
                        .then(response => {
                            console.log(`[${userId}] - Successfully sent message for '${key}': ${response.successCount} successes, ${response.failureCount} failures.`);
                            if (response.failureCount > 0) {
                                response.responses.forEach(resp => {
                                    if (!resp.success) {
                                        console.error(`[${userId}] - Failure reason for a token:`, resp.error);
                                        // Here you could add logic to remove invalid tokens from the user's document
                                    }
                                });
                            }
                        })
                        .catch(error => {
                            console.error(`[${userId}] - Error sending multicast message for key '${key}':`, error);
                        });
                    notificationPromises.push(promise);
                } else {
                    console.log(`[${userId}] - Notification body is null, not sending for key: ${key}`);
                }
            }
        }
    }
    
    try {
        await Promise.all(notificationPromises);
    } catch (e) {
        console.error("An error occurred while waiting for all notifications to be sent.", e);
    }

    const message = `Cron job finished. Checked ${usersSnapshot.docs.length} users, sent ${notificationPromises.length} batches of notifications.`;
    console.log(message);
    return NextResponse.json({ message });
}
