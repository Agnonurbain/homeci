import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAuditLogs from '../AdminAuditLogs';
import { auditService } from '../../../services/auditService';

vi.mock('../../../services/auditService', () => ({
  auditService: {
    getAuditLogs: vi.fn(),
    getLogsByAction: vi.fn(),
  },
}));

const mockAuditLog = (overrides = {}) => ({
  id: 'log1',
  action: 'admin_login',
  performed_by: 'uid1',
  performed_by_email: 'admin@homeci.ci',
  performed_by_name: 'Admin Principal',
  target_uid: undefined,
  target_email: undefined,
  target_name: undefined,
  property_id: undefined,
  property_title: undefined,
  reason: undefined,
  ...overrides,
});

const AUDIT_LOGS = [
  mockAuditLog({ id: 'log1', action: 'admin_login', performed_by_email: 'admin@homeci.ci', performed_by_name: 'Admin Principal' }),
  mockAuditLog({ id: 'log2', action: 'user_suspended', performed_by_email: 'admin@homeci.ci', target_email: 'spam@test.ci', reason: 'Activité suspecte' }),
  mockAuditLog({ id: 'log3', action: 'property_approved', performed_by_email: 'admin@homeci.ci', property_title: 'Villa Cocody' }),
];

beforeEach(() => {
  vi.clearAllMocks();
  (auditService.getAuditLogs as any).mockResolvedValue(AUDIT_LOGS);
  (auditService.getLogsByAction as any).mockResolvedValue(AUDIT_LOGS);
});

describe('AdminAuditLogs', () => {
  it('affiche un loader pendant le chargement', () => {
    const { container } = render(<AdminAuditLogs />);
    // Le loader utilise une icône Clock avec animate-spin
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche les logs d\'audit après chargement', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Journal d\'Audit')).toBeInTheDocument();
    });
    expect(screen.getByText('3 entrée(s)')).toBeInTheDocument();
    // Vérifie que les actions sont affichées (utiliser getAllByText car le texte apparaît dans le select ET le tableau)
    expect(screen.getAllByText('Connexion admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Utilisateur suspendu').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bien approuvé').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche l\'email et le nom de l\'auteur', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Journal d\'Audit')).toBeInTheDocument();
    });
    // Le nom apparaît dans la colonne "Par" - utiliser getAllByText
    expect(screen.getAllByText('Admin Principal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('admin@homeci.ci').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche la cible (email, nom, titre du bien)', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('spam@test.ci')).toBeInTheDocument();
    });
    expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
  });

  it('affiche le motif quand présent', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Activité suspecte')).toBeInTheDocument();
    });
  });

  it('filtre les logs par terme de recherche', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Journal d\'Audit')).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText('Rechercher (email, action, bien...)');
    fireEvent.change(searchInput, { target: { value: 'Cocody' } });
    // Le filtrage est côté client via useMemo
    await waitFor(() => {
      expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
    });
  });

  it('filtre les logs par action via le select', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Journal d\'Audit')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'user_suspended' } });
    await waitFor(() => {
      expect(auditService.getLogsByAction).toHaveBeenCalledWith('user_suspended', 25);
    });
  });

  it('affiche "Aucun log trouvé" quand la liste est vide', async () => {
    (auditService.getAuditLogs as any).mockResolvedValue([]);
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Aucun log trouvé')).toBeInTheDocument();
    });
    expect(screen.getByText('Les actions sensibles seront enregistrées ici')).toBeInTheDocument();
  });

  it('affiche la pagination avec boutons Précédent/Suivant', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
    const prevBtn = screen.getByText('Précédent');
    const nextBtn = screen.getByText('Suivant');
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn).toBeDisabled(); // page 1 = disabled
  });

  it('incrémente la page au clic sur Suivant', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
    const nextBtn = screen.getByText('Suivant');
    fireEvent.click(nextBtn);
    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
  });

  it('appelle getAuditLogs avec le bon pageSize au chargement', async () => {
    render(<AdminAuditLogs />);
    await waitFor(() => {
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(1, 25);
    });
  });
});
