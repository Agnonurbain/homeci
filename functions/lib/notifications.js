"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
/**
 * HOMECI — Notification functions
 * sendPushNotification: triggered when a notification doc is created in Firestore.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_admin_1 = require("./firebase-admin");
const pushHelper_1 = require("./pushHelper");
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
    // Check if push was already sent (for offline chat messages)
    const pushSent = data.push_sent;
    if (pushSent === true) {
        firebase_admin_1.logger.info("Push déjà envoyé pour cette notification (chat offline).");
        return;
    }
    const db = (0, firebase_admin_1.getFirestore)();
    // Check notification preferences
    const userSnap = await db.collection("users").doc(userId).get();
    const prefs = (_b = userSnap.data()) === null || _b === void 0 ? void 0 : _b.notification_prefs;
    if (prefs) {
        const isVisit = notifType.startsWith("visit_");
        const isMessage = notifType === "new_message";
        const isCert = notifType.startsWith("notaire_");
        const isSystem = notifType === "system";
        if ((isVisit && prefs.visits === false) ||
            (isMessage && prefs.messages === false) ||
            (isCert && prefs.certifications === false) ||
            (isSystem && prefs.system === false)) {
            firebase_admin_1.logger.info(`Push ignoré pour ${userId}: notification ${notifType} désactivée.`);
            return;
        }
    }
    const chatId = data.chat_id || "";
    const link = chatId
        ? `/dashboard?open_chat=${chatId}`
        : propertyId
            ? `/?property=${propertyId}`
            : "/";
    await (0, pushHelper_1.sendPushToUser)(userId, title, body, {
        property_id: propertyId,
        notification_id: event.params.notifId,
        chat_id: chatId,
        type: notifType,
    }, link);
});
//# sourceMappingURL=notifications.js.map