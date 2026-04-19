/**
 * HOMECI — Notification functions
 * sendPushNotification: triggered when a notification doc is created in Firestore.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, logger } from "./firebase-admin";
import { sendPushToUser } from "./pushHelper";

export const sendPushNotification = onDocumentCreated(
  {
    document: "notifications/{notifId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const userId = data.user_id as string;
    const title = (data.title as string) || "HOMECI";
    const body = (data.message as string) || "";
    const propertyId = (data.property_id as string) || "";

    if (!userId) {
      logger.warn("sendPushNotification: pas de user_id dans la notification.");
      return;
    }

    const notifType = (data.type as string) || "";

    // Check if push was already sent (for offline chat messages)
    const pushSent = data.push_sent as boolean | undefined;
    if (pushSent === true) {
      logger.info("Push déjà envoyé pour cette notification (chat offline).");
      return;
    }

    const db = getFirestore();

    // Check notification preferences
    const userSnap = await db.collection("users").doc(userId).get();
    const prefs = userSnap.data()?.notification_prefs as Record<string, unknown> | undefined;
    if (prefs) {
      const isVisit = notifType.startsWith("visit_");
      const isMessage = notifType === "new_message";
      const isCert = notifType.startsWith("notaire_");
      const isSystem = notifType === "system";
      if (
        (isVisit && prefs.visits === false) ||
        (isMessage && prefs.messages === false) ||
        (isCert && prefs.certifications === false) ||
        (isSystem && prefs.system === false)
      ) {
        logger.info(`Push ignoré pour ${userId}: notification ${notifType} désactivée.`);
        return;
      }
    }

    const chatId = (data.chat_id as string) || "";
    const link = chatId
      ? `/dashboard?open_chat=${chatId}`
      : propertyId
        ? `/?property=${propertyId}`
        : "/";

    await sendPushToUser(userId, title, body, {
      property_id: propertyId,
      notification_id: event.params.notifId,
      chat_id: chatId,
      type: notifType,
    }, link);
  }
);
