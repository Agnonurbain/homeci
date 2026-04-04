import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import AdminCGVTab from '../AdminCGVTab';
import type { Profile } from '../../contexts/AuthContext';

beforeEach(() => vi.clearAllMocks());

const makeUser = (overrides: Partial<Profile & { suspended?: boolean }> = {}): Profile & { suspended?: boolean } => ({
  id: 'u1',
  email: 'jean@test.ci',
  full_name: 'Jean Koné',
  phone: null,
  role: 'locataire',
  avatar_url: null,
  company_name: null,
  verified: true,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  ...overrides,
});

const mockUsers = [
  makeUser({ id: 'u1', full_name: 'Jean Koné', email: 'jean@test.ci', role: 'locataire', cgv_accepted: true, cgv_accepted_at: '2026-02-01T10:00:00Z' }),
  makeUser({ id: 'u2', full_name: 'Awa Diallo', email: 'awa@test.ci', role: 'proprietaire', cgv_accepted: false }),
  makeUser({ id: 'u3', full_name: 'Me Traoré', email: 'traore@test.ci', role: 'notaire', cgv_notaire_accepted: true, cgv_notaire_accepted_at: '2026-03-10T08:00:00Z' }),
  makeUser({ id: 'u4', full_name: 'Admin Test', email: 'admin@test.ci', role: 'admin', suspended: true }),
];

describe('AdminCGVTab', () => {

  it('affiche le titre Documents Légaux & CGV', () => {
    render(<AdminCGVTab users={[]} />);
    expect(screen.getByText('Documents Légaux & CGV')).toBeInTheDocument();
  });

  it('affiche la section Suivi des acceptations', () => {
    render(<AdminCGVTab users={[]} />);
    expect(screen.getByText('Suivi des acceptations')).toBeInTheDocument();
  });

  it('affiche "Aucun utilisateur trouvé" quand la liste est vide', () => {
    render(<AdminCGVTab users={[]} />);
    expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
  });

  it('affiche les utilisateurs avec leur statut CGV', () => {
    render(<AdminCGVTab users={mockUsers} />);
    expect(screen.getByText('Jean Koné')).toBeInTheDocument();
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();
    expect(screen.getByText('Me Traoré')).toBeInTheDocument();
    expect(screen.getAllByText('Acceptées')).toHaveLength(2); // Jean + Traoré
    expect(screen.getAllByText('Non acceptées')).toHaveLength(2); // Awa + Admin
  });

  it('affiche le compteur accepté(s) correct', () => {
    render(<AdminCGVTab users={mockUsers} />);
    expect(screen.getByText('2/4 accepté(s)')).toBeInTheDocument();
  });

  it('filtre par CGV acceptées', () => {
    render(<AdminCGVTab users={mockUsers} />);
    fireEvent.change(screen.getByDisplayValue('Tous'), { target: { value: 'accepted' } });
    expect(screen.getByText('Jean Koné')).toBeInTheDocument();
    expect(screen.getByText('Me Traoré')).toBeInTheDocument();
    expect(screen.queryByText('Awa Diallo')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Test')).not.toBeInTheDocument();
  });

  it('filtre par CGV non acceptées', () => {
    render(<AdminCGVTab users={mockUsers} />);
    fireEvent.change(screen.getByDisplayValue('Tous'), { target: { value: 'not_accepted' } });
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();
    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.queryByText('Jean Koné')).not.toBeInTheDocument();
    expect(screen.queryByText('Me Traoré')).not.toBeInTheDocument();
  });

  it('affiche les 3 onglets de documents', () => {
    render(<AdminCGVTab users={[]} />);
    expect(screen.getByText('CGV Locataire / Acheteur')).toBeInTheDocument();
    expect(screen.getByText('CGV Propriétaire')).toBeInTheDocument();
    expect(screen.getByText('Charte Notaire')).toBeInTheDocument();
  });

  it('affiche le statut Suspendu pour les utilisateurs suspendus', () => {
    render(<AdminCGVTab users={mockUsers} />);
    expect(screen.getByText('Suspendu')).toBeInTheDocument();
    expect(screen.getAllByText('Actif')).toHaveLength(3);
  });

  it('désactive le bouton CSV quand aucun utilisateur affiché', () => {
    render(<AdminCGVTab users={[]} />);
    const csvBtn = screen.getByText('CSV').closest('button')!;
    expect(csvBtn).toBeDisabled();
  });

  it('active le bouton CSV quand des utilisateurs sont affichés', () => {
    render(<AdminCGVTab users={mockUsers} />);
    const csvBtn = screen.getByText('CSV').closest('button')!;
    expect(csvBtn).not.toBeDisabled();
  });

  it('exporte le CSV au clic (crée un lien et le clique)', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<AdminCGVTab users={mockUsers} />);
    const csvBtn = screen.getByText('CSV').closest('button')!;
    fireEvent.click(csvBtn);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
