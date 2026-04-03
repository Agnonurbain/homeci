import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../../services/chatService';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showTail: boolean;
}

export default function MessageBubble({ message, isMine, showTail }: MessageBubbleProps) {
  const formatTime = (val: any) => {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] relative px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${
        isMine 
          ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-l-2xl rounded-tr-2xl' 
          : 'bg-white text-gray-800 rounded-r-2xl rounded-tl-2xl border border-amber-100/50'
        } ${!showTail && isMine ? 'rounded-br-2xl' : ''} ${!showTail && !isMine ? 'rounded-bl-2xl' : ''}`}
        style={{ fontFamily: 'var(--font-nunito)', fontSize: '0.95rem' }}>
        
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[0.65rem] font-bold opacity-70 ${isMine ? 'text-white' : 'text-gray-400'}`}>
          <span>{formatTime(message.created_at)}</span>
          {isMine && (
            <span className="transition-all animate-in fade-in duration-500">
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
