import { useState, useEffect, useRef } from 'react';
import { chatService, type ChatMessage } from '../services/chatService';

interface UseChatProps {
  chatId: string;
  currentUserId: string;
}

export function useChat({ chatId, currentUserId }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

  // Send message
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

  return {
    messages,
    loading,
    sending,
    error,
    setError,
    sendMessage,
    messagesEndRef
  };
}
