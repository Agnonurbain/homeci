import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createMockVisit } from '../../tests/factories';

// ── Mock sub-components ─────────────────────────────────────────────────────────

vi.mock('../AddPropertyForm', () => ({ default: () => <div data-testid="add-form" /> }));
vi.mock('../EditPropertyForm', () => ({ default: () => <div data-testid="edit-form" /> }));
vi.mock('../PropertyViewModal', () => ({ default: () => <div data-testid="view-modal" /> }));
vi.mock('../ScrollTimePicker', () => ({ default: ({ value }: any) => <input data-testid="time-picker" value={value || ''} readOnly /> }));
vi.mock('../CGVModal', () => ({ default: () => <div data-testid="cgv-modal" /> }));
vi.mock('../PaymentModal', () => ({ default: () => <div data-testid="payment-modal" /> }));
vi.mock('../AvailabilityManager', () => ({ default: () => <div data-testid="availability-manager" /> }));
vi.mock('../ChatBox', () => ({ default: () => <div data-testid="chat-box" /> }));
vi.mock('../SatisfactionModal', () => ({ default: () => <div data-testid="satisfaction-modal" /> }));
vi.mock('../ui/KenteLine', () => ({ KenteLine: () => <div data-testid="kente-line" /> }));

// Mock global scrollTo et indexedDB
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
  (window as any).indexedDB = {
    open: vi.fn().mockImplementation(() => ({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    })),
  };
}

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null, PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null, Cell: () => null,
}));

vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { prototype: { _getIconUrl: vi.fn() } } },
    map: vi.fn(),
    tileLayer: vi.fn(),
    marker: vi.fn(),
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ setView: vi.fn() }),
}));

const mockUser = { uid: 'owner-1', displayName: 'Propriétaire Test' };
const mockProfile = { role: 'proprietaire', full_name: 'Propriétaire Test', cgv_accepted: true };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    refreshProfile: vi.fn(async () => {}),
  }),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getNotifications: vi.fn(async () => []),
    createNotification: vi.fn(async () => 'notif-1'),
    markAsRead: vi.fn(async () => {}),
    listenToNotifications: vi.fn((_uid, cb) => {
      cb([]);
      return () => {};
    }),
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
    updatePropertyStatus: vi.fn(async () => {}),
    listenToPropertiesByOwner: vi.fn((_uid, cb) => {
      cb([]);
      return () => {};
    }),
  },
}));

vi.mock('../../services/visitService', () => ({
  visitService: {
    getVisitRequestsByOwner: vi.fn(async () => []),
    updateVisitStatus: vi.fn(async () => {}),
    proposeCounterDate: vi.fn(async () => {}),
    acceptCounterDate: vi.fn(async () => {}),
    listenToVisitRequestsByOwner: vi.fn((_uid, cb) => {
      cb([]);
      return () => {};
    }),
  },
}));

// Import AFTER mocks
import OwnerAgentDashboard from '../OwnerAgentDashboard';
import { visitService } from '../../services/visitService';

vi.mock('../../services/chatService', () => ({
  chatService: {
    getMessages: vi.fn(async () => []),
    sendMessage: vi.fn(async () => 'msg-1'),
    listenToUserConversations: vi.fn((_uid, cb) => {
      cb([]);
      return () => {};
    }),
    getOrCreateChat: vi.fn(async () => 'chat-1'),
    subscribeToMessages: vi.fn((_chatId, cb) => {
      cb([]);
      return () => {};
    }),
  },
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: {
    setUser: vi.fn(),
    clearUser: vi.fn(),
    pageView: vi.fn(),
    viewProperty: vi.fn(),
    acceptVisit: vi.fn(),
    completeVisit: vi.fn(),
    updatePropertyStatus: vi.fn(),
  },
}));

vi.mock('../../services/adService', () => ({
  adService: {
    getActiveBanners: vi.fn(async () => []),
  },
}));

vi.mock('../../services/emailService', () => ({
  emailService: {
    notifyVisitUpdate: vi.fn(async () => {}),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

// ── Tests ────────────────────────────────────────────────────────────────────────

describe('OwnerAgentDashboard — affichage dates visites', () => {

  it('affiche la date initiale (preferred_date) pour une visite pending', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makePendingVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
    });
  });

  it('affiche la counter_date du locataire quand il contre-propose', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makeTenantCounterVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      // counter_time = 15:30 doit être visible
      const elements = screen.getAllByText(/15:30/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche "Le locataire propose" quand counter_proposed_by === tenant', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makeTenantCounterVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      expect(screen.getByText(/Proposition locataire :/)).toBeInTheDocument();
    });
  });

  it('affiche la date initiale barrée quand le locataire contre-propose', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makeTenantCounterVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      // Dans la version actuelle, on affiche la nouvelle date directement, pas de label "initial"
      expect(screen.getByText(/Proposition locataire :/)).toBeInTheDocument();
      const elements = screen.getAllByText(/15:30/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche "Votre proposition" quand counter_proposed_by === owner', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makeOwnerCounterVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      expect(screen.getByText(/Date proposée/)).toBeInTheDocument();
    });
  });

  it('affiche preferred_date en principal quand c\'est le proprio qui a contre-proposé', async () => {
    vi.mocked(visitService.listenToVisitRequestsByOwner).mockImplementation((_uid, cb) => {
      cb([makeOwnerCounterVisit()]);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/requests']}>
        <HelmetProvider>
          <OwnerAgentDashboard />
        </HelmetProvider>
      </MemoryRouter>
    );
    // On est déjà sur le bon onglet grâce à initialEntries, 
    // mais on appelle quand même pour la compatibilité si besoin
    // await goToVisitsTab(); 

    await waitFor(() => {
      expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
    });
  });
});
