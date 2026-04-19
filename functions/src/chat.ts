/**
 * HOMECI — Chat functions
 * onNewChatMessage: triggered when a message is created in a chat.
 * Creates a "new_message" notification for the recipient.
 * Implements offline detection: if recipient is not active in last 30s, send push notification directly.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, logger } from "./firebase-admin";
import { sendPushToUser } from "./pushHelper";

// Threshold for online/offline detection (30 seconds)
const ONLINE_THRESHOLD_MS = 30_000;

export const onNewChatMessage = onDocumentCreated(
  {
    document: "chats/{chatId}/messages/{messageId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const chatId = event.params.chatId;
    const senderId = data.sender_id as string;
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
    if (!recipientSnap.exists) return;

    const recipientData = recipientSnap.data()!;
    const notifPrefs = recipientData.notification_prefs as Record<string, unknown> | undefined;
    if (notifPrefs?.messages === false || notifPrefs?.visits === false) return;

    // Determine if recipient is online (active in last 30 seconds)
    const lastSeen = recipientData.last_seen as { seconds?: number } | undefined;
    const now = Date.now();
    const lastSeenMs = lastSeen?.seconds ? lastSeen.seconds * 1000 : 0;
    const isOnline = (now - lastSeenMs) < ONLINE_THRESHOLD_MS;

    // Get sender name
    const senderSnap = await db.collection("users").doc(senderId).get();
    const senderName = senderSnap.data()?.full_name || "Quelqu'un";

    const content = String(data.content || "").slice(0, 100);
    const attachmentType = data.attachment_type as string | undefined;
    const attachmentName = data.attachment_name as string | undefined;

    // Build notification message
    let notifTitle = `Message de ${senderName}`;
    let notifMessage = content;

    if (attachmentType === "image" && !content) {
      notifTitle = `Image de ${senderName}`;
      notifMessage = attachmentName ? `📷 ${attachmentName}` : "📷 Une image a été envoyée";
    } else if (attachmentType === "document" && !content) {
      notifTitle = `Document de ${senderName}`;
      notifMessage = attachmentName ? `📄 ${attachmentName}` : "📄 Un document a été envoyé";
    } else if (attachmentType) {
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
      created_at: FieldValue.serverTimestamp(),
      delivery_mode: isOnline ? "instant" : "push",
      recipient_online: isOnline,
      message_id: event.params.messageId,
      push_sent: !isOnline,
    };

    const notifRef = await db.collection("notifications").add(notificationData);

    logger.info(
      `Notification new_message créée pour ${recipientId} (chat ${chatId}, online: ${isOnline}).`
    );

    // If recipient is offline, send push notification directly
    if (!isOnline) {
      try {
        const link = chat.property_id
          ? `/?property=${chat.property_id as string}&open_chat=${chatId}`
          : `/dashboard?open_chat=${chatId}`;

        await sendPushToUser(recipientId, notifTitle, notifMessage, {
          property_id: (chat.property_id as string) || "",
          notification_id: notifRef.id,
          chat_id: chatId,
          type: "new_message",
        }, link);

        logger.info(`Push notification envoyée à ${recipientId} (offline).`);
      } catch (err) {
        logger.error(`Erreur envoi push à ${recipientId}:`, err as Error);
      }
    }
  }
);
