import { Send, Loader as LoaderIcon, Paperclip, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { HColors } from '../../styles/homeci-tokens';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

interface ChatInputProps {
  onSend: (message: string) => Promise<boolean>;
  onSendWithAttachment?: (message: string, file: File) => Promise<boolean>;
  sending: boolean;
  uploading?: { fileName: string; progress: number } | null;
  error: string | null;
  onClearError: () => void;
}

export default function ChatInput({
  onSend,
  onSendWithAttachment,
  sending,
  uploading,
  error,
  onClearError,
}: ChatInputProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(onClearError, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  useEffect(() => {
    if (fileError) {
      const timer = setTimeout(() => setFileError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [fileError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous selection
    setFilePreview(null);
    setFileError(null);
    setSelectedFile(null);

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Format non accepté. Utilisez une image (JPG, PNG, WebP, GIF) ou un PDF.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Fichier trop volumineux. Taille maximale : 10 MB.');
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || uploading) return;

    // If there's a selected file, send with attachment
    if (selectedFile && onSendWithAttachment) {
      const success = await onSendWithAttachment(newMessage, selectedFile);
      if (success) {
        setNewMessage('');
        removeSelectedFile();
      }
      return;
    }

    // Otherwise, send text only
    if (!newMessage.trim()) return;
    const success = await onSend(newMessage);
    if (success) setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = sending || !!uploading;

  return (
    <form onSubmit={handleSubmit} className="shrink-0 p-3 bg-white" style={{ borderTop: '1px solid #eaeaea' }}>
      {error && (
        <div className="mb-2 px-3 py-2 rounded-xl text-[0.75rem] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          {error}
        </div>
      )}
      {fileError && (
        <div className="mb-2 px-3 py-2 rounded-xl text-[0.75rem] font-bold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {fileError}
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
          <LoaderIcon className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${uploading.progress}%` }}
            />
          </div>
          <span className="text-[0.65rem] font-bold text-blue-600 truncate max-w-[100px]">
            {uploading.fileName}
          </span>
        </div>
      )}

      {/* File preview */}
      {selectedFile && !uploading && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 animate-in slide-in-from-bottom-1 duration-200">
          {filePreview ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
              <img src={filePreview} alt="Aperçu" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <span className="text-[0.55rem] font-bold text-red-600 uppercase">PDF</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[0.7rem] font-bold text-gray-700 truncate">{selectedFile.name}</p>
            <p className="text-[0.6rem] text-gray-400">{(selectedFile.size / 1024).toFixed(0)} Ko</p>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      )}

      <div className="relative group flex items-end gap-2 bg-gray-50 rounded-2xl p-1 border border-transparent transition-all focus-within:border-amber-200 focus-within:bg-white focus-within:shadow-sm">
        {/* Attachment button */}
        {onSendWithAttachment && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-10 h-10 mb-1 rounded-full flex items-center justify-center transition-all focus:outline-none disabled:opacity-40 hover:bg-gray-200/60"
            title="Joindre un fichier (image ou PDF, max 10 MB)"
          >
            <Paperclip
              className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-500 transition-colors"
              style={{ transform: 'rotate(-45deg)' }}
            />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isDisabled}
        />
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? 'Ajouter un commentaire (optionnel)...' : 'Répondre...'}
          className="flex-1 max-h-32 min-h-[48px] bg-transparent resize-none p-3.5 text-sm focus:outline-none placeholder-gray-400 text-gray-800"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
        <button
          type="submit"
          disabled={(!newMessage.trim() && !selectedFile) || isDisabled}
          className="shrink-0 w-12 h-12 mb-1 mr-1 rounded-full flex items-center justify-center transition-all focus:outline-none disabled:opacity-40"
          style={{
            background: (newMessage.trim() || selectedFile) && !isDisabled
              ? `linear-gradient(135deg, ${HColors.orangeCI}, ${HColors.gold})`
              : '#f3f4f6',
            color: (newMessage.trim() || selectedFile) && !isDisabled ? 'white' : '#9ca3af',
            boxShadow: (newMessage.trim() || selectedFile) && !isDisabled
              ? `0 4px 12px ${HColors.orangeCI}33`
              : 'none',
          }}
        >
          {sending || uploading ? (
            <LoaderIcon className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
        </button>
      </div>
    </form>
  );
}
