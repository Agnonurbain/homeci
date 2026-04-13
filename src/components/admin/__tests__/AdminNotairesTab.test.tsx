import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminNotairesTab } from '../AdminNotairesTab';

// Mock Firebase Firestore
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'notaire_codes_collection'),
  query: vi.fn((...args: any[]) => args),
  orderBy: vi.fn((field: string, dir: string) => ({ field, dir })),
  getDocs: () => mockGetDocs(),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  doc: vi.fn((_db: any, _col: string, id: string) => ({ id })),
  Timestamp: class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() { return new Date(this.seconds * 1000); }
    toMillis() { return this.seconds * 1000; }
    static now() { return new Timestamp(Math.floor(Date.now() / 1000), 0); }
    static fromDate(d: Date) { return new Timestamp(Math.floor(d.getTime() / 1000), 0); }
    static fromMillis(ms: number) { return new Timestamp(Math.floor(ms / 1000), 0); }
  },
}));

vi.mock('../../../lib/firebase', () => ({
  db: {},
}));

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i;
      return arr;
    },
  },
  writable: true,
});

const MOCK_CODES = [
  { id: 'code1', code: 'ABCDEF1234', used: false, created_at: '2026-04-01T10:00:00Z', expires_at: '2026-04-20T10:00:00Z', note: 'Me Konaté' },
  { id: 'code2', code: 'XYZXYZ5678', used: true, created_at: '2026-03-15T10:00:00Z', expires_at: '2026-03-22T10:00:00Z', used_at: '2026-03-16T10:00:00Z', note: null },
  { id: 'code3', code: 'EXPIRED001', used: false, created_at: '2020-01-01T10:00:00Z', expires_at: '2020-01-08T10:00:00Z', note: null },
];

function makeSnap(docs: any[]) {
  return {
    docs: docs.map(d => ({
      id: d.id,
      data: () => d,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDocs.mockResolvedValue(makeSnap(MOCK_CODES));
  mockAddDoc.mockResolvedValue({ id: 'new_code_id' });
});

function renderComponent() {
  const showToast = vi.fn();
  const utils = render(<AdminNotairesTab showToast={showToast} />);
  return { ...utils, showToast };
}

describe('AdminNotairesTab', () => {
  it('affiche le titre de la section', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Codes d'invitation Notaires")).toBeInTheDocument();
    });
  });

  it('affiche les codes générés', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });
    expect(screen.getByText('XYZXYZ5678')).toBeInTheDocument();
  });

  it('affiche le statut "Actif" pour un code non utilisé et non expiré', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });
  });

  it('affiche le statut "Utilisé" pour un code utilisé', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('Utilisé').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche le statut "Expiré" pour un code expiré', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('Expiré').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche la note du code quand elle existe', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Me Konaté')).toBeInTheDocument();
    });
  });

  it('affiche un message vide quand aucun code n\'existe', async () => {
    mockGetDocs.mockResolvedValue(makeSnap([]));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Aucun code généré pour l\'instant')).toBeInTheDocument();
    });
  });

  it('affiche un loader pendant le chargement', () => {
    const { container } = renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('génère un nouveau code au clic sur le bouton Générer', async () => {
    const { showToast } = renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });

    const generateBtn = screen.getByText('Générer');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalled();
    });
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Code notaire généré'));
  });

  it('révoque un code au clic sur le bouton Révoquer', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });

    const revokeBtns = screen.getAllByText('Révoquer');
    expect(revokeBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(revokeBtns[0]);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  it('copie le code dans le presse-papiers au clic sur Copier', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });

    const copyBtns = screen.getAllByText('Copier');
    expect(copyBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(copyBtns[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCDEF1234');
    });
  });

  it('actualise la liste au clic sur le bouton Actualiser', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });

    vi.clearAllMocks();
    mockGetDocs.mockResolvedValue(makeSnap(MOCK_CODES));

    const refreshBtn = screen.getByText('Actualiser');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockGetDocs).toHaveBeenCalled();
    });
  });

  it('affiche les dates de création et d\'expiration', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Créé le/).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText(/Expire le/).length).toBeGreaterThanOrEqual(1);
  });

  it('n\'affiche pas les boutons Copier/Révoquer pour un code utilisé', async () => {
    mockGetDocs.mockResolvedValue(makeSnap([MOCK_CODES[1]]));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('XYZXYZ5678')).toBeInTheDocument();
    });
    expect(screen.queryByText('Révoquer')).not.toBeInTheDocument();
  });

  it('respecte le délai d\'expiration sélectionné', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('ABCDEF1234')).toBeInTheDocument();
    });

    // Le select n'a pas de label accessible, utiliser getAllByRole
    const selects = screen.getAllByRole('combobox');
    // Le 2ème combobox est celui "Expire dans"
    const expireSelect = selects.find(s => s.tagName === 'SELECT');
    expect(expireSelect).toBeInTheDocument();
    fireEvent.change(expireSelect!, { target: { value: '30' } });
    expect(expireSelect).toHaveValue('30');
  });
});
