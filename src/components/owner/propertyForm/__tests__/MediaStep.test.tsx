/**
 * HOMECI — Tests: MediaStep
 * Photo/video upload display — pure presentational component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MediaStep from '../MediaStep';

function renderStep(overrides: Partial<React.ComponentProps<typeof MediaStep>> = {}) {
  const props = {
    mode: 'create' as const,
    images: [],
    imagePreviews: [],
    existingImages: [],
    onImageChange: vi.fn(),
    onRemoveImage: vi.fn(),
    videos: [],
    videoPreviews: [],
    existingVideos: [],
    onVideoChange: vi.fn(),
    onRemoveVideo: vi.fn(),
    ...overrides,
  };
  render(<MediaStep {...props} />);
  return props;
}

describe('MediaStep', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Photos & Videos"', () => {
    renderStep();
    expect(screen.getByText(/Photos &/)).toBeInTheDocument();
  });

  it('affiche le compteur de photos à 0', () => {
    renderStep();
    expect(screen.getByText(/0 \/ 15/)).toBeInTheDocument();
  });

  it('affiche le compteur de vidéos à 0', () => {
    renderStep();
    expect(screen.getByText(/0 \/ 3/)).toBeInTheDocument();
  });

  it('affiche les images ajoutées récemment', () => {
    renderStep({
      images: [new File([''], 'img1.jpg', { type: 'image/jpeg' })],
      imagePreviews: ['data:image/jpeg;base64,preview1'],
    });
    expect(screen.getByText('1 / 15')).toBeInTheDocument();
  });

  it('affiche les vidéos ajoutées récemment', () => {
    renderStep({
      videos: [new File([''], 'vid1.mp4', { type: 'video/mp4' })],
      videoPreviews: ['data:video/mp4;base64,preview1'],
    });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('affiche les images existantes en mode edit', () => {
    renderStep({
      mode: 'edit',
      existingImages: ['https://example.com/existing1.jpg', 'https://example.com/existing2.jpg'],
      images: [],
      imagePreviews: [],
    });
    expect(screen.getByText('2 / 15')).toBeInTheDocument();
  });

  it('affiche les vidéos existantes en mode edit', () => {
    renderStep({
      mode: 'edit',
      existingVideos: ['https://example.com/existing1.mp4'],
      videos: [],
      videoPreviews: [],
    });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('appelle onRemoveImage quand on supprime une image', () => {
    const onRemoveImage = vi.fn();
    renderStep({
      images: [new File([''], 'img1.jpg', { type: 'image/jpeg' })],
      imagePreviews: ['data:image/jpeg;base64,preview1'],
      onRemoveImage,
    });
    // Le bouton supprimer est un label avec Trash2
    const trashBtns = screen.getAllByRole('button');
    if (trashBtns.length > 0) {
      fireEvent.click(trashBtns[0]);
      expect(onRemoveImage).toHaveBeenCalledWith(0, false);
    }
  });

  it('appelle onRemoveVideo quand on supprime une vidéo', () => {
    const onRemoveVideo = vi.fn();
    renderStep({
      videos: [new File([''], 'vid1.mp4', { type: 'video/mp4' })],
      videoPreviews: ['data:video/mp4;base64,preview1'],
      onRemoveVideo,
    });
    const trashBtns = screen.getAllByRole('button');
    if (trashBtns.length > 0) {
      fireEvent.click(trashBtns[0]);
      expect(onRemoveVideo).toHaveBeenCalledWith(0, false);
    }
  });

  it('ne montre PAS le bouton ajouter photos si limite atteinte (15)', () => {
    const images = Array.from({ length: 15 }, (_, i) => new File([''], `img${i}.jpg`, { type: 'image/jpeg' }));
    const previews = images.map((_, i) => `data:image/jpeg;base64,preview${i}`);
    renderStep({ images, imagePreviews: previews });
    // Le bouton d'ajout devrait être caché
    expect(screen.queryByText(/Ajouter des photos/)).not.toBeInTheDocument();
  });

  it('ne montre PAS le bouton ajouter vidéos si limite atteinte (3)', () => {
    const videos = Array.from({ length: 3 }, (_, i) => new File([''], `vid${i}.mp4`, { type: 'video/mp4' }));
    const previews = videos.map((_, i) => `data:video/mp4;base64,preview${i}`);
    renderStep({ videos, videoPreviews: previews });
    expect(screen.queryByText(/Ajouter des vidéos/)).not.toBeInTheDocument();
  });

  it('affiche le hint "Format mp4" pour les vidéos', () => {
    renderStep();
    expect(screen.getByText(/Format mp4/)).toBeInTheDocument();
  });
});
