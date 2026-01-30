
import {onSchedule} from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Define simplified types here to match the frontend
interface HomeworkTask {
    subjectName: string;
    isCompleted: boolean;
}

interface NotificationSettings {
  time1?: string;
  time2?: string;
}

interface UserData {
    name: string;
    setupComplete: boolean;
    fcmTokens?: string[];
    notificationSettings?: NotificationSettings;
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Runs every minute to check for and send scheduled notifications.
 * This is a 2nd Gen Cloud Function.
 */
export const scheduledNotificationDispatcher = onSchedule({
    schedule: "every 1 minute",
    region: "europe-west1",
    timeZone: "Europe/Bucharest"
  }, async (event) => {
      // Get current time in HH:mm format, in Romanian time zone
      const now = new Date();
      const currentTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Bucharest",
        hour12: false,
      }).format(now);

      // Firebase Functions logs time in UTC, so we log our target time for clarity
      logger.info(`Notification dispatcher (1-min interval) running. Current Romania time is ${currentTime}. Checking for notifications.`);

      // Find users who should be notified at this exact time
      const time1Query = db.collection("users").where("notificationSettings.time1", "==", currentTime);
      const time2Query = db.collection("users").where("notificationSettings.time2", "==", currentTime);

      const [time1Snapshot, time2Snapshot] = await Promise.all([
        time1Query.get(),
        time2Query.get(),
      ]);

      const usersToNotify = new Map<string, UserData>();

      time1Snapshot.forEach((doc) => {
        if (!usersToNotify.has(doc.id)) {
          usersToNotify.set(doc.id, doc.data() as UserData);
        }
      });

      time2Snapshot.forEach((doc) => {
        if (!usersToNotify.has(doc.id)) {
          usersToNotify.set(doc.id, doc.data() as UserData);
        }
      });

      if (usersToNotify.size === 0) {
        logger.info("No users to notify at this time. Exiting.");
        return null;
      }

      logger.info(`Found ${usersToNotify.size} user(s) to notify.`);
      const promises: Promise<any>[] = [];

      usersToNotify.forEach((user, userId) => {
        // The same logic as before, just for the targeted users
        if (!user.setupComplete || !user.fcmTokens || user.fcmTokens.length === 0) {
          return; // Skip if no tokens or setup not complete
        }

        const taskPromise = (async () => {
          try {
            const tasksSnapshot = await db.collection("users").doc(userId).collection("tasks")
                .where("isCompleted", "==", false)
                .get();

            if (!tasksSnapshot.empty) {
              const incompleteTasks = tasksSnapshot.docs.map((doc) => doc.data() as HomeworkTask);
              const subjectNames = [...new Set(incompleteTasks.map((task) => task.subjectName))];
              const notification = {
                title: "Reminder Teme",
                body: `Salut, ${user.name}! Nu uita, mai ai de lucru la: ${subjectNames.join(", ")}.`,
              };

              // Explicitly check fcmTokens again to satisfy TypeScript inside the promise closure
              if (!user.fcmTokens || user.fcmTokens.length === 0) {
                return;
              }

              const message = {
                notification,
                webpush: {
                  notification: {
                    tag: `daily-reminder-${userId}`,
                  },
                },
                tokens: user.fcmTokens,
              };

              const response = await messaging.sendEachForMulticast(message);
              logger.info(`Sent ${response.successCount} notifications to ${userId}.`);

              if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    const failedToken = user.fcmTokens![idx];
                    tokensToRemove.push(failedToken);
                    logger.warn(`Failed to send to token: ${failedToken}`, resp.error);
                  }
                });
                if (tokensToRemove.length > 0) {
                  const updatedTokens = user.fcmTokens!.filter((token) => !tokensToRemove.includes(token));
                  await db.collection("users").doc(userId).update({fcmTokens: updatedTokens});
                  logger.info(`Cleaned ${tokensToRemove.length} invalid tokens for user ${userId}.`);
                }
              }
            }
          } catch (error) {
            logger.error(`Failed to process user ${userId}`, error);
          }
        })();

        promises.push(taskPromise);
      });

      await Promise.all(promises);
      logger.info("Notification dispatcher finished.");
      return null;
    });
