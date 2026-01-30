/**
 * @fileOverview A service for interacting with the OneSignal API.
 */

import * as OneSignal from "onesignal-node";

/**
 * A singleton service class for sending notifications via OneSignal.
 */
export class OneSignalService {
  private static instance: OneSignalService;
  private client: OneSignal.Client;

  private constructor() {
    const appId = process.env.ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      throw new Error("OneSignal App ID or REST API Key is not configured. Ensure they are set in your environment variables (e.g., in a .env file).");
    }

    this.client = new OneSignal.Client(appId, restApiKey);
  }

  /**
   * Gets the singleton instance of the OneSignalService.
   * @return {OneSignalService} The singleton instance.
   */
  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /**
   * Sends a notification to a specific user.
   * @param {string} userId - The external user ID (Firebase UID) to send the notification to.
   * @param {string} message - The content of the notification.
   * @param {string} [title] - The title of the notification.
   * @return {Promise<void>}
   */
  public async sendNotificationToUser(userId: string, message: string, title?: string): Promise<void> {
    const notification: OneSignal.Notification = {
      contents: {
        "en": message,
        "ro": message,
      },
      include_external_user_ids: [userId],
      // This allows grouping notifications so the user doesn't get spammed.
      // A new notification with the same ID will replace the old one.
      web_push_topic: "daily-reminder",
    };
    
    if (title) {
        notification.headings = {
            "en": title,
            "ro": title
        };
    }

    try {
      await this.client.createNotification(notification);
    } catch (e) {
      // It's possible for the OneSignal API to throw an error if the user ID doesn't exist
      // (e.g., user uninstalled, etc.). We can safely ignore these errors.
      if (e instanceof OneSignal.OneSignalApiError) {
        console.warn(`OneSignal API Error for user ${userId}:`, e.body);
      } else if (e instanceof Error) {
        console.error(`An unexpected error occurred while sending OneSignal notification to user ${userId}:`, e.message);
      } else {
        console.error(`An unknown error occurred while sending OneSignal notification to user ${userId}:`, e);
      }
    }
  }
}
