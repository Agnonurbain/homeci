import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { chatService } from '../../services/chatService';

// Mock du chatService
vi.mock('../../services/chatService', () => ({
  chatService: {
    subscribeToMessages: vi.fn(),
    sendMessage: vi.fn(),
    markMessageAsRead: vi.fn(),
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
    expect(chatService.subscribeToMessages).toHaveBeenCalledWith(mockChatId, expect.any(Function));
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
});
