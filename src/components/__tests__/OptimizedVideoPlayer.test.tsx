import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedVideoPlayer } from '../OptimizedVideoPlayer';

describe('OptimizedVideoPlayer', () => {
  const mockVideoSrc = 'https://example.com/video.mp4';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true });
  });

  it('rend le lecteur vidéo avec la source correcte', () => {
    const { container } = render(<OptimizedVideoPlayer src={mockVideoSrc} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain('video.mp4');
  });

  it('affiche le poster quand fourni', () => {
    const { container } = render(<OptimizedVideoPlayer src={mockVideoSrc} poster="https://example.com/poster.jpg" />);
    const video = container.querySelector('video');
    expect(video?.poster).toContain('poster.jpg');
  });

  it('affiche le slider de progression', () => {
    render(<OptimizedVideoPlayer src={mockVideoSrc} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('affiche les contrôles de lecture', () => {
    render(<OptimizedVideoPlayer src={mockVideoSrc} />);
    // The component should render a slider for seeking
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
  });

  it('a un conteneur avec la classe bg-black', () => {
    const { container } = render(<OptimizedVideoPlayer src={mockVideoSrc} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-black');
  });
});
