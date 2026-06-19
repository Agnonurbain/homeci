import { Shield, Info, Loader as LoaderIcon, X, Search, ChevronUp } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';
import { useChat } from '../hooks/useChat';
import MessageBubble from './chat/MessageBubble';
import ChatInput from './chat/ChatInput';
import { useState, useEffect, useRef } from 'react';
import { MESSAGES_PER_PAGE } from '../services/chatService';

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
    searching,
    searchResults,
    searchTerm,
    searchMessages,
    clearSearch,
  } = useChat({ chatId, currentUserId });

  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    // If scrolled near top (within 50px), load more
    if (container.scrollTop < 50) {
      loadMoreMessages();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchMessages(searchInput);
    }
  };

  // Messages to display: either search results or all messages
  const displayMessages = searchResults ?? messages;

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
                  <div className="w-1.5 h-1.5 rounded-full bg-[#009E49] animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>
                    {otherUserRole}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) clearSearch();
                }}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
              >
                <Search className={`w-5 h-5 transition-colors ${showSearch ? 'text-white' : 'text-white/50'}`} />
              </button>
              <button onClick={onClose}
                      className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="shrink-0 px-4 py-2 flex items-center gap-2 border-b"
                style={{ background: HAlpha.orange08, borderColor: HAlpha.orange15 }}>
            <Search className="w-4 h-4 text-amber-700" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher dans la conversation..."
              className="flex-1 bg-white/80 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40 border border-amber-200 focus:border-amber-500 transition-colors"
              style={{ fontFamily: 'var(--font-nunito)' }}
            />
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: HColors.orangeCI }}
            >
              {searching ? '...' : 'OK'}
            </button>
            {searchResults !== null && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-2 py-1 rounded-lg text-xs font-bold text-amber-800 hover:bg-white/50 transition-colors"
              >
                ✕
              </button>
            )}
          </form>
        )}

        {/* Search Results Banner */}
        {searchResults !== null && (
          <div className="shrink-0 px-4 py-2 flex items-center gap-2 text-xs"
               style={{ background: HAlpha.gold10, borderBottom: `1px solid ${HAlpha.gold20}` }}>
            <Info className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-medium text-amber-900">
              {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''}
              {searchTerm && ` pour "${searchTerm}"`}
            </span>
          </div>
        )}

        {/* Info Bandeau Sécurité */}
        {!showSearch && (
          <div className="shrink-0 px-4 py-3 flex items-start gap-2.5 text-[0.7rem] leading-relaxed"
            style={{ background: HAlpha.orange08, color: HColors.orangeDark, borderBottom: `1px solid ${HAlpha.orange15}`, fontFamily: 'var(--font-nunito)' }}>
            <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
            <p className="font-medium">
              Pour votre sécurité, les adresses email sont automatiquement masquées.
              Évitez toute transaction financière en dehors de la plateforme HOMECI.
            </p>
          </div>
        )}

        {/* Messages List */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar"
          style={{ background: '#fcfcfc', backgroundImage: 'radial-gradient(#eee 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}
        >
          {/* Load More Indicator */}
          {hasMore && !loading && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <button
                onClick={loadMoreMessages}
                disabled={loadingMore}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  borderColor: HAlpha.orange20,
                  color: HColors.orangeCI,
                  background: 'white',
                }}
              >
                {loadingMore ? (
                  <>
                    <LoaderIcon className="w-3 h-3 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Messages plus anciens
                  </>
                )}
              </button>
            </div>
          )}
          {!hasMore && messages.length > MESSAGES_PER_PAGE && (
            <div className="text-center py-2 text-xs opacity-50 text-[#8B6A30]" style={{ fontFamily: 'var(--font-nunito)' }}>
              Début de la conversation
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <LoaderIcon className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-900">Chargement...</p>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-amber-900" style={{ fontFamily: 'var(--font-nunito)' }}>
                {searchResults !== null
                  ? 'Aucun résultat pour cette recherche.'
                  : "Envoyez le premier message pour entamer la discussion."}
              </p>
            </div>
          ) : (
            displayMessages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              // Show tail for the last message from a consecutive group
              const nextMsg = displayMessages[i + 1];
              const showTail = !nextMsg || nextMsg.sender_id !== msg.sender_id;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showTail={showTail}
                  highlight={searchResults !== null}
                  searchTerm={searchTerm}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="shrink-0 px-4 py-2 text-xs text-center font-medium text-[#8B1D1D] bg-[rgba(139,29,29,0.10)] border-t border-[rgba(139,29,29,0.20)] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 font-bold hover:opacity-70">✕</button>
          </div>
        )}

        {/* Input Area */}
        <ChatInput
          onSend={sendMessage}
          onSendWithAttachment={sendMessageWithAttachment}
          sending={sending}
          uploading={uploading}
          error={error}
          onClearError={() => setError(null)}
        />
      </div>
    </div>
  );
}
