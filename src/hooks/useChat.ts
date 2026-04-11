import { useState, useEffect, useRef } from 'react';
import { chatService, type ChatMessage } from '../services/chatService';

interface UseChatProps {
  chatId: string;
  currentUserId: string;
}

interface UploadState {
  fileName: string;
  progress: number; // 0-100
}

export function useChat({ chatId, currentUserId }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState<UploadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    setLoading(true);
    const unsub = chatService.subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll on new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Logic "Mark as Read" for messages not sent by me
      msgs.forEach(msg => {
        if (!msg.read && msg.sender_id !== currentUserId && msg.id) {
          chatService.markMessageAsRead(chatId, msg.id);
        }
      });
    });

    return () => unsub();
  }, [chatId, currentUserId]);

  // Send message (text only)
  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return false;

    setSending(true);
    setError(null);
    try {
      await chatService.sendMessage(chatId, currentUserId, content);
      return true;
    } catch (err: any) {
      console.error('[useChat] Failed to send:', err);
      setError("Impossible d'envoyer le message. Vérifiez votre connexion.");
      return false;
    } finally {
      setSending(false);
    }
  };

  // Send message with attachment
  const sendMessageWithAttachment = async (
    content: string,
    file: File
  ) => {
    if (sending || uploading) return false;

    setSending(true);
    setError(null);
    setUploading({ fileName: file.name, progress: 0 });

    try {
      // 1. Upload the file
      const { url, type, name } = await chatService.uploadChatAttachment(
        file,
        chatId
      );

      setUploading({ fileName: file.name, progress: 100 });

      // 2. Send the message with attachment metadata
      await chatService.sendMessage(chatId, currentUserId, content, {
        attachmentUrl: url,
        attachmentType: type,
        attachmentName: name,
      });

      return true;
    } catch (err: any) {
      console.error('[useChat] Failed to send with attachment:', err);
      setError(
        "Impossible d'envoyer le fichier. Vérifiez le format (image/PDF, < 10 MB) et votre connexion."
      );
      return false;
    } finally {
      setSending(false);
      setUploading(null);
    }
  };

  return {
    messages,
    loading,
    sending,
    uploading,
    error,
    setError,
    sendMessage,
    sendMessageWithAttachment,
    messagesEndRef,
  };
}
