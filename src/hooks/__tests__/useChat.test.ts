import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { chatService } from '../../services/chatService';

// Mock du chatService
vi.mock('../../services/chatService', () => ({
  MESSAGES_PER_PAGE: 30,
  chatService: {
    subscribeToMessages: vi.fn(),
    sendMessage: vi.fn(),
    markMessageAsRead: vi.fn(),
    getMessagesBefore: vi.fn(),
    searchMessages: vi.fn(),
  }
}));

describe('useChat', () => {
  const mockChatId = 'chat-123';
  const mockCurrentUserId = 'user-me';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialise avec un état de chargement et appelle subscribeToMessages', async () => {
    vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {}); // unsub function

    const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

    expect(result.current.loading).toBe(true);
    expect(chatService.subscribeToMessages).toHaveBeenCalled();
    const callArgs = (chatService.subscribeToMessages as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    expect(callArgs[0]).toBe(mockChatId);
    expect(typeof callArgs[1]).toBe('function');
    // pageSize uses default value (MESSAGES_PER_PAGE = 30) so it's not passed explicitly
  });

  it('met à jour les messages et arrête le chargement lors de la réception', async () => {
    let snapshotCallback: any;
    vi.mocked(chatService.subscribeToMessages).mockImplementation((_id: string, cb: any) => {
      snapshotCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

    const mockMsgs = [
      { id: '1', content: 'Hello', sender_id: 'other', read: false, created_at: null }
    ];

    act(() => {
      snapshotCallback(mockMsgs);
    });

    expect(result.current.messages).toEqual(mockMsgs);
    expect(result.current.loading).toBe(false);
  });

  it('envoie un message avec succès', async () => {
    vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});
    vi.mocked(chatService.sendMessage).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.sendMessage('Hello world');
    });

    expect(success).toBe(true);
    expect(chatService.sendMessage).toHaveBeenCalledWith(mockChatId, mockCurrentUserId, 'Hello world');
    expect(result.current.error).toBeNull();
  });

  it('gère les erreurs d\'envoi', async () => {
    vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});
    vi.mocked(chatService.sendMessage).mockRejectedValue(new Error('Network error') as any);

    const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.sendMessage('Fail');
    });

    expect(success).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('marque les messages des autres comme lus automatiquement', async () => {
    let snapshotCallback: any;
    vi.mocked(chatService.subscribeToMessages).mockImplementation((_id: string, cb: any) => {
      snapshotCallback = cb;
      return () => {};
    });

    renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

    const mockMsgs = [
      { id: 'msg-1', content: 'Hey', sender_id: 'other', read: false, created_at: null },
      { id: 'msg-2', content: 'Self', sender_id: mockCurrentUserId, read: false, created_at: null }
    ];

    act(() => {
      snapshotCallback(mockMsgs);
    });

    expect(chatService.markMessageAsRead).toHaveBeenCalledWith(mockChatId, 'msg-1');
    expect(chatService.markMessageAsRead).not.toHaveBeenCalledWith(mockChatId, 'msg-2');
  });

  describe('loadMoreMessages', () => {
    it('charge des messages plus anciens et les prépend', async () => {
      let snapshotCallback: any;
      vi.mocked(chatService.subscribeToMessages).mockImplementation((_id: string, cb: any) => {
        snapshotCallback = cb;
        return () => {};
      });

      vi.mocked(chatService.getMessagesBefore).mockResolvedValue([
        { id: 'old-1', chat_id: 'chat-123', content: 'Older msg', sender_id: 'other', read: false, created_at: null },
      ]);

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      // Simulate initial messages loaded
      act(() => {
        snapshotCallback([
          { id: 'new-1', content: 'Recent msg', sender_id: 'other', read: false, created_at: null },
        ]);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.loadingMore).toBe(false);

      // Load more
      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe('old-1'); // older first
      expect(result.current.loadingMore).toBe(false);
      expect(chatService.getMessagesBefore).toHaveBeenCalled();
    });

    it('définit hasMore à false quand aucun message plus ancien', async () => {
      let snapshotCallback: any;
      vi.mocked(chatService.subscribeToMessages).mockImplementation((_id: string, cb: any) => {
        snapshotCallback = cb;
        return () => {};
      });

      vi.mocked(chatService.getMessagesBefore).mockResolvedValue([]);

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      act(() => {
        snapshotCallback([
          { id: 'new-1', content: 'Only msg', sender_id: 'other', read: false, created_at: null },
        ]);
      });

      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('gère les erreurs de chargement', async () => {
      let snapshotCallback: any;
      vi.mocked(chatService.subscribeToMessages).mockImplementation((_id: string, cb: any) => {
        snapshotCallback = cb;
        return () => {};
      });

      vi.mocked(chatService.getMessagesBefore).mockRejectedValue(new Error('Network error') as any);

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      act(() => {
        snapshotCallback([
          { id: 'new-1', content: 'Only msg', sender_id: 'other', read: false, created_at: null },
        ]);
      });

      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.loadingMore).toBe(false);
    });

    it('ne fait rien si aucun message chargé', async () => {
      vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      await act(async () => {
        await result.current.loadMoreMessages();
      });

      expect(chatService.getMessagesBefore).not.toHaveBeenCalled();
    });
  });

  describe('searchMessages', () => {
    it('recherche des messages et stocke les résultats', async () => {
      vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(chatService.searchMessages).mockResolvedValue([
        { id: 's1', chat_id: 'chat-123', content: 'Hello world', sender_id: 'other', read: false, created_at: null },
      ]);

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      await act(async () => {
        await result.current.searchMessages('hello');
      });

      expect(result.current.searching).toBe(false);
      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchTerm).toBe('hello');
      expect(chatService.searchMessages).toHaveBeenCalledWith(mockChatId, 'hello');
    });

    it('clear les résultats de recherche', async () => {
      vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      // Set search results via searchMessages
      vi.mocked(chatService.searchMessages).mockResolvedValue([
        { id: 's1', chat_id: 'chat-123', content: 'test', sender_id: 'other', read: false, created_at: null },
      ]);

      await act(async () => {
        await result.current.searchMessages('test');
      });

      expect(result.current.searchResults).not.toBeNull();
      expect(result.current.searchTerm).toBe('test');

      // Clear
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchResults).toBeNull();
      expect(result.current.searchTerm).toBe('');
    });

    it('ne recherche pas si le terme est vide', async () => {
      vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      await act(async () => {
        await result.current.searchMessages('');
      });

      expect(chatService.searchMessages).not.toHaveBeenCalled();
      expect(result.current.searchResults).toBeNull();
    });

    it('gère les erreurs de recherche', async () => {
      vi.mocked(chatService.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(chatService.searchMessages).mockRejectedValue(new Error('Search error') as any);

      const { result } = renderHook(() => useChat({ chatId: mockChatId, currentUserId: mockCurrentUserId }));

      await act(async () => {
        await result.current.searchMessages('test');
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.searching).toBe(false);
    });
  });
});
