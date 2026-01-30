"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledNotificationDispatcher = void 0;
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * Runs every minute to check for and send scheduled notifications.
 * This function uses the v1 syntax for maximum compatibility.
 */
exports.scheduledNotificationDispatcher = functions
    .region("europe-west1")
    .pubsub.schedule("every 1 minute")
    .timeZone("Europe/Bucharest")
    .onRun(async (context) => {
    // Get current time in HH:mm format, in Romanian time zone
    const now = new Date();
    const currentTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Bucharest",
        hour12: false,
    }).format(now);
    logger.info(`Notification dispatcher (1-min interval) running. Current Romania time is ${currentTime}. Checking for notifications.`);
    // Find users who should be notified at this exact time
    const time1Query = db.collection("users").where("notificationSettings.time1", "==", currentTime);
    const time2Query = db.collection("users").where("notificationSettings.time2", "==", currentTime);
    const [time1Snapshot, time2Snapshot] = await Promise.all([
        time1Query.get(),
        time2Query.get(),
    ]);
    const usersToNotify = new Map();
    time1Snapshot.forEach((doc) => {
        if (!usersToNotify.has(doc.id)) {
            usersToNotify.set(doc.id, doc.data());
        }
    });
    time2Snapshot.forEach((doc) => {
        if (!usersToNotify.has(doc.id)) {
            usersToNotify.set(doc.id, doc.data());
        }
    });
    if (usersToNotify.size === 0) {
        logger.info("No users to notify at this time. Exiting.");
        return null;
    }
    logger.info(`Found ${usersToNotify.size} user(s) to notify.`);
    const promises = [];
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
                    const incompleteTasks = tasksSnapshot.docs.map((doc) => doc.data());
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
                        const tokensToRemove = [];
                        response.responses.forEach((resp, idx) => {
                            if (!resp.success) {
                                const failedToken = user.fcmTokens[idx];
                                tokensToRemove.push(failedToken);
                                logger.warn(`Failed to send to token: ${failedToken}`, resp.error);
                            }
                        });
                        if (tokensToRemove.length > 0) {
                            const updatedTokens = user.fcmTokens.filter((token) => !tokensToRemove.includes(token));
                            await db.collection("users").doc(userId).update({ fcmTokens: updatedTokens });
                            logger.info(`Cleaned ${tokensToRemove.length} invalid tokens for user ${userId}.`);
                        }
                    }
                }
            }
            catch (error) {
                logger.error(`Failed to process user ${userId}`, error);
            }
        })();
        promises.push(taskPromise);
    });
    await Promise.all(promises);
    logger.info("Notification dispatcher finished.");
    return null;
});
//# sourceMappingURL=index.js.map
