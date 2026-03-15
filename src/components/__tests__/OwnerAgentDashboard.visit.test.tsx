import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';
import { createMockVisit } from '../../tests/factories';

const { Timestamp } = firestoreMocks;

// ── Mock sub-components ─────────────────────────────────────────────────────────

vi.mock('../AddPropertyForm', () => ({ default: () => <div data-testid="add-form" /> }));
vi.mock('../EditPropertyForm', () => ({ default: () => <div data-testid="edit-form" /> }));
vi.mock('../PropertyViewModal', () => ({ default: () => <div data-testid="view-modal" /> }));
vi.mock('../ScrollTimePicker', () => ({ default: ({ value }: any) => <input data-testid="time-picker" value={value || ''} readOnly /> }));
vi.mock('../CGVModal', () => ({ default: () => <div data-testid="cgv-modal" /> }));
vi.mock('../PaymentModal', () => ({ default: () => <div data-testid="payment-modal" /> }));
vi.mock('../ui/KenteLine', () => ({ KenteLine: () => <div data-testid="kente-line" /> }));

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null, PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null, Cell: () => null,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'owner-1', displayName: 'Propriétaire Test' },
    profile: { role: 'proprietaire', full_name: 'Propriétaire Test', cgv_accepted: true },
  }),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn(async () => []),
    createNotification: vi.fn(async () => 'notif-1'),
    markAsRead: vi.fn(async () => {}),
  },
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertiesByOwner: vi.fn(async () => []),
    getProperties: vi.fn(async () => []),
    getAllProperties: vi.fn(async () => []),
    createProperty: vi.fn(async () => 'prop-1'),
    updateProperty: vi.fn(async () => {}),
    deleteProperty: vi.fn(async () => {}),
    getDocuments: vi.fn(async () => []),
  },
}));

vi.mock('../../services/visitService', () => ({
  visitService: {
    getVisitRequestsByOwner: vi.fn(async () => []),
    updateVisitStatus: vi.fn(async () => {}),
    proposeCounterDate: vi.fn(async () => {}),
    acceptCounterDate: vi.fn(async () => {}),
  },
}));

// Import AFTER mocks
import OwnerAgentDashboard from '../OwnerAgentDashboard';
import { visitService } from '../../services/visitService';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────────────────

function makePendingVisit() {
  return createMockVisit({
    id: 'visit-pending',
    preferred_date: '2026-05-10',
    preferred_time: '09:00',
    status: 'pending',
  });
}

function makeTenantCounterVisit() {
  return createMockVisit({
    id: 'visit-counter-tenant',
    preferred_date: '2026-05-10',
    preferred_time: '09:00',
    status: 'counter_proposed',
    counter_date: '2026-05-18',
    counter_time: '15:30',
    counter_proposed_by: 'tenant',
  });
}

function makeOwnerCounterVisit() {
  return createMockVisit({
    id: 'visit-counter-owner',
    preferred_date: '2026-05-10',
    preferred_time: '09:00',
    status: 'counter_proposed',
    counter_date: '2026-05-20',
    counter_time: '11:00',
    counter_proposed_by: 'owner',
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────────

describe('OwnerAgentDashboard — affichage dates visites', () => {

  it('affiche la date initiale (preferred_date) pour une visite pending', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makePendingVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      // preferred_date = 2026-05-10 → "10/05/2026" en fr-FR
      expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
    });
  });

  it('affiche la counter_date du locataire en date principale (pas preferred_date)', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makeTenantCounterVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      // counter_date = 2026-05-18 → doit apparaître quelque part avec "18" et "mai"
      const dateElements = screen.getAllByText(/18/);
      expect(dateElements.length).toBeGreaterThanOrEqual(1);

      // counter_time = 15:30 doit être visible
      expect(screen.getAllByText(/15:30/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche "Le locataire propose" quand counter_proposed_by === tenant', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makeTenantCounterVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Le locataire propose/)).toBeInTheDocument();
    });
  });

  it('affiche la date initiale barrée quand le locataire contre-propose', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makeTenantCounterVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      // "initial" text appears with strikethrough showing the original date
      const initialEl = screen.getByText(/initial/i);
      expect(initialEl).toBeInTheDocument();
      // The original date "10/05/2026" should appear in the strikethrough section
      expect(initialEl.textContent).toContain('10/05/2026');
      expect(initialEl.textContent).toContain('09:00');
    });
  });

  it('affiche "Votre proposition" quand counter_proposed_by === owner', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makeOwnerCounterVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Votre proposition/)).toBeInTheDocument();
    });
  });

  it('affiche preferred_date en principal quand c\'est le proprio qui a contre-proposé', async () => {
    vi.mocked(visitService.getVisitRequestsByOwner).mockResolvedValueOnce([makeOwnerCounterVisit()]);

    render(<OwnerAgentDashboard />);

    await waitFor(() => {
      // Quand c'est le proprio qui contre-propose, la date principale reste preferred_date
      expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
    });
  });
});
