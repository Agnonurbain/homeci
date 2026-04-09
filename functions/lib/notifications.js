"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
/**
 * HOMECI — Notification functions
 * sendPushNotification: triggered when a notification doc is created in Firestore.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_admin_1 = require("./firebase-admin");
exports.sendPushNotification = (0, firestore_1.onDocumentCreated)({
    document: "notifications/{notifId}",
    region: "europe-west1",
}, async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const userId = data.user_id;
    const title = data.title || "HOMECI";
    const body = data.message || "";
    const propertyId = data.property_id || "";
    if (!userId) {
        firebase_admin_1.logger.warn("sendPushNotification: pas de user_id dans la notification.");
        return;
    }
    const notifType = data.type || "";
    const db = (0, firebase_admin_1.getFirestore)();
    // Check notification preferences
    const userSnap = await db.collection("users").doc(userId).get();
    const prefs = (_b = userSnap.data()) === null || _b === void 0 ? void 0 : _b.notification_prefs;
    if (prefs) {
        const isVisit = notifType.startsWith("visit_") || notifType === "new_message";
        const isCert = notifType.startsWith("notaire_");
        const isSystem = notifType === "system";
        if ((isVisit && prefs.visits === false) ||
            (isCert && prefs.certifications === false) ||
            (isSystem && prefs.system === false)) {
            firebase_admin_1.logger.info(`Push ignoré pour ${userId}: notification ${notifType} désactivée.`);
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
        firebase_admin_1.logger.info(`Aucun token FCM pour l'utilisateur ${userId}.`);
        return;
    }
    const tokens = tokensSnap.docs.map((d) => d.data().token);
    // Build FCM message
    const message = {
        notification: { title, body },
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
                vibrate: [100, 50, 100],
            },
        },
    };
    const messaging = (0, firebase_admin_1.getMessaging)();
    // Send to each token
    const results = await Promise.allSettled(tokens.map((token) => messaging.send({ ...message, token })));
    // Clean up invalid tokens
    const invalidTokens = [];
    results.forEach((result, idx) => {
        var _a;
        if (result.status === "rejected") {
            const errorCode = ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.code) || "";
            if (errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered") {
                invalidTokens.push(tokens[idx]);
            }
        }
    });
    if (invalidTokens.length > 0) {
        const batch = db.batch();
        for (const token of invalidTokens) {
            const tokenDoc = tokensSnap.docs.find((d) => d.data().token === token);
            if (tokenDoc)
                batch.delete(tokenDoc.ref);
        }
        await batch.commit();
        firebase_admin_1.logger.info(`Nettoyé ${invalidTokens.length} token(s) FCM invalide(s) pour ${userId}.`);
    }
    const sent = results.filter((r) => r.status === "fulfilled").length;
    firebase_admin_1.logger.info(`Push envoyé à ${userId}: ${sent}/${tokens.length} token(s) atteint(s).`);
});
//# sourceMappingURL=notifications.js.map