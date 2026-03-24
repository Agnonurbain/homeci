import { useState, useEffect, useRef } from 'react';
import { Send, Shield, Info, Loader as LoaderIcon, X } from 'lucide-react';
import { chatService, type ChatMessage } from '../services/chatService';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface Props {
  chatId: string;
  currentUserId: string;
  otherUserName: string;
  otherUserRole: 'Propriétaire' | 'Agent' | 'Locataire' | 'Acheteur';
  onClose: () => void;
}

export default function ChatBox({ chatId, currentUserId, otherUserName, otherUserRole, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = chatService.subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await chatService.sendMessage(chatId, currentUserId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="shrink-0 relative z-10" style={{ background: `linear-gradient(135deg, ${HColors.night}, #1A0E00)` }}>
          <KenteLine />
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: HAlpha.gold20, color: HColors.gold, border: `1px solid ${HAlpha.gold50}` }}>
                {otherUserName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {otherUserName}
                </h3>
                <p className="text-xs" style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>
                  {otherUserRole}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Info Bandeau Sécurité */}
        <div className="shrink-0 p-2.5 flex items-start gap-2 text-xs"
          style={{ background: HAlpha.orange10, color: HColors.orangeCI, borderBottom: `1px solid ${HAlpha.orange25}`, fontFamily: 'var(--font-nunito)' }}>
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Par mesure de sécurité, la plateforme filtre automatiquement les numéros de téléphone et emails. 
            Aucune transaction financière ne doit se faire en dehors du site.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8f9fa' }}>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderIcon className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <Info className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'var(--font-nunito)' }}>
                Envoyez le premier message.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              const showTail = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] relative px-3 py-2 ${
                    isMine 
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-l-2xl rounded-tr-2xl' 
                      : 'bg-white text-gray-800 rounded-r-2xl rounded-tl-2xl shadow-sm border border-gray-100'
                    } ${!showTail && isMine ? 'rounded-br-2xl' : ''} ${!showTail && !isMine ? 'rounded-bl-2xl' : ''}`}
                    style={{ fontFamily: 'var(--font-nunito)', fontSize: '0.9rem' }}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className={`text-[0.65rem] text-right mt-1 opacity-70 ${isMine ? 'text-white' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="shrink-0 p-3 bg-white" style={{ borderTop: '1px solid #eaeaea' }}>
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-1 border border-gray-200">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none p-3 text-sm focus:outline-none placeholder-gray-400 text-gray-800"
              style={{ fontFamily: 'var(--font-nunito)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="shrink-0 w-11 h-11 mb-0.5 mr-0.5 rounded-full flex items-center justify-center transition-all focus:outline-none disabled:opacity-50"
              style={{ background: newMessage.trim() ? 'linear-gradient(135deg,#FF6B00,#D4A017)' : '#e5e7eb', color: newMessage.trim() ? 'white' : '#9ca3af' }}>
              {sending ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
