"use strict";
/**
 * HOMECI — Cloud Functions
 *
 * autoResetPropertyStatus :
 *   Tourne toutes les heures via Cloud Scheduler.
 *   Vérifie les visites "completed" dont la date de visite + 3 jours est dépassée.
 *   Si le propriétaire n'a pas mis à jour le statut du bien → remet en "published".
 *   Notifie le propriétaire que le bien a été automatiquement remis en disponible.
 */
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoResetPropertyStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const DELAY_DAYS = 3;
/**
 * Scheduled: toutes les heures
 * Région: europe-west1 (même que le projet)
 */
exports.autoResetPropertyStatus = functions
    .region("europe-west1")
    .pubsub.schedule("every 1 hours")
    .timeZone("Africa/Abidjan")
    .onRun(async () => {
    var _a, _b;
    const now = new Date();
    const cutoff = new Date(now.getTime() - DELAY_DAYS * 24 * 60 * 60 * 1000);
    // 1. Trouver toutes les visites "completed"
    const visitsSnap = await db
        .collection("visits")
        .where("status", "==", "completed")
        .get();
    if (visitsSnap.empty) {
        functions.logger.info("Aucune visite complétée à vérifier.");
        return null;
    }
    // 2. Grouper par property_id et trouver la date de visite
    const propertyVisits = new Map();
    for (const doc of visitsSnap.docs) {
        const data = doc.data();
        const propertyId = data.property_id;
        const preferredDate = data.preferred_date;
        const updatedAt = ((_b = (_a = data.updated_at) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(preferredDate);
        // On prend la date la plus récente entre preferred_date et updated_at
        const visitDate = new Date(Math.max(new Date(preferredDate).getTime(), updatedAt.getTime()));
        // Garder la visite la plus récente par propriété
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
        // Le délai de 3 jours est-il dépassé ?
        if (info.visitDate > cutoff)
            continue;
        // Vérifier le statut actuel du bien
        const propDoc = await db.collection("properties").doc(propertyId).get();
        if (!propDoc.exists)
            continue;
        const propData = propDoc.data();
        if (!propData)
            continue;
        // Si le bien est déjà loué, vendu, ou en pending → ne rien faire
        // On ne reset que les biens encore "published" (le propriétaire n'a rien fait)
        if (propData.status !== "published")
            continue;
        // 4. Remettre en published (il l'est déjà) mais marquer comme auto-reset
        //    et remettre les visites completed en "rejected" pour libérer le bien
        const batch = db.batch();
        // Rejeter les visites completed de cette propriété pour débloquer
        const completedVisits = visitsSnap.docs.filter((d) => d.data().property_id === propertyId &&
            d.data().status === "completed");
        for (const visitDoc of completedVisits) {
            batch.update(visitDoc.ref, {
                status: "rejected",
                owner_notes: "Délai de 3 jours dépassé — visite expirée automatiquement.",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Marquer le bien comme auto-reset (pour traçabilité)
        batch.update(propDoc.ref, {
            auto_reset_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Notifier le propriétaire
        batch.set(db.collection("notifications").doc(), {
            user_id: info.ownerId,
            type: "system",
            title: "⏰ Délai de mise à jour expiré",
            message: `Le délai de 3 jours pour mettre à jour le statut de "${info.propertyTitle}" est expiré. Le bien a été automatiquement remis en disponible.`,
            property_id: propertyId,
            read: false,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
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
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        resetCount++;
        functions.logger.info(`Auto-reset: "${info.propertyTitle}" (${propertyId}) — ` +
            `${completedVisits.length} visite(s) expirée(s), propriétaire ${info.ownerId} notifié.`);
    }
    functions.logger.info(`Auto-reset terminé: ${resetCount} bien(s) remis en disponible.`);
    return null;
});
//# sourceMappingURL=index.js.map