"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewChatMessage = void 0;
/**
 * HOMECI — Chat functions
 * onNewChatMessage: triggered when a message is created in a chat.
 * Creates a "new_message" notification for the recipient.
 * Implements offline detection: if recipient is not active in last 30s, send push notification directly.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_admin_1 = require("./firebase-admin");
// Threshold for online/offline detection (30 seconds)
const ONLINE_THRESHOLD_MS = 30000;
exports.onNewChatMessage = (0, firestore_1.onDocumentCreated)({
    document: "chats/{chatId}/messages/{messageId}",
    region: "europe-west1",
}, async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const chatId = event.params.chatId;
    const senderId = data.sender_id;
    const db = (0, firebase_admin_1.getFirestore)();
    // Get the chat to identify the recipient
    const chatSnap = await db.collection("chats").doc(chatId).get();
    if (!chatSnap.exists)
        return;
    const chat = chatSnap.data();
    const recipientId = senderId === chat.tenant_id ? chat.owner_id : chat.tenant_id;
    if (!recipientId)
        return;
    // Check recipient preferences
    const recipientSnap = await db.collection("users").doc(recipientId).get();
    if (!recipientSnap.exists)
        return;
    const recipientData = recipientSnap.data();
    // Check 'messages' preference if it exists, fallback to 'visits'
    const notifPrefs = recipientData.notification_prefs;
    if ((notifPrefs === null || notifPrefs === void 0 ? void 0 : notifPrefs.messages) === false || (notifPrefs === null || notifPrefs === void 0 ? void 0 : notifPrefs.visits) === false)
        return;
    // Determine if recipient is online (active in last 30 seconds)
    const lastSeen = recipientData.last_seen;
    const now = Date.now();
    const lastSeenMs = (lastSeen === null || lastSeen === void 0 ? void 0 : lastSeen.seconds) ? lastSeen.seconds * 1000 : 0;
    const isOnline = (now - lastSeenMs) < ONLINE_THRESHOLD_MS;
    // Get sender name
    const senderSnap = await db.collection("users").doc(senderId).get();
    const senderName = ((_b = senderSnap.data()) === null || _b === void 0 ? void 0 : _b.full_name) || "Quelqu'un";
    const content = String(data.content || "").slice(0, 100);
    const attachmentType = data.attachment_type;
    const attachmentName = data.attachment_name;
    // Build notification message
    let notifTitle = `Message de ${senderName}`;
    let notifMessage = content;
    if (attachmentType === "image" && !content) {
        notifTitle = `Image de ${senderName}`;
        notifMessage = attachmentName ? `📷 ${attachmentName}` : "📷 Une image a été envoyée";
    }
    else if (attachmentType === "document" && !content) {
        notifTitle = `Document de ${senderName}`;
        notifMessage = attachmentName ? `📄 ${attachmentName}` : "📄 Un document a été envoyé";
    }
    else if (attachmentType) {
        // Both text and attachment
        notifMessage = content;
    }
    // Create Firestore notification document
    // delivery_mode: 'instant' = online user (push handled by sendPushNotification trigger)
    //                'push' = offline user (push sent directly below)
    const notificationData = {
        user_id: recipientId,
        type: "new_message",
        title: notifTitle,
        message: notifMessage,
        property_id: chat.property_id || null,
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        attachment_type: attachmentType || null,
        read: false,
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
        delivery_mode: isOnline ? "instant" : "push",
        recipient_online: isOnline,
        message_id: event.params.messageId,
        // Flag to prevent duplicate push from sendPushNotification trigger
        push_sent: !isOnline, // true = push already sent, false = trigger will handle
    };
    const notifRef = await db.collection("notifications").add(notificationData);
    firebase_admin_1.logger.info(`Notification new_message créée pour ${recipientId} (chat ${chatId}, online: ${isOnline}).`);
    // If recipient is offline, send push notification directly
    if (!isOnline) {
        try {
            await sendPushToUser(recipientId, notifTitle, notifMessage, chat.property_id, chatId, notifRef.id, db);
            firebase_admin_1.logger.info(`Push notification envoyée à ${recipientId} (offline).`);
        }
        catch (err) {
            firebase_admin_1.logger.error(`Erreur envoi push à ${recipientId}:`, err);
        }
    }
});
/**
 * Send FCM push notification to a user
 */
async function sendPushToUser(userId, title, body, propertyId, chatId, notificationId, db) {
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
            property_id: propertyId || "",
            notification_id: notificationId,
            chat_id: chatId,
            type: "new_message",
        },
        webpush: {
            fcmOptions: {
                link: propertyId ? `/?property=${propertyId}&open_chat=${chatId}` : `/dashboard?open_chat=${chatId}`,
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
}
//# sourceMappingURL=chat.js.map