
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { UserData } from '@/lib/types';
import { formatInTimeZone } from 'date-fns-tz';
import { subMinutes, set } from 'date-fns';

const CRON_INTERVAL_MINUTES = 5; // The interval of our external cron job

// Simplified and robust Firebase Admin initialization
function initializeFirebaseAdmin(): App {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
        throw new Error("Server-side Firebase credentials are not configured.");
    }
    
    // Check if the app is already initialized
    if (getApps().find(app => app.name === 'firebase-admin-cron')) {
        return getApps().find(app => app.name === 'firebase-admin-cron')!;
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        return initializeApp({
            credential: cert(serviceAccount)
        }, 'firebase-admin-cron');
    } catch (e: any) {
        console.error("Firebase Admin initialization failed:", e.message);
        throw new Error(`Firebase Admin initialization failed: ${e.message}`);
    }
}

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Cron job started. Initializing Firebase Admin...");
    let app: App;
    try {
        app = initializeFirebaseAdmin();
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error.message);
        return NextResponse.json({ message: "Error: Firebase Admin SDK initialization failed." }, { status: 500 });
    }
    
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    const timeZone = 'Europe/Bucharest'; 
    const now = new Date();
    
    // Define the time window for checking notifications.
    const endRange = set(now, { seconds: 0, milliseconds: 0 });
    const startRange = subMinutes(endRange, CRON_INTERVAL_MINUTES);
    
    const currentTime = formatInTimeZone(endRange, timeZone, 'HH:mm');

    console.log(`Cron running. Current time in ${timeZone} is ${currentTime}. Checking for users to notify.`);
    
    try {
        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users have notifications enabled.");
            return NextResponse.json({ message: "No users to notify." });
        }
        
        console.log(`Found ${usersSnapshot.docs.length} users with notifications enabled. Checking their daily notification time...`);
        const notificationPromises: Promise<any>[] = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserData;
            
            const userNotificationTime = userData.notifications?.dailyTime;

            if (!userData.fcmTokens?.length || !userNotificationTime) {
                 console.log(`[${userId}] Skipping user ${userData.name}: No FCM tokens or notification time set.`);
                 continue;
            }
            
            // SUPER SIMPLE CHECK: Does the user's notification time fall within the last cron interval?
            const shouldSend = userNotificationTime > formatInTimeZone(startRange, timeZone, 'HH:mm') && userNotificationTime <= currentTime;

            if (shouldSend) {
                console.log(`[${userId}] MATCH! User's time ${userNotificationTime} is within the check window. Preparing to send notification.`);
                
                const message = {
                    notification: { 
                        title: "Verificare Notificare Temă", 
                        body: `Salut ${userData.name}! Acesta este un test. Dacă primești asta, funcționează.` 
                    },
                    tokens: userData.fcmTokens!,
                };
                
                const promise = messaging.sendEachForMulticast(message)
                    .then(response => {
                        console.log(`[${userId}] Successfully sent multicast message: ${response.successCount} successes, ${response.failureCount} failures.`);
                        if (response.failureCount > 0) {
                            response.responses.forEach(resp => {
                                if (!resp.success) {
                                    console.error(`[${userId}] - Failure reason for a token:`, resp.error);
                                }
                            });
                        }
                    })
                    .catch(error => {
                        console.error(`[${userId}] - Error sending multicast message:`, error);
                    });
                notificationPromises.push(promise);
            }
        }
        
        if (notificationPromises.length > 0) {
            await Promise.all(notificationPromises);
            console.log(`Finished sending ${notificationPromises.length} batches of notifications.`);
        } else {
            console.log("No users matched the time criteria in this run.");
        }

        const finalMessage = `Cron job finished. Checked ${usersSnapshot.docs.length} users. Sent ${notificationPromises.length} notification batches.`;
        console.log(finalMessage);
        return NextResponse.json({ message: finalMessage });

    } catch (error: any) {
        console.error("An unexpected error occurred during the cron job execution:", error);
        return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
    }
}
