
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { UserData } from '@/lib/types';

// Simplified and robust Firebase Admin initialization
function initializeFirebaseAdmin(): App {
    if (getApps().length) {
        return getApps()[0]!;
    }
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
        throw new Error("Server-side Firebase credentials are not configured.");
    }
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        return initializeApp({
            credential: cert(serviceAccount)
        });
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
        return NextResponse.json({ message: "Error: Firebase Admin SDK initialization failed." }, { status: 500 });
    }
    
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    // Vercel servers run on UTC. We will adjust to Romania's time (UTC+3 for EEST).
    const now = new Date();
    now.setHours(now.getUTCHours() + 3);
    
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    
    console.log(`Cron running. Current time (assumed Romania) is ${currentTime}. Checking for users to notify.`);
    
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
            
            // SUPER SIMPLE CHECK: Does the user's notification time match the current time?
            if (userNotificationTime === currentTime) {
                console.log(`[${userId}] MATCH! User's time ${userNotificationTime} matches current time. Preparing to send notification.`);
                
                const message = {
                    notification: { 
                        title: "Planificator Teme", 
                        body: `Salut ${userData.name}! Ai teme de verificat.` 
                    },
                    tokens: userData.fcmTokens!,
                };
                
                // This sends the notification and handles logging for success/failure
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
            console.log(`Finished sending notifications to ${notificationPromises.length} users.`);
        } else {
            console.log("No users matched the time criteria in this run.");
        }

        const finalMessage = `Cron job finished. Checked ${usersSnapshot.docs.length} users. Sent notifications to ${notificationPromises.length} users.`;
        console.log(finalMessage);
        return NextResponse.json({ message: finalMessage });

    } catch (error: any) {
        console.error("An unexpected error occurred during the cron job execution:", error);
        return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
    }
}
