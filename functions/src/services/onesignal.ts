
// Acest fișier nu mai este necesar, deoarece am trecut la un sistem de notificări locale.
/*
import * as OneSignal from "onesignal-node";

export class OneSignalService {
  private static instance: OneSignalService;
  private client: OneSignal.Client;

  private constructor() {
    const appId = process.env.ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      throw new Error("OneSignal App ID or REST API Key is not configured.");
    }

    this.client = new OneSignal.Client(appId, restApiKey);
  }

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  public async sendNotificationToUser(userId: string, message: string, title?: string): Promise<void> {
    const notification: OneSignal.Notification = {
      contents: {
        "en": message,
        "ro": message,
      },
      include_external_user_ids: [userId],
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
      if (typeof e === 'object' && e !== null && 'body' in e) {
        console.warn(`OneSignal API Error for user ${userId}:`, (e as { body: any }).body);
      } else if (e instanceof Error) {
        console.error(`An unexpected error occurred for user ${userId}:`, e.message);
      } else {
        console.error(`An unknown error occurred for user ${userId}:`, e);
      }
    }
  }
}
*/
