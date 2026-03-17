"use strict";
/**
 * HOMECI — Cloud Functions (v2)
 *
 * autoResetPropertyStatus :
 *   Tourne toutes les heures via Cloud Scheduler.
 *   Vérifie les visites "completed" dont la date de visite + 3 jours est dépassée.
 *   Si le propriétaire n'a pas mis à jour le statut du bien → libère les visites.
 *   Notifie le propriétaire et les locataires concernés.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoResetPropertyStatus = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
(0, app_1.initializeApp)();
const DELAY_DAYS = 3;
exports.autoResetPropertyStatus = (0, scheduler_1.onSchedule)({
    schedule: "every 1 hours",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
}, async () => {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const now = new Date();
    const cutoff = new Date(now.getTime() - DELAY_DAYS * 24 * 60 * 60 * 1000);
    // 1. Trouver toutes les visites "completed"
    const visitsSnap = await db
        .collection("visits")
        .where("status", "==", "completed")
        .get();
    if (visitsSnap.empty) {
        firebase_functions_1.logger.info("Aucune visite complétée à vérifier.");
        return;
    }
    // 2. Grouper par property_id et trouver la date de visite
    const propertyVisits = new Map();
    for (const doc of visitsSnap.docs) {
        const data = doc.data();
        const propertyId = data.property_id;
        const preferredDate = data.preferred_date;
        const updatedAt = ((_b = (_a = data.updated_at) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(preferredDate);
        const visitDate = new Date(Math.max(new Date(preferredDate).getTime(), updatedAt.getTime()));
        const existing = propertyVisits.get(propertyId);
        if (!existing || visitDate > existing.visitDate) {
            propertyVisits.set(propertyId, {
                visitDate,
                ownerId: data.owner_id,
                propertyTitle: data.property_title || "Bien immobilier",
            });
        }
    }
    // 3. Pour chaque propriété, vérifier si le délai est dépassé
    let resetCount = 0;
    for (const [propertyId, info] of propertyVisits) {
        if (info.visitDate > cutoff)
            continue;
        const propDoc = await db.collection("properties").doc(propertyId).get();
        if (!propDoc.exists)
            continue;
        const propData = propDoc.data();
        if (!propData)
            continue;
        // Ne reset que les biens encore "published"
        if (propData.status !== "published")
            continue;
        const batch = db.batch();
        // Rejeter les visites completed expirées
        const completedVisits = visitsSnap.docs.filter((d) => d.data().property_id === propertyId &&
            d.data().status === "completed");
        for (const visitDoc of completedVisits) {
            batch.update(visitDoc.ref, {
                status: "rejected",
                owner_notes: "Délai de 3 jours dépassé — visite expirée automatiquement.",
                updated_at: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        // Marquer le bien comme auto-reset
        batch.update(propDoc.ref, {
            auto_reset_at: firestore_1.FieldValue.serverTimestamp(),
            updated_at: firestore_1.FieldValue.serverTimestamp(),
        });
        // Notifier le propriétaire
        batch.set(db.collection("notifications").doc(), {
            user_id: info.ownerId,
            type: "system",
            title: "⏰ Délai de mise à jour expiré",
            message: `Le délai de 3 jours pour mettre à jour le statut de "${info.propertyTitle}" est expiré. Le bien a été automatiquement remis en disponible.`,
            property_id: propertyId,
            read: false,
            created_at: firestore_1.FieldValue.serverTimestamp(),
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
                created_at: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        resetCount++;
        firebase_functions_1.logger.info(`Auto-reset: "${info.propertyTitle}" (${propertyId}) — ` +
            `${completedVisits.length} visite(s) expirée(s).`);
    }
    firebase_functions_1.logger.info(`Auto-reset terminé: ${resetCount} bien(s) remis en disponible.`);
});
//# sourceMappingURL=index.js.map