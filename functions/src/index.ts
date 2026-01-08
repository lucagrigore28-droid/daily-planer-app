/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import type { UserData, HomeworkTask } from "./types";

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// This function will run every 30 minutes.
export const sendHomeworkNotifications = onSchedule(
  "every 30 minutes",
  async (event) => {
    logger.info("Starting to check for homework notifications.", {
      structuredData: true,
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinute,
    ).padStart(2, "0")}`;

    // Get all users who have notifications enabled and have tokens
    const usersSnapshot = await db
      .collection("users")
      .where("notifications.enabled", "==", true)
      .get();

    if (usersSnapshot.empty) {
      logger.info("No users with notifications enabled.");
      return;
    }

    const notificationPromises: Promise<any>[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as UserData;
      const userId = userDoc.id;

      if (!userData.fcmTokens || userData.fcmTokens.length === 0) {
        continue; // Skip user if no tokens
      }

      const { notifications } = userData;

      // Check if it's time for a notification
      const isTimeForNotification =
        notifications.afterSchoolTime.startsWith(String(currentHour).padStart(2, '0')) ||
        notifications.eveningTime.startsWith(String(currentHour).padStart(2, '0'));

      if (isTimeForNotification) {
        // Get tasks due today or tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);

        const tasksSnapshot = await db
          .collection(`users/${userId}/tasks`)
          .where("isCompleted", "==", false)
          .where("dueDate", ">=", today.toISOString())
          .where("dueDate", "<", dayAfterTomorrow.toISOString())
          .get();

        const upcomingTasks = tasksSnapshot.docs.map(
          (doc) => doc.data() as HomeworkTask,
        );

        if (upcomingTasks.length > 0) {
          const body = `Salut ${
            userData.name
          }! Mai ai ${
            upcomingTasks.length
          } ${
            upcomingTasks.length === 1 ? "temă" : "teme"
          } pentru mâine. Nu uita de ${upcomingTasks[0].subjectName}!`;

          const message = {
            notification: {
              title: "Memento teme",
              body: body,
            },
            tokens: userData.fcmTokens,
          };

          logger.info(`Sending notification to ${userData.name}`, {
            userId: userId,
            tasksCount: upcomingTasks.length,
          });

          notificationPromises.push(getMessaging().sendEachForMulticast(message));
        }
      }
    }

    await Promise.all(notificationPromises);
    logger.info("Finished sending notifications.");
  },
);
