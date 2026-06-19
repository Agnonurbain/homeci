import { useState } from 'react';
import { Check, CheckCheck, FileText, X, Download, Expand } from 'lucide-react';
import type { ChatMessage } from '../../services/chatService';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showTail: boolean;
  highlight?: boolean;
  searchTerm?: string;
}

/**
 * Highlight matching text in a message for search results
 */
function HighlightedText({ content, searchTerm }: { content: string; searchTerm: string }) {
  if (!searchTerm || !content) return <>{content}</>;

  const lowerContent = content.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerSearch);

  if (index === -1) return <>{content}</>;

  const before = content.slice(0, index);
  const match = content.slice(index, index + searchTerm.length);
  const after = content.slice(index + searchTerm.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 text-inherit rounded px-0.5">{match}</mark>
      {after}
    </>
  );
}

export default function MessageBubble({ message, isMine, showTail, highlight, searchTerm }: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const formatTime = (val: any) => {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const hasAttachment = !!message.attachment_url;
  const isImage = message.attachment_type === 'image';
  const isDocument = message.attachment_type === 'document';

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 animate-in slide-in-from-bottom-2 duration-300`}>
        <div
          className={`max-w-[85%] relative px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${
            isMine
              ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-l-2xl rounded-tr-2xl'
              : 'bg-white text-[#1A0E00] rounded-r-2xl rounded-tl-2xl border border-amber-100/50'
          } ${!showTail && isMine ? 'rounded-br-2xl' : ''} ${!showTail && !isMine ? 'rounded-bl-2xl' : ''}`}
          style={{ fontFamily: 'var(--font-nunito)', fontSize: '0.95rem' }}
        >
          {/* Image attachment */}
          {hasAttachment && isImage && (
            <div className="mb-2 -mx-1 -mt-1">
              <div className="relative rounded-xl overflow-hidden group cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name || 'Image jointe'}
                  className="max-w-[260px] max-h-[200px] object-cover w-auto h-auto rounded-xl"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                  <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </div>
            </div>
          )}

          {/* Document (PDF) attachment */}
          {hasAttachment && isDocument && (
            <div className={`mb-2 flex items-center gap-2.5 p-2.5 rounded-lg ${
              isMine ? 'bg-white/15' : 'bg-amber-50 border border-amber-100/50'
            }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isMine ? 'bg-white/20' : 'bg-[rgba(139,29,29,0.15)]'
              }`}>
                <FileText className={`w-4.5 h-4.5 ${isMine ? 'text-white' : 'text-[#8B1D1D]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[0.7rem] font-bold truncate ${isMine ? 'text-white/90' : 'text-[#5A4000]'}`}>
                  {message.attachment_name || 'Document.pdf'}
                </p>
                <p className={`text-[0.6rem] ${isMine ? 'text-white/50' : 'text-[#8B6A30]'}`}>PDF</p>
              </div>
              <button
                onClick={() => handleOpenLink(message.attachment_url!)}
                className={`p-1.5 rounded-full transition-colors ${
                  isMine ? 'hover:bg-white/20 text-white/70' : 'hover:bg-amber-100 text-amber-600'
                }`}
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Text content */}
          {message.content && message.content !== '[Pièce jointe]' && (
            <p className="whitespace-pre-wrap leading-relaxed">
              {highlight ? (
                <HighlightedText content={message.content} searchTerm={searchTerm || ''} />
              ) : (
                message.content
              )}
            </p>
          )}

          {/* Time + read receipt */}
          <div className={`flex items-center justify-end gap-1.5 mt-1 text-[0.65rem] font-bold opacity-70 ${isMine ? 'text-white' : 'text-[#8B6A30]'}`}>
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

      {/* Lightbox overlay */}
      {lightboxOpen && hasAttachment && isImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-[100]"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={message.attachment_url}
            alt={message.attachment_name || 'Image jointe'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
