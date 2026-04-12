import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { VideoUploadPreview } from '../VideoUploadPreview';

// Mock videoProcessing utilities
vi.mock('../../utils/videoProcessing', () => ({
  getVideoDuration: vi.fn(async () => 125),
  formatDuration: vi.fn((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }),
}));

vi.mock('../../utils/imageOptimization', () => ({
  formatFileSize: vi.fn((bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }),
}));

import * as videoProcessing from '../../utils/videoProcessing';
import * as imageOptimization from '../../utils/imageOptimization';

describe('VideoUploadPreview', () => {
  const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(videoProcessing.getVideoDuration).mockResolvedValue(125);
    vi.mocked(imageOptimization.formatFileSize).mockReturnValue('50 Mo');
  });

  it('affiche le nom du fichier vidéo', () => {
    render(<VideoUploadPreview file={mockFile} />);
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
  });

  it('affiche la taille du fichier', () => {
    render(<VideoUploadPreview file={mockFile} />);
    expect(screen.getByText('50 Mo')).toBeInTheDocument();
  });

  it('affiche la durée de la vidéo', async () => {
    render(<VideoUploadPreview file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  it('affiche le statut "En attente" par défaut', () => {
    render(<VideoUploadPreview file={mockFile} status="pending" />);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('affiche le statut "Téléchargé" quand complété', () => {
    render(<VideoUploadPreview file={mockFile} status="completed" />);
    expect(screen.getByText('Téléchargé')).toBeInTheDocument();
  });

  it('affiche le statut "Erreur" en cas d\'erreur', () => {
    render(<VideoUploadPreview file={mockFile} status="error" />);
    expect(screen.getByText('Erreur')).toBeInTheDocument();
  });

  it('affiche la progression pendant l\'upload', () => {
    render(<VideoUploadPreview file={mockFile} status="uploading" progress={45} />);
    expect(screen.getByText('Téléchargement... 45%')).toBeInTheDocument();
  });

  it('affiche le bouton de suppression quand onRemove est fourni', () => {
    const onRemove = vi.fn();
    render(<VideoUploadPreview file={mockFile} onRemove={onRemove} status="pending" />);
    const removeBtn = screen.getByRole('button');
    expect(removeBtn).toBeInTheDocument();
  });

  it('ne montre pas le bouton de suppression pendant l\'upload', () => {
    const onRemove = vi.fn();
    render(<VideoUploadPreview file={mockFile} onRemove={onRemove} status="uploading" progress={50} />);
    const removeBtns = screen.queryAllByRole('button');
    expect(removeBtns.length).toBe(0);
  });

  it('affiche l\'image miniature quand fournie', () => {
    render(<VideoUploadPreview file={mockFile} thumbnail="https://example.com/thumb.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });
});
