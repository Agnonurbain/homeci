/**
 * HOMECI — Shared push notification helper
 * Sends FCM push to a user and cleans up invalid tokens.
 */
import { getFirestore, getMessaging, logger } from "./firebase-admin";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
  link: string
) {
  const db = getFirestore();
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

  const message = {
    notification: { title, body },
    data,
    webpush: {
      fcmOptions: { link },
      notification: {
        icon: "/favicon-192x192.png",
        badge: "/favicon-192x192.png",
        vibrate: [100, 50, 100] as unknown as number[],
      },
    },
  };

  const messaging = getMessaging();

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
