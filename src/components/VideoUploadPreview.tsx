import { useEffect, useState } from 'react';
import { Video, Clock, HardDrive, X, CheckCircle } from 'lucide-react';
import { getVideoDuration, formatDuration } from '../utils/videoProcessing';
import { formatFileSize } from '../utils/imageOptimization';

interface VideoUploadPreviewProps {
  file: File;
  thumbnail?: string;
  progress?: number;
  onRemove?: () => void;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
}

export const VideoUploadPreview = ({
  file,
  thumbnail,
  progress = 0,
  onRemove,
  status = 'pending',
}: VideoUploadPreviewProps) => {
  const [duration, setDuration] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(thumbnail || null);

  useEffect(() => {
    const loadVideoMetadata = async () => {
      try {
        const videoDuration = await getVideoDuration(file);
        setDuration(videoDuration);

        if (!thumbnail) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error('Failed to load video metadata:', error);
      }
    };

    loadVideoMetadata();

    return () => {
      if (previewUrl && !thumbnail) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, thumbnail]);

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Téléchargé';
      case 'error':
        return 'Erreur';
      case 'uploading':
        return `Téléchargement... ${progress}%`;
      default:
        return 'En attente';
    }
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="relative w-32 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-500" />
            </div>
          )}

          {status === 'completed' && (
            <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate mb-2">
            {file.name}
          </h4>

          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>{formatFileSize(file.size)}</span>
            </div>

            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              <span>{file.type.split('/')[1].toUpperCase()}</span>
            </div>
          </div>

          {status === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs text-gray-600">{getStatusText()}</span>
          </div>
        </div>

        {onRemove && status !== 'uploading' && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
