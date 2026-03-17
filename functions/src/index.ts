/**
 * HOMECI — Cloud Functions (v2)
 *
 * autoResetPropertyStatus :
 *   Tourne toutes les heures via Cloud Scheduler.
 *   Vérifie les visites "completed" dont la date de visite + 3 jours est dépassée.
 *   Si le propriétaire n'a pas mis à jour le statut du bien → libère les visites.
 *   Notifie le propriétaire et les locataires concernés.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
