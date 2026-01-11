
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { HomeworkTask, UserData, NotificationTime } from '@/lib/types';
import { formatInTimeZone } from 'date-fns-tz';
import { addDays, getDay, startOfDay, endOfDay } from 'date-fns';

let adminApp: App | null = null;

// A more robust way to initialize admin app in a serverless environment
function initializeFirebaseAdmin() {
    if (adminApp) {
        return { db: getFirestore(adminApp), messaging: getMessaging(adminApp) };
    }
    
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
        throw new Error("Server-side Firebase credentials are not configured.");
    }
    
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        }, 'firebase-admin-app-notifications'); // Use a unique name
        return { db: getFirestore(adminApp), messaging: getMessaging(adminApp) };
    } catch (e: any) {
         if (e.code === 'app/duplicate-app') {
            const existingApp = getApps().find(app => app.name === 'firebase-admin-app-notifications')!;
            adminApp = existingApp;
            return { db: getFirestore(existingApp), messaging: getMessaging(existingApp) };
        }
        console.error("Firebase Admin initialization failed:", e);
        throw new Error(`Firebase Admin initialization failed: ${e.message}`);
    }
}

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Cron job started.");
    
    let db: FirebaseFirestore.Firestore;
    let messaging: ReturnType<typeof getMessaging>;
    
    try {
        const adminServices = initializeFirebaseAdmin();
        db = adminServices.db;
        messaging = adminServices.messaging;
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error.message);
        return NextResponse.json({ message: "Error: Firebase Admin SDK not properly initialized." }, { status: 500 });
    }

    const timeZone = 'Europe/Bucharest';
    const now = new Date();
    // Get current time and date in the target timezone as strings
    const currentTime = formatInTimeZone(now, timeZone, 'HH:mm');
    const todayDateStr = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
    // Get the day of the week from the original date object
    const zonedNow = new Date(formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"));
    const todayDayOfWeek = getDay(zonedNow); // Sunday is 0, Saturday is 6
    
    const isWeekday = todayDayOfWeek >= 1 && todayDayOfWeek <= 5;
    const isSaturday = todayDayOfWeek === 6;
    const isSunday = todayDayOfWeek === 0;

    console.log(`Cron job running at ${currentTime} in ${timeZone}. Day of week: ${todayDayOfWeek}`);

    try {
        const usersSnapshot = await db
            .collection("users")
            .where("notifications.enabled", "==", true)
            .get();

        if (usersSnapshot.empty) {
            console.log("No users have notifications enabled.");
            return NextResponse.json({ message: "No users have notifications enabled." });
        }
        
        console.log(`Found ${usersSnapshot.docs.length} potential users for notifications.`);
        const notificationPromises = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data() as UserData;
            const userNotifs = userData.notifications;

            if (!userNotifs || !userData.fcmTokens?.length || userData.fcmTokens.length === 0) {
                 console.log(`Skipping user ${userId} (no notification settings or no tokens).`);
                 continue;
            }

            const checkAndSend = async (key: string, config: NotificationTime, bodyFn: () => Promise<string | null>) => {
                if (config.enabled && config.time === currentTime && userNotifs.lastNotificationSent?.[key] !== todayDateStr) {
                    console.log(`[${userId}] - Condition met for notification key: ${key}`);
                    const body = await bodyFn();
                    if (body) {
                        console.log(`[${userId}] - Sending notification to ${userData.name}`);
                        const message = {
                            notification: { title: "Memento Teme", body },
                            tokens: userData.fcmTokens!,
                        };
                        try {
                           const response = await messaging.sendEachForMulticast(message);
                           console.log(`[${userId}] - Successfully sent message: ${response.successCount} successes, ${response.failureCount} failures.`);
                           if (response.failureCount > 0) {
                                response.responses.forEach(resp => {
                                    if (!resp.success) {
                                        console.error(`[${userId}] - Failure reason:`, resp.error);
                                    }
                                });
                           }
                        } catch (error) {
                           console.error(`[${userId}] - Error sending multicast message:`, error);
                        }
                        // Update last sent time regardless of send success to avoid spamming on persistent error
                        notificationPromises.push(db.doc(`users/${userId}`).set({ notifications: { lastNotificationSent: { [key]: todayDateStr } } }, { merge: true }));
                    } else {
                        console.log(`[${userId}] - Notification body is null, not sending for key: ${key}`);
                    }
                }
            };
            
            // --- Weekday Notifications ---
            if (isWeekday) {
                // Daily notification 1
                await checkAndSend('daily1', { enabled: true, time: userNotifs.dailyTime }, async () => {
                    const tasks = await getTasksForTomorrow(db, userId, zonedNow);
                    if (tasks.length > 0) {
                        return `Salut ${userData.name}! Mai ai ${tasks.length} ${tasks.length === 1 ? "temă" : "teme"} pentru mâine. Nu uita de ${tasks[0].subjectName}!`;
                    }
                    return null;
                });

                // Daily notification 2
                await checkAndSend('daily2', { enabled: userNotifs.secondDailyTimeEnabled, time: userNotifs.secondDailyTime }, async () => {
                    const tasks = await getTasksForTomorrow(db, userId, zonedNow);
                    if (tasks.length > 0) {
                        return `Salut ${userData.name}! Un mic memento: ai ${tasks.length} ${tasks.length === 1 ? "temă" : "teme"} pentru mâine.`;
                    }
                    return null;
                });

                 // --- Weekend Summary Notification Logic (Friday only) ---
                if (todayDayOfWeek === 5) {
                    await checkAndSend('weekend_summary', { enabled: userNotifs.weekendSummaryEnabled, time: userNotifs.weekendSummaryTime }, async () => {
                        const tasks = await getTasksForNextWeek(db, userId, zonedNow);
                         if (tasks.length > 0) {
                            return `Salut ${userData.name}! Pentru weekend și săptămâna viitoare ai ${tasks.length} ${tasks.length === 1 ? "temă" : "teme noi"}. Planifică-ți timpul!`;
                        }
                        return null;
                    });
                }
            }

            const allWeekendTasks = await getWeekendAndNextWeekTasks(db, userId, zonedNow);

            // --- Saturday Notifications ---
            if (isSaturday) {
                await checkAndSend('sat_morning', userNotifs.weekend.saturdayMorning, async () => {
                    const plannedTasks = allWeekendTasks.filter(t => t.plannedDate && getDay(new Date(t.plannedDate)) === 6);
                    if (plannedTasks.length > 0) {
                        const subjects = [...new Set(plannedTasks.map(t => t.subjectName))];
                        return `Salut ${userData.name}! Azi ai de lucru la ${subjects.slice(0, 2).join(', ')}${subjects.length > 2 ? ` și încă ${subjects.length-2} altele` : ''}. Spor!`;
                    }
                    if (allWeekendTasks.length > 0) {
                        return `Salut ${userData.name}! Ai ${allWeekendTasks.length} teme pentru săptămâna viitoare. Poți începe azi!`;
                    }
                    return null;
                });
                 await checkAndSend('sat_evening', userNotifs.weekend.saturdayEvening, async () => {
                    const completedToday = allWeekendTasks.filter(t => t.completedAt && getDay(new Date(t.completedAt)) === 6);
                    const plannedForTomorrow = allWeekendTasks.filter(t => t.plannedDate && getDay(new Date(t.plannedDate)) === 0);
                    if(completedToday.length === 0 && plannedForTomorrow.length === 0) return null;
                    
                    let body = `Salut ${userData.name}!`;
                    if (completedToday.length > 0) {
                         const subjects = [...new Set(completedToday.map(t => t.subjectName))];
                         body += ` Bravo pentru progresul de azi, ai terminat teme la ${subjects.join(', ')}.`;
                    }
                    if (plannedForTomorrow.length > 0) {
                         const subjects = [...new Set(plannedForTomorrow.map(t => t.subjectName))];
                         body += ` Pentru mâine ai planificat teme la ${subjects.slice(0, 2).join(', ')}. Odihnește-te bine!`;
                    }
                    return body;
                });
            }

            // --- Sunday Notifications ---
            if (isSunday) {
                await checkAndSend('sun_morning', userNotifs.weekend.sundayMorning, async () => {
                    const plannedTasks = allWeekendTasks.filter(t => t.plannedDate && getDay(new Date(t.plannedDate)) === 0);
                     if (plannedTasks.length > 0) {
                        const subjects = [...new Set(plannedTasks.map(t => t.subjectName))];
                        return `Salut ${userData.name}! Azi ai de lucru la ${subjects.slice(0, 2).join(', ')}${subjects.length > 2 ? ` și încă ${subjects.length-2} altele` : ''}. Organizează-te!`;
                    }
                    if (allWeekendTasks.length > 0) {
                         return `Salut ${userData.name}! Mai ai ${allWeekendTasks.length} teme pentru săptămâna viitoare. Nu le lăsa pe ultima sută de metri!`;
                    }
                    return null;
                });
                await checkAndSend('sun_evening', userNotifs.weekend.sundayEvening, async () => {
                    const completedToday = allWeekendTasks.filter(t => t.completedAt && getDay(new Date(t.completedAt)) === 0);
                    const tasksForTomorrow = await getTasksForTomorrow(db, userId, zonedNow);
                    if(completedToday.length === 0 && tasksForTomorrow.length === 0) return null;

                    let body = `Salut ${userData.name}!`;
                    if(completedToday.length > 0) {
                        body += ` Ai terminat ${completedToday.length} ${completedToday.length === 1 ? 'temă' : 'teme'} azi.`
                    }
                    if(tasksForTomorrow.length > 0) {
                        const subjects = [...new Set(tasksForTomorrow.map(t => t.subjectName))];
                        body += ` Pentru mâine te așteaptă teme la ${subjects.slice(0, 2).join(', ')}. Noapte bună!`;
                    }
                    return body;
                });
            }
        }
        
        await Promise.all(notificationPromises);

        const message = "Finished checking for pending notifications.";
        console.log(message);
        return NextResponse.json({ message });

    } catch (error) {
        console.error("Error in cron job main try-catch block:", error);
        return NextResponse.json({ message: `Error triggering notifications: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}

async function getTasksForTomorrow(db: FirebaseFirestore.Firestore, userId: string, now: Date): Promise<HomeworkTask[]> {
    const tomorrow = addDays(now, 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);
    
    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where("isCompleted", "==", false)
        .where("dueDate", ">=", startOfTomorrow.toISOString())
        .where("dueDate", "<=", endOfTomorrow.toISOString())
        .get();
        
    const tasks = await Promise.all(tasksSnapshot.docs.map(async doc => {
        const task = doc.data() as HomeworkTask;
        if (!task.subjectName) {
            const subjectDoc = await db.doc(`users/${userId}/subjects/${task.subjectId}`).get();
            task.subjectName = subjectDoc.exists ? subjectDoc.data()?.name : 'Materie ștearsă';
        }
        return task;
    }));

    return tasks;
}

async function getTasksForNextWeek(db: FirebaseFirestore.Firestore, userId: string, now: Date): Promise<HomeworkTask[]> {
    const startOfToday = startOfDay(now);
    const endOfNextWeek = addDays(startOfToday, 7);

    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where("isCompleted", "==", false)
        .where("dueDate", ">=", startOfToday.toISOString())
        .where("dueDate", "<", endOfNextWeek.toISOString())
        .get();
        
    const tasks = await Promise.all(tasksSnapshot.docs.map(async doc => {
        const task = doc.data() as HomeworkTask;
        if (!task.subjectName) {
            const subjectDoc = await db.doc(`users/${userId}/subjects/${task.subjectId}`).get();
            task.subjectName = subjectDoc.exists ? subjectDoc.data()?.name : 'Materie ștearsă';
        }
        return task;
    }));
    return tasks;
}

async function getWeekendAndNextWeekTasks(db: FirebaseFirestore.Firestore, userId: string, now: Date): Promise<HomeworkTask[]> {
    const startOfToday = startOfDay(now);
    // From today until end of next sunday
    const dayOfWeek = getDay(startOfToday); // 0=Sun, 1=Mon...
    const daysUntilNextSunday = 7 - dayOfWeek;
    const endOfThisWeek = endOfDay(addDays(startOfToday, daysUntilNextSunday));


    const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where("dueDate", ">=", startOfToday.toISOString())
        .where("dueDate", "<=", endOfThisWeek.toISOString())
        .get();
        
    const tasks = await Promise.all(tasksSnapshot.docs.map(async doc => {
        const task = doc.data() as HomeworkTask;
        if (!task.subjectName) {
            const subjectDoc = await db.doc(`users/${userId}/subjects/${task.subjectId}`).get();
            task.subjectName = subjectDoc.exists ? subjectDoc.data()?.name : 'Materie ștearsă';
        }
        return task;
    }));
    return tasks;
}
