
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Define simplified types here to match the frontend
interface HomeworkTask {
    subjectName: string;
    isCompleted: boolean;
}

interface UserData {
    name: string;
    setupComplete: boolean;
    fcmTokens?: string[]; // Array of FCM tokens for notifications
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * A scheduled function that runs daily to send homework reminders to all users
 * using Firebase Cloud Messaging (FCM).
 */
export const dailyReminder = functions
    .region("europe-west1")
    .pubsub.topic("daily-reminder")
    .onRun(async (context: functions.EventContext) => {
      functions.logger.info("Starting daily reminder process (FCM)...");

      const usersSnapshot = await db.collection("users").get();

      if (usersSnapshot.empty) {
        functions.logger.info("No users found. Exiting.");
        return null;
      }

      const promises: Promise<any>[] = [];

      usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data() as UserData;
        const userId = userDoc.id;

        // Skip users who haven't completed setup or have no notification tokens
        if (!user.setupComplete || !user.fcmTokens || user.fcmTokens.length === 0) {
          return;
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
                    // This tag ensures new notifications replace old ones
                    tag: `daily-reminder-${userId}`,
                  },
                },
                tokens: user.fcmTokens,
              };

              const response = await messaging.sendEachForMulticast(message);
              functions.logger.info(`Sent ${response.successCount} notifications to ${userId}.`);

              // Clean up invalid tokens
              if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    const failedToken = user.fcmTokens![idx];
                    tokensToRemove.push(failedToken);
                    functions.logger.warn(`Failed to send to token: ${failedToken}`, resp.error);
                  }
                });

                if (tokensToRemove.length > 0) {
                  const updatedTokens = user.fcmTokens!.filter((token) => !tokensToRemove.includes(token));
                  await userDoc.ref.update({fcmTokens: updatedTokens});
                  functions.logger.info(`Cleaned ${tokensToRemove.length} invalid tokens for user ${userId}.`);
                }
              }
            }
          } catch (error) {
            functions.logger.error(`Failed to process user ${userId}`, error);
          }
        })();

        promises.push(taskPromise);
      });

      await Promise.all(promises);
      functions.logger.info("Daily reminder process finished.");
      return null;
    });
