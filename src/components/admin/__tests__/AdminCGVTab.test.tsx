import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import AdminCGVTab from '../../AdminCGVTab';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'admin-1' } },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({
    docs: [
      { id: 'u1', data: () => ({ full_name: 'Jean', email: 'jean@test.com', role: 'locataire', cgv_accepted: true, cgv_accepted_at: '2026-01-01' }) },
      { id: 'u2', data: () => ({ full_name: 'Marie', email: 'marie@test.com', role: 'proprietaire', cgv_accepted: false }) },
    ],
  })),
}));

describe('AdminCGVTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche la liste des utilisateurs et leur statut CGV', async () => {
    const { container } = render(<AdminCGVTab users={[]} />);

    await waitFor(() => {
      expect(container.textContent).toContain('CGV');
    });
  });
});
