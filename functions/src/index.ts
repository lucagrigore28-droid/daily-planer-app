/**
 * Importuri necesare pentru funcțiile server-side.
 */
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Inițializăm Firebase Admin SDK pentru a putea interacționa cu Firestore.
admin.initializeApp();

/**
 * Endpoint HTTP care poate fi apelat pentru a trimite notificări.
 * Acesta va fi URL-ul pe care îl veți seta în serviciul de cron-job.
 */
export const sendScheduledNotifications = onRequest(
  {region: "europe-west1"},
  async (request, response) => {
    // Securizăm endpoint-ul pentru a nu putea fi apelat de oricine.
    // Ideal, aici ați verifica un token secret trimis de cron-job.
    // Pentru simplitate, momentan lăsăm accesul deschis.

    logger.info("Pornire job de trimitere notificări...", {
      structuredData: true,
    });

    try {
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();

      const today = new Date();

      // Iterăm prin toți utilizatorii din baza de date
      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const userId = userDoc.id;
        const notificationsPrefs = user.notifications;

        // Verificăm dacă utilizatorul are notificările activate
        if (!notificationsPrefs || !notificationsPrefs.enabled) {
          continue; // Trecem la următorul utilizator
        }

        // Obținem temele nefinalizate pentru ziua de azi
        const tasksSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("tasks")
          .where("isCompleted", "==", false)
          .get();

        let tasksForTodayCount = 0;
        tasksSnapshot.forEach((taskDoc) => {
          const task = taskDoc.data();
          const dueDate = (task.dueDate as admin.firestore.Timestamp).toDate();
          if (dueDate.toDateString() === today.toDateString()) {
            tasksForTodayCount++;
          }
        });

        // Dacă nu are teme pentru azi, nu trimitem notificare
        if (tasksForTodayCount === 0) {
          continue;
        }

        // Construim mesajul
        const payload = {
          notification: {
            title: `Salut, ${user.name}!`,
            body: `Mai ai ${tasksForTodayCount} ${
              tasksForTodayCount === 1 ? "temă" : "teme"
            } de finalizat pentru azi. Nu uita de ele!`,
            icon: "/logo-192.png",
          },
        };

        // Obținem abonamentele de notificare ale utilizatorului
        const subscriptionsSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("subscriptions")
          .get();

        // Trimiterea notificării către fiecare dispozitiv abonat
        const promises = subscriptionsSnapshot.docs.map((subDoc) => {
          const subscription = subDoc.data();
          return admin.messaging().send(
            {
              token: subscription.token,
              notification: payload.notification,
            }
          );
        });

        await Promise.all(promises);
      }

      response.send("Job de notificări finalizat cu succes.");
    } catch (error) {
      logger.error("Eroare în job-ul de notificări:", error);
      response.status(500).send("A apărut o eroare.");
    }
  });
