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
  {
    schedule: "every 30 minutes",
    timeZone: "Europe/Bucharest",
  },
  async (event) => {
    logger.info("Starting to check for homework notifications.", {
      structuredData: true,
    });

    const now = new Date();
    // Get current time in HH:MM format, adjusted for Bucharest timezone.
    const currentTime = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
    
    const usersSnapshot = await db
      .collection("users")
      .where("notifications.enabled", "==", true)
      .get();
    
    if (usersSnapshot.empty) {
      logger.info("No users with notifications enabled.");
      return;
    }

    const usersToNotify: { id: string, data: UserData }[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data() as UserData;
      const isTimeMatch =
        userData.notifications.afterSchoolTime === currentTime ||
        userData.notifications.eveningTime === currentTime ||
        (userData.notifications.weekendEnabled && (
            userData.notifications.saturdayMorningTime === currentTime ||
            userData.notifications.saturdayEveningTime === currentTime ||
            userData.notifications.sundayMorningTime === currentTime ||
            userData.notifications.sundayEveningTime === currentTime
        ));

      if (isTimeMatch) {
        usersToNotify.push({ id: doc.id, data: userData });
      }
    });

    if (usersToNotify.length === 0) {
      logger.info("No users to notify at this time.", { time: currentTime });
      return;
    }

    const notificationPromises: Promise<any>[] = [];

    for (const user of usersToNotify) {
      const { id: userId, data: userData } = user;
      
      if (!userData.fcmTokens || userData.fcmTokens.length === 0) {
        logger.warn(`User ${userId} has no FCM tokens. Skipping.`);
        continue;
      }

      // Get tasks due today or tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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
      } else {
        logger.info(`No upcoming tasks for user ${userId}. No notification sent.`);
      }
    }

    await Promise.all(notificationPromises);
    logger.info("Finished sending notifications.");
  },
);
