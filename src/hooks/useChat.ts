import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService, type ChatMessage, MESSAGES_PER_PAGE } from '../services/chatService';

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState<UploadState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatMessage[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages (real-time, limited to MESSAGES_PER_PAGE)
  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    setMessages([]);

    const unsub = chatService.subscribeToMessages(chatId, (msgs) => {
      setMessages(prevMsgs => {
        // Deduplicate and merge: new real-time messages may overlap with loaded history
        const existingIds = new Set(prevMsgs.map(m => m.id));
        const newMsgs = msgs.filter(m => !existingIds.has(m.id));
        const merged = [...prevMsgs, ...newMsgs].sort((a, b) => {
          const ta = a.created_at?.toMillis?.() ?? 0;
          const tb = b.created_at?.toMillis?.() ?? 0;
          return ta - tb;
        });
        return merged;
      });
      setLoading(false);

      // Auto-scroll on new message (only if user is near bottom)
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          if (isNearBottom || msgs.length <= 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
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

  // Load older messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    setError(null);

    try {
      const oldestMessage = messages[0]; // First message = oldest (ascending order)
      const olderMsgs = await chatService.getMessagesBefore(chatId, oldestMessage);

      if (olderMsgs.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prevMsgs => {
          // Prepend older messages, deduplicate
          const existingIds = new Set(prevMsgs.map(m => m.id));
          const newOlder = olderMsgs.filter(m => !existingIds.has(m.id));
          return [...newOlder, ...prevMsgs].sort((a, b) => {
            const ta = a.created_at?.toMillis?.() ?? 0;
            const tb = b.created_at?.toMillis?.() ?? 0;
            return ta - tb;
          });
        });

        // If we got fewer messages than the page size, there are no more to load
        if (olderMsgs.length < MESSAGES_PER_PAGE) {
          setHasMore(false);
        }
      }
    } catch (err: any) {
      console.error('[useChat] Failed to load more messages:', err);
      setError("Impossible de charger l'historique.");
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, messages, loadingMore, hasMore]);

  // Search messages in history
  const searchMessages = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults(null);
      setSearchTerm('');
      return;
    }

    setSearching(true);
    setSearchTerm(term);
    setError(null);

    try {
      const results = await chatService.searchMessages(chatId, term);
      setSearchResults(results);
    } catch (err: any) {
      console.error('[useChat] Search failed:', err);
      setError("Impossible de rechercher dans l'historique.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [chatId]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchTerm('');
  }, []);

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
    loadingMore,
    hasMore,
    sending,
    uploading,
    error,
    setError,
    sendMessage,
    sendMessageWithAttachment,
    messagesEndRef,
    messagesContainerRef,
    loadMoreMessages,
    // Search
    searching,
    searchResults,
    searchTerm,
    searchMessages,
    clearSearch,
  };
}
