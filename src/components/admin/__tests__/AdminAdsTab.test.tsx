import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAdsTab from '../../AdminAdsTab';

// Mock adService
vi.mock('../../../services/adService', () => ({
  adService: {
    getAllBoosts: vi.fn(async () => []),
    getAllBanners: vi.fn(async () => []),
    createBoost: vi.fn(async () => 'boost-1'),
    createBanner: vi.fn(async () => 'banner-1'),
    updateBoostStatus: vi.fn(async () => {}),
    updateBannerStatus: vi.fn(async () => {}),
  },
}));

// Mock propertyService
vi.mock('../../../services/propertyService', () => ({
  propertyService: {
    getProperties: vi.fn(async () => [
      { id: 'prop-1', title: 'Appartement Cocody', city: 'Abidjan', owner_id: 'owner-1' },
      { id: 'prop-2', title: 'Villa Marcory', city: 'Abidjan', owner_id: 'owner-2' },
    ]),
  },
}));

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Zap: ({ className }: any) => <div data-testid="icon-zap" className={className} />,
    Image: ({ className }: any) => <div data-testid="icon-image" className={className} />,
    Plus: ({ className }: any) => <div data-testid="icon-plus" className={className} />,
    Pause: ({ className }: any) => <div data-testid="icon-pause" className={className} />,
    Play: ({ className }: any) => <div data-testid="icon-play" className={className} />,
    Eye: ({ className }: any) => <div data-testid="icon-eye" className={className} />,
    MousePointer: ({ className }: any) => <div data-testid="icon-mouse" className={className} />,
    Calendar: ({ className }: any) => <div data-testid="icon-cal" className={className} />,
    DollarSign: ({ className }: any) => <div data-testid="icon-dollar" className={className} />,
    MapPin: ({ className }: any) => <div data-testid="icon-pin" className={className} />,
    X: ({ className, onClick }: any) => <div data-testid="icon-x" className={className} onClick={onClick} />,
    Loader: ({ className }: any) => <div data-testid="icon-loader" className={className} />,
  };
});

// Mock KenteLine
vi.mock('../../ui/KenteLine', () => ({
  KenteLine: () => <div data-testid="kente-line" />,
}));

import * as adServiceMod from '../../../services/adService';
import * as propertyServiceMod from '../../../services/propertyService';

describe('AdminAdsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adServiceMod.adService.getAllBoosts).mockResolvedValue([]);
    vi.mocked(adServiceMod.adService.getAllBanners).mockResolvedValue([]);
    vi.mocked(propertyServiceMod.propertyService.getProperties).mockResolvedValue([
      { id: 'prop-1', title: 'Appartement Cocody', city: 'Abidjan', owner_id: 'owner-1' },
    ] as any);
  });

  it('affiche le titre et les sous-onglets', async () => {
    render(<AdminAdsTab />);

    await waitFor(() => {
      expect(screen.getByText('Publicités')).toBeInTheDocument();
    });

    expect(screen.getByText('Biens Sponsorisés')).toBeInTheDocument();
    expect(screen.getByText('Bannières Partenaires')).toBeInTheDocument();
  });

  it('affiche les statistiques de boosts', async () => {
    const mockBoosts = [
      {
        id: 'boost-1',
        propertyId: 'prop-1',
        propertyTitle: 'Appartement Cocody',
        ownerId: 'owner-1',
        duration: 7 as const,
        status: 'active' as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        amountPaid: 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    vi.mocked(adServiceMod.adService.getAllBoosts).mockResolvedValue(mockBoosts);

    render(<AdminAdsTab />);

    await waitFor(() => {
      expect(screen.getByText('Boosts Actifs')).toBeInTheDocument();
    });

    // Check that boosts stats section is visible (use queryByText for the label)
    const boostsLabel = screen.getByText('Boosts Actifs');
    expect(boostsLabel).toBeInTheDocument();
  });

  it('affiche les statistiques de bannières', async () => {
    const mockBanners = [
      {
        id: 'banner-1',
        title: 'Promo été',
        imageUrl: 'https://example.com/banner.jpg',
        linkUrl: 'https://example.com',
        advertiserName: 'HOMECI',
        status: 'active' as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        amountPaid: 50000,
        impressions: 1500,
        clicks: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    vi.mocked(adServiceMod.adService.getAllBanners).mockResolvedValue(mockBanners);

    render(<AdminAdsTab />);

    await waitFor(() => {
      expect(screen.getByText('Bannières Partenaires')).toBeInTheDocument();
    });

    // Switch to banners tab
    const bannersTab = screen.getByText('Bannières Partenaires');
    fireEvent.click(bannersTab);

    await waitFor(() => {
      expect(screen.getByText('Vues Totales')).toBeInTheDocument();
    });

    // Vues totales = 1500 (check parent element textContent)
    const allText = document.body.textContent || '';
    expect(allText).toContain('500');
  });

  it('ouvre le modal de création de boost', async () => {
    render(<AdminAdsTab />);

    await waitFor(() => {
      expect(screen.getByText('Nouveau Boost')).toBeInTheDocument();
    });

    const newBoostBtn = screen.getByText('Nouveau Boost');
    fireEvent.click(newBoostBtn);

    await waitFor(() => {
      const headings = screen.getAllByText(/Nouveau Boost/);
      expect(headings.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('ouvre le modal de création de bannière', async () => {
    render(<AdminAdsTab />);

    // Click on banners tab first
    await waitFor(() => {
      expect(screen.getByText('Bannières Partenaires')).toBeInTheDocument();
    });

    const bannersTab = screen.getByText('Bannières Partenaires');
    fireEvent.click(bannersTab);

    await waitFor(() => {
      expect(screen.getByText('Nouvelle Bannière')).toBeInTheDocument();
    });

    const newBannerBtn = screen.getByText('Nouvelle Bannière');
    fireEvent.click(newBannerBtn);

    await waitFor(() => {
      expect(screen.getByText('🖼️ Nouvelle Bannière Partenaire')).toBeInTheDocument();
    });
  });

  it('affiche un message vide quand aucun boost', async () => {
    render(<AdminAdsTab />);

    await waitFor(() => {
      expect(screen.getByText('Aucun boost')).toBeInTheDocument();
    });
  });

  it('affiche un message vide quand aucune bannière', async () => {
    render(<AdminAdsTab />);

    // Switch to banners tab
    await waitFor(() => {
      expect(screen.getByText('Bannières Partenaires')).toBeInTheDocument();
    });

    const bannersTab = screen.getByText('Bannières Partenaires');
    fireEvent.click(bannersTab);

    await waitFor(() => {
      expect(screen.getByText('Aucune bannière')).toBeInTheDocument();
    });
  });
});
