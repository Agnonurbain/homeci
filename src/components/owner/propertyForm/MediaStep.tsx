import { Image as ImageIcon, Film, Plus, Trash2 } from 'lucide-react';
import { HColors, HAlpha } from '../../../styles/homeci-tokens';
import { VideoUploadPreview } from '../../VideoUploadPreview';

interface MediaStepProps {
  mode: 'create' | 'edit';
  images: File[];
  imagePreviews: string[];
  existingImages: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number, isExisting?: boolean) => void;
  videos: File[];
  videoPreviews: string[];
  existingVideos: string[];
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (index: number, isExisting?: boolean) => void;
}

const S = {
  label: { color: 'rgba(122,85,0,0.8)', fontFamily: 'var(--font-nunito)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } as React.CSSProperties as any,
};

export default function MediaStep({
  mode,
  images, imagePreviews, existingImages, onImageChange, onRemoveImage,
  videos, videoPreviews, existingVideos, onVideoChange, onRemoveVideo
}: MediaStepProps) {

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)' }}>
          <ImageIcon className="w-5 h-5" style={{ color: HColors.gold }} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Photos & Vidéos</h3>
          <p className="text-xs text-[#8B6A30]">Ajoutez des visuels de haute qualité pour attirer les locataires</p>
        </div>
      </div>

      {/* --- PHOTOS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label style={S.label}>Photos (jusqu'à 15)</label>
          <span className="text-[10px] font-bold text-[#8B6A30]">
            {mode === 'edit' ? existingImages.length + images.length : images.length} / 15
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Photos existantes (edit mode) */}
          {mode === 'edit' && existingImages.map((url, idx) => (
            <div key={`exist-${idx}`} className="aspect-square relative rounded-xl overflow-hidden border border-gold/20">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemoveImage(idx, true)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-[#6B1515] transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Nouvelles photos / Previews */}
          {imagePreviews.map((url, idx) => (
            <div key={`new-${idx}`} className="aspect-square relative rounded-xl overflow-hidden border border-gold/40">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemoveImage(idx, false)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-[#6B1515] transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Bouton d'ajout */}
          {(mode === 'edit' ? existingImages.length + images.length : images.length) < 15 && (
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-gold/5 transition-all"
              style={{ borderColor: HAlpha.gold25 }}>
              <Plus className="w-6 h-6 text-gold mb-1" />
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Ajouter</span>
              <input type="file" className="hidden" multiple accept="image/*" onChange={onImageChange} />
            </label>
          )}
        </div>
      </div>

      {/* --- VIDÉOS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label style={S.label}>Vidéos (jusqu'à 3)</label>
          <span className="text-[10px] font-bold text-[#8B6A30]">
             {mode === 'edit' ? existingVideos.length + videos.length : videos.length} / 3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vidéos existantes */}
          {mode === 'edit' && existingVideos.map((url, idx) => (
            <div key={`v-exist-${idx}`} className="aspect-video relative rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
              <video src={url} className="w-full h-full" controls />
              <button type="button" onClick={() => onRemoveVideo(idx, true)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-[#6B1515]">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Nouvelles vidéos — utiliser VideoUploadPreview pour plus de détails */}
          {videos.map((videoFile, idx) => (
            <VideoUploadPreview
              key={`v-new-${idx}`}
              file={videoFile}
              thumbnail={videoPreviews[idx]}
              onRemove={() => onRemoveVideo(idx, false)}
              status="pending"
            />
          ))}

          {/* Bouton d'ajout vidéo */}
          {(mode === 'edit' ? existingVideos.length + videos.length : videos.length) < 3 && (
            <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-gold/5 transition-all"
              style={{ borderColor: HAlpha.gold25 }}>
              <Film className="w-8 h-8 text-gold mb-2" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">Ajouter une vidéo</span>
              <p className="text-[10px] text-[#8B6A30] mt-1">Format mp4, max 100 Mo</p>
              <input type="file" className="hidden" multiple accept="video/*" onChange={onVideoChange} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
