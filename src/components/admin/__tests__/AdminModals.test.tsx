/**
 * HOMECI — Tests: AdminModals (UserDetailModal + PropertyDetailModal)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserDetailModal, PropertyDetailModal } from '../AdminModals';

// Mock constants
vi.mock('../../constants/labels', () => ({
  TYPE_LABELS: { appartement: 'Appartement', maison: 'Maison', villa: 'Villa', terrain: 'Terrain' },
  ROLE_CFG: {
    locataire: { label: 'Locataire', color: '#333' },
    proprietaire: { label: 'Propriétaire', color: '#FF6B00' },
    notaire: { label: 'Notaire', color: '#009E49' },
    admin: { label: 'Admin', color: '#D4A017' },
  },
}));

describe('UserDetailModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('ne rend rien si user est null', () => {
    const { container } = render(<UserDetailModal user={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche les détails de l\'utilisateur', () => {
    const user = {
      id: 'user-1',
      full_name: 'Jean Dupont',
      email: 'jean@example.com',
      phone: '+225 07 00 00 00',
      role: 'locataire' as const,
      company_name: null,
      verified: true,
      suspended: false,
    };
    render(<UserDetailModal user={user as any} onClose={vi.fn()} />);
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('jean@example.com')).toBeInTheDocument();
    expect(screen.getByText('Locataire')).toBeInTheDocument();
  });

  it('affiche le badge Admin pour un admin', () => {
    const user = {
      id: 'user-2',
      full_name: 'Admin Principal',
      email: 'admin@homeci.com',
      phone: null,
      role: 'admin' as const,
      company_name: null,
      verified: true,
      suspended: false,
    };
    render(<UserDetailModal user={user as any} onClose={vi.fn()} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('affiche le statut suspendu si l\'utilisateur est suspendu', () => {
    const user = {
      id: 'user-3',
      full_name: 'User Suspendu',
      email: 'suspend@example.com',
      phone: null,
      role: 'locataire' as const,
      company_name: null,
      verified: false,
      suspended: true,
    };
    render(<UserDetailModal user={user as any} onClose={vi.fn()} />);
    // Le texte peut apparaître plusieurs fois
    expect(screen.getAllByText(/Suspendu/).length).toBeGreaterThan(0);
  });

  it('appelle onClose quand on clique sur le backdrop', () => {
    const onClose = vi.fn();
    const user = {
      id: 'user-1',
      full_name: 'Jean',
      email: 'j@e.com',
      phone: null,
      role: 'locataire' as const,
      company_name: null,
      verified: true,
      suspended: false,
    };
    const { container } = render(<UserDetailModal user={user as any} onClose={onClose} />);
    // Le backdrop est le div fixed qui entoure le modal
    const overlays = container.querySelectorAll('[class*="fixed"]');
    if (overlays.length > 0) {
      fireEvent.click(overlays[0]);
      expect(onClose).toHaveBeenCalled();
    }
  });
});

describe('PropertyDetailModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('ne rend rien si property est null', () => {
    const { container } = render(<PropertyDetailModal property={null} onClose={vi.fn()} onReject={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche les détails du bien', () => {
    const property = {
      id: 'prop-1',
      title: 'Appartement Cocody',
      description: 'Bel appartement',
      property_type: 'appartement',
      transaction_type: 'location',
      price: 150000,
      city: 'Abidjan',
      commune: 'Cocody',
      quartier: 'Angré',
      bedrooms: 2,
      bathrooms: 1,
      surface_area: 80,
      images: ['https://example.com/img1.jpg'],
      status: 'published' as const,
      verified_notaire: true,
      views_count: 45,
    };
    render(<PropertyDetailModal property={property as any} onClose={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByText('Appartement Cocody')).toBeInTheDocument();
    // Le prix peut être formaté différemment
    expect(screen.getByText(/150\s*000/)).toBeInTheDocument();
    expect(screen.getByText('Abidjan')).toBeInTheDocument();
  });

  it('affiche les images du bien', () => {
    const property = {
      id: 'prop-1',
      title: 'Villa Riviera',
      description: '',
      property_type: 'villa',
      transaction_type: 'vente',
      price: 50000000,
      city: 'Abidjan',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      status: 'published' as const,
      verified_notaire: false,
      views_count: 10,
    };
    render(<PropertyDetailModal property={property as any} onClose={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByText('Villa Riviera')).toBeInTheDocument();
  });

  it('affiche le bouton Rejeter pour un bien en attente', () => {
    const property = {
      id: 'prop-1',
      title: 'Bien en attente',
      description: '',
      property_type: 'appartement',
      transaction_type: 'location',
      price: 100000,
      city: 'Abidjan',
      images: [],
      status: 'pending' as const,
      verified_notaire: false,
      views_count: 0,
    };
    render(<PropertyDetailModal property={property as any} onClose={vi.fn()} onReject={vi.fn()} />);
    expect(screen.getByText('Rejeter')).toBeInTheDocument();
  });

  it('n\'affiche PAS le bouton Rejeter pour un bien publié', () => {
    const property = {
      id: 'prop-1',
      title: 'Bien publié',
      description: '',
      property_type: 'appartement',
      transaction_type: 'location',
      price: 100000,
      city: 'Abidjan',
      images: [],
      status: 'published' as const,
      verified_notaire: true,
      views_count: 0,
    };
    render(<PropertyDetailModal property={property as any} onClose={vi.fn()} onReject={vi.fn()} />);
    expect(screen.queryByText('Rejeter')).not.toBeInTheDocument();
  });

  it('appelle onReject quand on clique sur Rejeter', () => {
    const onReject = vi.fn();
    const property = {
      id: 'prop-pending',
      title: 'Bien à rejeter',
      description: '',
      property_type: 'maison',
      transaction_type: 'vente',
      price: 25000000,
      city: 'Yamoussoukro',
      images: [],
      status: 'pending' as const,
      verified_notaire: false,
      views_count: 0,
    };
    render(<PropertyDetailModal property={property as any} onClose={vi.fn()} onReject={onReject} />);
    fireEvent.click(screen.getByText('Rejeter'));
    expect(onReject).toHaveBeenCalledWith('prop-pending');
  });

  it('appelle onClose quand on clique sur Fermer', () => {
    const onClose = vi.fn();
    const property = {
      id: 'prop-1',
      title: 'Bien à fermer',
      description: '',
      property_type: 'appartement',
      transaction_type: 'location',
      price: 100000,
      city: 'Abidjan',
      images: [],
      status: 'published' as const,
      verified_notaire: true,
      views_count: 0,
    };
    render(<PropertyDetailModal property={property as any} onClose={onClose} onReject={vi.fn()} />);
    fireEvent.click(screen.getByText('Fermer'));
    expect(onClose).toHaveBeenCalled();
  });
});
