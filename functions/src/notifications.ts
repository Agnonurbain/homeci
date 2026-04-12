/**
 * HOMECI — Notification functions
 * sendPushNotification: triggered when a notification doc is created in Firestore.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, getMessaging, logger } from "./firebase-admin";

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

    // Get FCM tokens
    const tokensSnap = await db
      .collection("users")
      .doc(userId)
      .collection("fcm_tokens")
      .get();

    if (tokensSnap.empty) {
      logger.info(`Aucun token FCM pour l'utilisateur ${userId}.`);
      return;
    }

    const tokens = tokensSnap.docs.map((d) => d.data().token as string);

    // Build FCM message
    const chatId = (data.chat_id as string) || "";
    const message = {
      notification: { title, body },
      data: {
        property_id: propertyId,
        notification_id: event.params.notifId,
        chat_id: chatId,
        type: notifType,
      },
      webpush: {
        fcmOptions: {
          link: chatId
            ? `/dashboard?open_chat=${chatId}`
            : propertyId
              ? `/?property=${propertyId}`
              : "/",
        },
        notification: {
          icon: "/favicon-192x192.png",
          badge: "/favicon-192x192.png",
          vibrate: [100, 50, 100] as unknown as number[],
        },
      },
    };

    const messaging = getMessaging();

    // Send to each token
    const results = await Promise.allSettled(
      tokens.map((token) => messaging.send({ ...message, token }))
    );

    // Clean up invalid tokens
    const invalidTokens: string[] = [];
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        const errorCode = (result.reason as { code?: string })?.code || "";
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      const batch = db.batch();
      for (const token of invalidTokens) {
        const tokenDoc = tokensSnap.docs.find((d) => d.data().token === token);
        if (tokenDoc) batch.delete(tokenDoc.ref);
      }
      await batch.commit();
      logger.info(
        `Nettoyé ${invalidTokens.length} token(s) FCM invalide(s) pour ${userId}.`
      );
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    logger.info(
      `Push envoyé à ${userId}: ${sent}/${tokens.length} token(s) atteint(s).`
    );
  }
);
