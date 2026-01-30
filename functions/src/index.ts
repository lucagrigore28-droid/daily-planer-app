import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { OneSignalService } from "./services/onesignal";

// Define simplified types here to avoid creating another file for now
interface HomeworkTask {
    subjectName: string;
    isCompleted: boolean;
}
  
interface UserData {
    name: string;
    setupComplete: boolean;
}

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * A scheduled function that runs daily to send homework reminders to all users.
 * This function should be triggered by a Cloud Scheduler job targeting the 'daily-reminder' Pub/Sub topic.
 */
export const dailyReminder = functions
    .region("europe-west1") // Using a European region
    .pubsub.topic("daily-reminder")
    .onRun(async (context: functions.pubsub.Context) => {
    
    functions.logger.info("Starting daily reminder process for all users...");
    
    const oneSignalService = OneSignalService.getInstance();
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
        functions.logger.info("No users found. Exiting.");
        return null;
    }

    const promises: Promise<void>[] = [];

    usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data() as UserData;
        const userId = userDoc.id;

        // Skip users who have not completed setup
        if (!user.setupComplete) {
            return; // continue to next user
        }

        const taskPromise = (async () => {
            try {
                const tasksSnapshot = await db.collection("users").doc(userId).collection("tasks")
                    .where("isCompleted", "==", false)
                    .get();

                // Only send a notification if there are incomplete tasks
                if (!tasksSnapshot.empty) {
                    const incompleteTasks = tasksSnapshot.docs.map(doc => doc.data() as HomeworkTask);
                    
                    // Get a unique list of subject names to avoid duplicates (e.g., "Matematică, Matematică")
                    const subjectNames = [...new Set(incompleteTasks.map(task => task.subjectName))];

                    const title = "Reminder Teme";
                    const message = `Salut, ${user.name}! Nu uita, mai ai de lucru la: ${subjectNames.join(", ")}.`;
                    await oneSignalService.sendNotificationToUser(userId, message, title);
                    functions.logger.info(`Sent reminder to ${userId} for subjects: ${subjectNames.join(", ")}`);
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
