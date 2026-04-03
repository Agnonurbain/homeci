import { Shield, Info, Loader as LoaderIcon, X } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';
import { useChat } from '../hooks/useChat';
import MessageBubble from './chat/MessageBubble';
import ChatInput from './chat/ChatInput';

interface Props {
  chatId: string;
  currentUserId: string;
  otherUserName: string;
  otherUserRole: 'Propriétaire' | 'Agent' | 'Locataire' | 'Acheteur';
  onClose: () => void;
}

export default function ChatBox({ chatId, currentUserId, otherUserName, otherUserRole, onClose }: Props) {
  const {
    messages,
    loading,
    sending,
    error,
    setError,
    sendMessage,
    messagesEndRef
  } = useChat({ chatId, currentUserId });

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-[600px] sm:max-w-md bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20">
        
        {/* Header - Premium Glassmorphism */}
        <div className="shrink-0 relative z-20" style={{ background: `linear-gradient(135deg, ${HColors.night}, #1A0E00)` }}>
          <KenteLine />
          <div className="px-5 py-4 flex items-center justify-between backdrop-blur-sm bg-black/10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg rotate-3 group transition-transform hover:rotate-0"
                style={{ background: HAlpha.gold15, color: HColors.gold, border: `1.5px solid ${HAlpha.gold30}` }}>
                {otherUserName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-white text-lg leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {otherUserName}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>
                    {otherUserRole}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} 
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Info Bandeau Sécurité - Updated per user request */}
        <div className="shrink-0 px-4 py-3 flex items-start gap-2.5 text-[0.7rem] leading-relaxed"
          style={{ background: HAlpha.orange08, color: HColors.orangeDark, borderBottom: `1px solid ${HAlpha.orange15}`, fontFamily: 'var(--font-nunito)' }}>
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
          <p className="font-medium">
            Pour votre sécurité, les adresses email sont automatiquement masquées. 
            Évitez toute transaction financière en dehors de la plateforme HOMECI.
          </p>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar" 
             style={{ background: '#fcfcfc', backgroundImage: 'radial-gradient(#eee 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <LoaderIcon className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-900">Chargement...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-amber-900" style={{ fontFamily: 'var(--font-nunito)' }}>
                Envoyez le premier message pour entamer la discussion.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              const showTail = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;

              return (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isMine={isMine} 
                  showTail={showTail} 
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput 
          onSend={sendMessage}
          sending={sending}
          error={error}
          onClearError={() => setError(null)}
        />
      </div>
    </div>
  );
}
