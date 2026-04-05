import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsersSection, ModerationSection, SectionTitle, RoleBadge, PropertyStatusBadge } from '../AdminSections';
import { HColors } from '../../../styles/homeci-tokens';
import type { Profile } from '../../../contexts/AuthContext';

beforeEach(() => vi.clearAllMocks());

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  makeUser({ id: 'u1', full_name: 'Jean Koné', email: 'jean@test.ci', role: 'locataire' }),
  makeUser({ id: 'u2', full_name: 'Awa Diallo', email: 'awa@test.ci', role: 'proprietaire', suspended: true }),
];

// ── SectionTitle ───────────────────────────────────────────────────────────────

describe('SectionTitle', () => {
  it('affiche le titre et sous-titre', () => {
    render(<SectionTitle title="Mon Titre" sub="Ma description" />);
    expect(screen.getByText('Mon Titre')).toBeInTheDocument();
    expect(screen.getByText('Ma description')).toBeInTheDocument();
  });
});

// ── RoleBadge ──────────────────────────────────────────────────────────────────

describe('RoleBadge', () => {
  it('affiche le label du rôle locataire', () => {
    render(<RoleBadge role="locataire" />);
    expect(screen.getByText('Locataire')).toBeInTheDocument();
  });

  it('affiche le label du rôle proprietaire', () => {
    render(<RoleBadge role="proprietaire" />);
    expect(screen.getByText('Propriétaire')).toBeInTheDocument();
  });

  it('affiche le label du rôle admin', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('utilise locataire par défaut pour un rôle inconnu', () => {
    render(<RoleBadge role="unknown_role" />);
    expect(screen.getByText('Locataire')).toBeInTheDocument();
  });
});

// ── PropertyStatusBadge ────────────────────────────────────────────────────────

describe('PropertyStatusBadge', () => {
  it.each([
    ['published', 'Publié'],
    ['pending', 'En attente'],
    ['draft', 'Brouillon'],
    ['rejected', 'Rejeté'],
    ['rented', 'Loué'],
    ['sold', 'Vendu'],
  ])('affiche "%s" comme "%s"', (status, label) => {
    render(<PropertyStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('utilise "Brouillon" pour un statut inconnu', () => {
    render(<PropertyStatusBadge status="unknown" />);
    expect(screen.getByText('Brouillon')).toBeInTheDocument();
  });
});

// ── UsersSection ───────────────────────────────────────────────────────────────

describe('UsersSection', () => {
  const defaultProps = {
    users: mockUsers,
    filterRole: '',
    setFilterRole: vi.fn(),
    filterDate: 'desc' as const,
    setFilterDate: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('affiche le titre Gestion des Utilisateurs', () => {
    render(<UsersSection {...defaultProps} />);
    expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument();
  });

  it('affiche les noms des utilisateurs', () => {
    render(<UsersSection {...defaultProps} />);
    expect(screen.getByText('Jean Koné')).toBeInTheDocument();
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();
  });

  it('affiche le compteur d\'utilisateurs', () => {
    render(<UsersSection {...defaultProps} />);
    expect(screen.getByText('2 utilisateur(s)')).toBeInTheDocument();
  });

  it('le thead utilise forest comme background', () => {
    const { container } = render(<UsersSection {...defaultProps} />);
    const thead = container.querySelector('thead');
    expect(thead).toBeTruthy();
    // JSDOM normalise les hex en rgb
    expect(thead!.style.background).toBe('rgb(27, 94, 58)');
  });

  it('affiche Suspendu pour un utilisateur suspendu', () => {
    render(<UsersSection {...defaultProps} />);
    expect(screen.getByText('Suspendu')).toBeInTheDocument();
  });

  it('affiche Actif pour un utilisateur non suspendu', () => {
    render(<UsersSection {...defaultProps} />);
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('appelle onViewDetails au clic sur Détails', () => {
    render(<UsersSection {...defaultProps} />);
    const btns = screen.getAllByText('Détails');
    fireEvent.click(btns[0]);
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('inverse le tri de date au clic', () => {
    render(<UsersSection {...defaultProps} />);
    const dateBtn = screen.getByText('↓ Date');
    fireEvent.click(dateBtn);
    expect(defaultProps.setFilterDate).toHaveBeenCalledWith('asc');
  });

  it('désactive le bouton CSV quand aucun utilisateur', () => {
    render(<UsersSection {...defaultProps} users={[]} />);
    const csvBtn = screen.getByText('CSV').closest('button')!;
    expect(csvBtn).toBeDisabled();
  });

  it('exporte le CSV au clic', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<UsersSection {...defaultProps} />);
    const csvBtn = screen.getByText('CSV').closest('button')!;
    fireEvent.click(csvBtn);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

// ── ModerationSection ──────────────────────────────────────────────────────────

describe('ModerationSection', () => {
  const defaultProps = {
    properties: [] as any[],
    onViewDetails: vi.fn(),
    onReject: vi.fn(),
    onConsumeToken: vi.fn(async () => true),
  };

  it('affiche le titre Modération des Biens', () => {
    render(<ModerationSection {...defaultProps} />);
    expect(screen.getByText('Modération des Biens')).toBeInTheDocument();
  });

  it('affiche "File de modération vide" sans propriétés', () => {
    render(<ModerationSection {...defaultProps} />);
    expect(screen.getByText('File de modération vide')).toBeInTheDocument();
  });

  it('affiche la section Délégation Notaire', () => {
    render(<ModerationSection {...defaultProps} />);
    expect(screen.getByText('Délégation Notaire')).toBeInTheDocument();
  });

  it('affiche le champ de saisie du jeton', () => {
    render(<ModerationSection {...defaultProps} />);
    expect(screen.getByPlaceholderText('JETON (HC-XXXXXX)')).toBeInTheDocument();
  });

  it('convertit le jeton en majuscules', () => {
    render(<ModerationSection {...defaultProps} />);
    const input = screen.getByPlaceholderText('JETON (HC-XXXXXX)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hc-abc123' } });
    expect(input.value).toBe('HC-ABC123');
  });
});
