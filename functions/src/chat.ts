/**
 * HOMECI — Chat functions
 * onNewChatMessage: triggered when a message is created in a chat.
 * Creates a "new_message" notification for the recipient.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, logger } from "./firebase-admin";

export const onNewChatMessage = onDocumentCreated(
  {
    document: "chats/{chatId}/messages/{messageId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const chatId = event.params.chatId;
    const senderId = data.sender_id;
    const db = getFirestore();

    // Get the chat to identify the recipient
    const chatSnap = await db.collection("chats").doc(chatId).get();
    if (!chatSnap.exists) return;

    const chat = chatSnap.data()!;
    const recipientId =
      senderId === chat.tenant_id ? chat.owner_id : chat.tenant_id;

    if (!recipientId) return;

    // Check recipient preferences
    const recipientSnap = await db.collection("users").doc(recipientId).get();
    if (recipientSnap.data()?.notification_prefs?.visits === false) return;

    // Get sender name
    const senderSnap = await db.collection("users").doc(senderId).get();
    const senderName = senderSnap.data()?.full_name || "Quelqu'un";

    const content = String(data.content || "").slice(0, 100);

    await db.collection("notifications").add({
      user_id: recipientId,
      type: "new_message",
      title: `Message de ${senderName}`,
      message: content,
      property_id: chat.property_id || null,
      read: false,
      created_at: FieldValue.serverTimestamp(),
    });

    logger.info(
      `Notification new_message créée pour ${recipientId} (chat ${chatId}).`
    );
  }
);
