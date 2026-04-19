"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
/**
 * HOMECI — Shared push notification helper
 * Sends FCM push to a user and cleans up invalid tokens.
 */
const firebase_admin_1 = require("./firebase-admin");
async function sendPushToUser(userId, title, body, data, link) {
    const db = (0, firebase_admin_1.getFirestore)();
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
    const message = {
        notification: { title, body },
        data,
        webpush: {
            fcmOptions: { link },
            notification: {
                icon: "/favicon-192x192.png",
                badge: "/favicon-192x192.png",
                vibrate: [100, 50, 100],
            },
        },
    };
    const messaging = (0, firebase_admin_1.getMessaging)();
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
}
//# sourceMappingURL=pushHelper.js.map