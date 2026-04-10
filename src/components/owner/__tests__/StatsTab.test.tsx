/**
 * HOMECI — Tests: StatsTab (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsTab from '../StatsTab';

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: vi.fn(({ children }) => <div data-testid="bar-chart">{children}</div>),
  Bar: vi.fn(() => <div data-testid="bar" />),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
  CartesianGrid: vi.fn(() => null),
  Tooltip: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => <div data-testid="responsive-container">{children}</div>),
  PieChart: vi.fn(({ children }) => <div data-testid="pie-chart">{children}</div>),
  Pie: vi.fn(() => <div data-testid="pie" />),
  Cell: vi.fn(() => null),
  LineChart: vi.fn(({ children }) => <div data-testid="line-chart">{children}</div>),
  Line: vi.fn(() => <div data-testid="line" />),
  Legend: vi.fn(() => null),
}));

const defaultStats = { total: 5, views: 120, published: 3, pending: 1, rented_sold: 1, verified: 2 };
const chartData = [{ name: 'Bien 1', vues: 50 }];

function renderTab(overrides: Partial<React.ComponentProps<typeof StatsTab>> = {}) {
  const props = {
    stats: defaultStats,
    totalVisits: 3,
    viewsChartData: chartData,
    typeChartData: [{ name: 'Appartement', value: 3 }],
    monthlyChartData: [{ name: 'Jan', biens: 1 }],
    ...overrides,
  };
  render(<StatsTab {...props} />);
  return props;
}

describe('StatsTab', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Statistiques"', () => {
    renderTab();
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
  });

  it('affiche les 4 cartes de statistiques', () => {
    renderTab({ stats: { total: 5, views: 120, published: 3, pending: 1, rented_sold: 1, verified: 2 }, totalVisits: 3 });
    expect(screen.getByText('Total biens')).toBeInTheDocument();
    expect(screen.getByText('Vues totales')).toBeInTheDocument();
    expect(screen.getByText('Visites demandées')).toBeInTheDocument();
    expect(screen.getByText('Biens vérifiés')).toBeInTheDocument();
  });

  it('affiche les valeurs correctes dans les cartes', () => {
    renderTab({ stats: { total: 5, views: 120, published: 3, pending: 1, rented_sold: 1, verified: 2 }, totalVisits: 3 });
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('affiche le graphique en barres avec les données', () => {
    renderTab({ viewsChartData: [{ name: 'Bien A', vues: 50 }] });
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('affiche le message vide si pas de données de vues', () => {
    renderTab({ viewsChartData: [] });
    expect(screen.getByText(/Ajoutez des biens/)).toBeInTheDocument();
  });

  it('affiche le graphique en camembert', () => {
    renderTab({ typeChartData: [{ name: 'Appartement', value: 3 }] });
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('affiche le message vide si pas de données par type', () => {
    renderTab({ typeChartData: [] });
    expect(screen.getByText(/Aucun bien à afficher/)).toBeInTheDocument();
  });

  it('affiche le graphique linéaire mensuel', () => {
    renderTab({ monthlyChartData: [{ name: 'Jan', biens: 1 }] });
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('affiche les titres des graphiques', () => {
    renderTab();
    expect(screen.getByText(/Vues par bien/)).toBeInTheDocument();
    expect(screen.getByText(/Répartition par type/)).toBeInTheDocument();
    expect(screen.getByText(/Biens ajoutés/)).toBeInTheDocument();
  });
});
