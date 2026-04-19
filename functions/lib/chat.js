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
const pushHelper_1 = require("./pushHelper");
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
        notifMessage = content;
    }
    // Create Firestore notification document
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
        push_sent: !isOnline,
    };
    const notifRef = await db.collection("notifications").add(notificationData);
    firebase_admin_1.logger.info(`Notification new_message créée pour ${recipientId} (chat ${chatId}, online: ${isOnline}).`);
    // If recipient is offline, send push notification directly
    if (!isOnline) {
        try {
            const link = chat.property_id
                ? `/?property=${chat.property_id}&open_chat=${chatId}`
                : `/dashboard?open_chat=${chatId}`;
            await (0, pushHelper_1.sendPushToUser)(recipientId, notifTitle, notifMessage, {
                property_id: chat.property_id || "",
                notification_id: notifRef.id,
                chat_id: chatId,
                type: "new_message",
            }, link);
            firebase_admin_1.logger.info(`Push notification envoyée à ${recipientId} (offline).`);
        }
        catch (err) {
            firebase_admin_1.logger.error(`Erreur envoi push à ${recipientId}:`, err);
        }
    }
});
//# sourceMappingURL=chat.js.map