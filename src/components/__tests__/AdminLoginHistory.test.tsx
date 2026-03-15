import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

import AdminLoginHistory from '../AdminLoginHistory';

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.getDocs.mockReset();
});

describe('AdminLoginHistory', () => {

  it('affiche le titre Historique des Connexions', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] });
    render(<AdminLoginHistory />);
    await waitFor(() => {
      expect(screen.getByText('Historique des Connexions')).toBeInTheDocument();
    });
  });

  it('affiche "Aucune tentative" quand la liste est vide', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [] });
    render(<AdminLoginHistory />);
    await waitFor(() => {
      expect(screen.getByText('Aucune tentative enregistrée')).toBeInTheDocument();
    });
  });

  it('affiche les tentatives de connexion', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'log-1',
          data: () => ({
            email: 'admin@homeci.ci',
            attempted_at: '2026-03-10T10:30:00Z',
            ip_address: null,
            success: true,
            user_agent: 'Mozilla/5.0 Chrome/120',
            role: 'admin',
          }),
        },
        {
          id: 'log-2',
          data: () => ({
            email: 'hacker@evil.com',
            attempted_at: '2026-03-10T11:00:00Z',
            ip_address: null,
            success: false,
            user_agent: 'curl/7.0',
            role: 'admin',
          }),
        },
      ],
    });

    render(<AdminLoginHistory />);

    await waitFor(() => {
      expect(screen.getByText('admin@homeci.ci')).toBeInTheDocument();
      expect(screen.getByText('hacker@evil.com')).toBeInTheDocument();
    });
  });
});
