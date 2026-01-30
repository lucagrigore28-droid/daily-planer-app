
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

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

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const scheduledNotificationDispatcher = functions
    .pubsub.schedule("* * * * *")
    .onRun(async (context) => {
      const now = new Date();
      const currentTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Bucharest",
        hour12: false,
      }).format(now);

      logger.info(`Notification dispatcher running. Current Romania time: ${currentTime}.`);

      const usersToNotify = new Map<string, UserData>();

      try {
        const usersSnapshot = await db.collection("users").get();
        
        logger.info(`Found ${usersSnapshot.size} total users in database. Checking for notification schedules...`);

        usersSnapshot.forEach((doc) => {
            const user = doc.data() as UserData;
            if (user.notificationSettings) {
                if (user.notificationSettings.time1 === currentTime || user.notificationSettings.time2 === currentTime) {
                    if (!usersToNotify.has(doc.id)) {
                        usersToNotify.set(doc.id, user);
                        logger.info(`User ${doc.id} (${user.name}) scheduled for notification at ${currentTime}.`);
                    }
                }
            }
        });
      } catch (error) {
        logger.error("FATAL: Error fetching users collection:", error);
        return null; // Exit if we can't even get the users
      }


      if (usersToNotify.size === 0) {
        logger.info("No users to notify at this time. Exiting.");
        return null;
      }

      logger.info(`Found ${usersToNotify.size} user(s) to notify.`);
      const promises: Promise<any>[] = [];

      usersToNotify.forEach((user, userId) => {
        if (!user.setupComplete || !user.fcmTokens || user.fcmTokens.length === 0) {
          logger.info(`Skipping user ${userId}: no setup or no FCM tokens.`);
          return;
        }

        const taskPromise = (async () => {
          try {
            const tasksSnapshot = await db.collection("users").doc(userId).collection("tasks")
                .where("isCompleted", "==", false)
                .get();

            if (tasksSnapshot.empty) {
                logger.info(`User ${userId} has no incomplete tasks. No notification will be sent.`);
                return;
            }

            const incompleteTasks = tasksSnapshot.docs.map((doc) => doc.data() as HomeworkTask);
            const subjectNames = [...new Set(incompleteTasks.map((task) => task.subjectName))];
            
            const notification = {
              title: "Reminder Teme",
              body: `Salut, ${user.name}! Nu uita, mai ai de lucru la: ${subjectNames.join(", ")}.`,
            };

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
            logger.info(`Successfully sent ${response.successCount} notifications to ${userId}.`);

            if (response.failureCount > 0) {
              logger.warn(`Encountered ${response.failureCount} failures for user ${userId}.`);
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
          } catch (error) {
            logger.error(`Failed to process notifications for user ${userId}`, error);
          }
        })();
        promises.push(taskPromise);
      });

      await Promise.all(promises);
      logger.info("Notification dispatcher finished.");
      return null;
    });
