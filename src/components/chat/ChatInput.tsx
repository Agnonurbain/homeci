import { Send, Loader as LoaderIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => Promise<boolean>;
  sending: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function ChatInput({ onSend, sending, error, onClearError }: ChatInputProps) {
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(onClearError, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    const success = await onSend(newMessage);
    if (success) setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shrink-0 p-3 bg-white" style={{ borderTop: '1px solid #eaeaea' }}>
      {error && (
        <div className="mb-2 px-3 py-2 rounded-xl text-[0.75rem] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          {error}
        </div>
      )}
      <div className="relative group flex items-end gap-2 bg-gray-50 rounded-2xl p-1 border border-transparent transition-all focus-within:border-amber-200 focus-within:bg-white focus-within:shadow-sm">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Répondre..."
          className="flex-1 max-h-32 min-h-[48px] bg-transparent resize-none p-3.5 text-sm focus:outline-none placeholder-gray-400 text-gray-800"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="shrink-0 w-12 h-12 mb-1 mr-1 rounded-full flex items-center justify-center transition-all focus:outline-none disabled:opacity-40"
          style={{ 
            background: newMessage.trim() ? 'linear-gradient(135deg,#FF6B00,#D4A017)' : '#f3f4f6', 
            color: newMessage.trim() ? 'white' : '#9ca3af',
            boxShadow: newMessage.trim() ? '0 4px 12px rgba(255,107,0,0.2)' : 'none'
          }}>
          {sending ? (
            <LoaderIcon className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
        </button>
      </div>
    </form>
  );
}
