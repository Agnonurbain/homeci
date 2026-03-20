/**
 * HOMECI — Cloud Functions (v2)
 *
 * autoResetPropertyStatus :
 *   Tourne toutes les heures via Cloud Scheduler.
 *   Vérifie les visites "completed" dont la date de visite + 3 jours est dépassée.
 *
 * sendPushNotification :
 *   Déclenché quand une notification est créée dans Firestore.
 *   Envoie un push FCM à tous les tokens du destinataire.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";

initializeApp();

const DELAY_DAYS = 3;

export const autoResetPropertyStatus = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const cutoff = new Date(now.getTime() - DELAY_DAYS * 24 * 60 * 60 * 1000);

    // 1. Trouver toutes les visites "completed"
    const visitsSnap = await db
      .collection("visits")
      .where("status", "==", "completed")
      .get();

    if (visitsSnap.empty) {
      logger.info("Aucune visite complétée à vérifier.");
      return;
    }

    // 2. Grouper par property_id et trouver la date de visite
    const propertyVisits = new Map<
      string,
      { visitDate: Date; ownerId: string; propertyTitle: string }
    >();

    for (const doc of visitsSnap.docs) {
      const data = doc.data();
      const propertyId = data.property_id as string;
      const preferredDate = data.preferred_date as string;
      const updatedAt = data.updated_at?.toDate?.() || new Date(preferredDate);

      const visitDate = new Date(
        Math.max(new Date(preferredDate).getTime(), updatedAt.getTime())
      );

      const existing = propertyVisits.get(propertyId);
      if (!existing || visitDate > existing.visitDate) {
        propertyVisits.set(propertyId, {
          visitDate,
          ownerId: data.owner_id as string,
          propertyTitle: (data.property_title as string) || "Bien immobilier",
        });
      }
    }

    // 3. Pour chaque propriété, vérifier si le délai est dépassé
    let resetCount = 0;

    for (const [propertyId, info] of propertyVisits) {
      if (info.visitDate > cutoff) continue;

      const propDoc = await db.collection("properties").doc(propertyId).get();
      if (!propDoc.exists) continue;

      const propData = propDoc.data();
      if (!propData) continue;

      // Ne reset que les biens encore "published"
      if (propData.status !== "published") continue;

      const batch = db.batch();

      // Rejeter les visites completed expirées
      const completedVisits = visitsSnap.docs.filter(
        (d) =>
          d.data().property_id === propertyId &&
          d.data().status === "completed"
      );

      for (const visitDoc of completedVisits) {
        batch.update(visitDoc.ref, {
          status: "rejected",
          owner_notes:
            "Délai de 3 jours dépassé — visite expirée automatiquement.",
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      // Marquer le bien comme auto-reset
      batch.update(propDoc.ref, {
        auto_reset_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

      // Notifier le propriétaire
      batch.set(db.collection("notifications").doc(), {
        user_id: info.ownerId,
        type: "system",
        title: "⏰ Délai de mise à jour expiré",
        message: `Le délai de 3 jours pour mettre à jour le statut de "${info.propertyTitle}" est expiré. Le bien a été automatiquement remis en disponible.`,
        property_id: propertyId,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });

      // Notifier les locataires concernés
      for (const visitDoc of completedVisits) {
        const vData = visitDoc.data();
        batch.set(db.collection("notifications").doc(), {
          user_id: vData.tenant_id,
          type: "system",
          title: "Bien remis en disponible",
          message: `Le bien "${info.propertyTitle}" est à nouveau disponible. Vous pouvez refaire une demande de visite si vous êtes toujours intéressé.`,
          property_id: propertyId,
          read: false,
          created_at: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      resetCount++;

      logger.info(
        `Auto-reset: "${info.propertyTitle}" (${propertyId}) — ` +
          `${completedVisits.length} visite(s) expirée(s).`
      );
    }

    logger.info(
      `Auto-reset terminé: ${resetCount} bien(s) remis en disponible.`
    );
  }
);

/**
 * sendPushNotification
 * Déclenché automatiquement quand un document est créé dans /notifications/{notifId}.
 * Récupère les tokens FCM du destinataire et envoie un push.
 */
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

    const db = getFirestore();

    // Récupérer tous les tokens FCM du destinataire
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

    // Construire le message FCM
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        property_id: propertyId,
        notification_id: event.params.notifId,
      },
      webpush: {
        fcmOptions: {
          link: propertyId ? `/?property=${propertyId}` : "/",
        },
        notification: {
          icon: "/favicon-192x192.png",
          badge: "/favicon-192x192.png",
          vibrate: [100, 50, 100] as unknown as number[],
        },
      },
    };

    const messaging = getMessaging();

    // Envoyer à chaque token
    const results = await Promise.allSettled(
      tokens.map((token) =>
        messaging.send({ ...message, token })
      )
    );

    // Nettoyer les tokens expirés/invalides
    const invalidTokens: string[] = [];
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        const errorCode = (result.reason as any)?.code || "";
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Supprimer les tokens invalides de Firestore
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
