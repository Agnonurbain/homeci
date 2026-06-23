import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotaireTabs } from '../NotaireTabs';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('NotaireTabs', () => {
  const mockStats = {
    disponible: 5,
    enCours: 3,
    pret: 2,
    certifie: 10,
  };

  it('affiche les 4 onglets', () => {
    render(<NotaireTabs activeTab="disponible" stats={mockStats} />);
    expect(screen.getByText('Disponibles')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Prêts à certifier')).toBeInTheDocument();
    expect(screen.getByText('Certifiés')).toBeInTheDocument();
  });

  it('affiche les counts sur chaque onglet', () => {
    render(<NotaireTabs activeTab="disponible" stats={mockStats} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applique aria-selected="true" sur l\'onglet actif', () => {
    render(<NotaireTabs activeTab="en_cours" stats={mockStats} />);
    const activeTab = screen.getByRole('tab', { name: /En cours/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('n\'applique pas aria-selected sur les onglets inactifs', () => {
    render(<NotaireTabs activeTab="disponible" stats={mockStats} />);
    const disponibleTab = screen.getByRole('tab', { name: /Disponibles/i });
    expect(disponibleTab).toHaveAttribute('aria-selected', 'true');
    const certifiesTab = screen.getByRole('tab', { name: /Certifiés/i });
    expect(certifiesTab).toHaveAttribute('aria-selected', 'false');
  });
});
