"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewChatMessage = void 0;
/**
 * HOMECI — Chat functions
 * onNewChatMessage: triggered when a message is created in a chat.
 * Creates a "new_message" notification for the recipient.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_admin_1 = require("./firebase-admin");
exports.onNewChatMessage = (0, firestore_1.onDocumentCreated)({
    document: "chats/{chatId}/messages/{messageId}",
    region: "europe-west1",
}, async (event) => {
    var _a, _b, _c, _d;
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
    if (((_c = (_b = recipientSnap.data()) === null || _b === void 0 ? void 0 : _b.notification_prefs) === null || _c === void 0 ? void 0 : _c.visits) === false)
        return;
    // Get sender name
    const senderSnap = await db.collection("users").doc(senderId).get();
    const senderName = ((_d = senderSnap.data()) === null || _d === void 0 ? void 0 : _d.full_name) || "Quelqu'un";
    const content = String(data.content || "").slice(0, 100);
    await db.collection("notifications").add({
        user_id: recipientId,
        type: "new_message",
        title: `Message de ${senderName}`,
        message: content,
        property_id: chat.property_id || null,
        read: false,
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    firebase_admin_1.logger.info(`Notification new_message créée pour ${recipientId} (chat ${chatId}).`);
});
//# sourceMappingURL=chat.js.map