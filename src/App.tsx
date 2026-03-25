import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import PublicPropertyList from './components/PublicPropertyList';
import AdminAccessCode, { clearSessionCode } from './components/AdminAccessCode';
import AdminLogin from './components/AdminLogin';
import AdminSessionManager from './components/AdminSessionManager';
import RoleSelectModal from './components/RoleSelectModal';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './components/NotFoundPage';
import ProfileModal from './components/ProfileModal';
import { pushService } from './services/pushNotificationService';
import { HColors, HAlpha } from './styles/homeci-tokens';
import { SEO } from './components/SEO';

// ── Lazy-loaded dashboards (4700+ lignes chargées à la demande) ──
const TenantDashboard = lazy(() => import('./components/TenantDashboard'));
const OwnerAgentDashboard = lazy(() => import('./components/OwnerAgentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const NotaireDashboard = lazy(() => import('./components/NotaireDashboard'));
const FAQPage = lazy(() => import('./components/FAQPage'));

interface HeroFilters {
  propertyType: string;
  propertyTypes: string[];
  verifiedNotaire: boolean;
  transactionType: string;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string;
}

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

function AppContent() {
  const { user, profile, loading, pendingNewUser, clearPendingNewUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [accessCodeValidated, setAccessCodeValidated] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [heroFilters, setHeroFilters] = useState<HeroFilters>({ propertyType: '', propertyTypes: [], verifiedNotaire: false, transactionType: '', district: '', region: '', departement: '', city: '', commune: '', quartier: '' });
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();

  // ── FCM : demander la permission push après connexion ──
  const [pushToast, setPushToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    const timer = setTimeout(() => {
      pushService.requestPermissionAndRegister(user.uid).catch(() => {});
    }, 3000);
    // Écouter les messages en premier plan
    pushService.onForegroundMessage((payload) => {
      setPushToast({ title: payload.title, body: payload.body });
      setTimeout(() => setPushToast(null), 5000);
    });
    return () => clearTimeout(timer);
  }, [user, profile]);

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // ── Lazy loading fallback ──
  const LazyFallback = (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: HColors.creamBg }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
        style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
      <p className="text-xs tracking-widest uppercase"
        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        Chargement…
      </p>
    </div>
  );

  // Global loading state (Auth checking)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 5 }}>
          {['#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
            '#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
            '#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F'].map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(212,160,23,0.15)', border: '2px solid rgba(212,160,23,0.4)' }}>
            <span style={{ fontSize: '1.4rem' }}>🏛</span>
          </div>
          <span className="font-bold tracking-widest"
            style={{ color: '#F5E6C8', fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', letterSpacing: '0.15em' }}>
            HOMECI
          </span>
        </div>
        <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(212,160,23,0.25)', borderTopColor: '#D4A017' }} />
        <p className="text-xs tracking-widest uppercase"
          style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
          Chargement…
        </p>
      </div>
    );
  }

  const renderDashboard = () => {
    if (pendingNewUser) return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(212,160,23,0.2)', borderTopColor: '#D4A017' }} />
          <p className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
            Configuration du compte…
          </p>
        </div>
      </div>
    );
    if (!profile) return LazyFallback;
    switch (profile.role) {
      case 'locataire': return <Suspense fallback={LazyFallback}><TenantDashboard /></Suspense>;
      case 'proprietaire': return <Suspense fallback={LazyFallback}><OwnerAgentDashboard /></Suspense>;
      case 'admin': return <Suspense fallback={LazyFallback}><AdminDashboard /></Suspense>;
      case 'notaire': return <Suspense fallback={LazyFallback}><NotaireDashboard /></Suspense>;
      default: return <Suspense fallback={LazyFallback}><TenantDashboard /></Suspense>;
    }
  };

  const AdminRoute = () => {
    if (!adminAuthenticated || profile?.role !== 'admin') return <AdminLogin onSuccess={() => setAdminAuthenticated(true)} />;
    if (!accessCodeValidated) return <AdminAccessCode onSuccess={() => setAccessCodeValidated(true)} />;
    return (
      <AdminSessionManager
        timeoutMinutes={profile?.session_timeout_minutes || 30}
        onTimeout={() => {
          setAdminAuthenticated(false);
          setAccessCodeValidated(false);
          clearSessionCode();
          alert("Votre session a expiré. Veuillez vous reconnecter.");
          navigate('/');
        }}
      >
        <div className="min-h-screen bg-white">
          <Header onLoginClick={() => handleAuthClick('login')} onSignupClick={() => handleAuthClick('signup')} onProfileClick={() => setShowProfile(true)} />
          <main><Suspense fallback={LazyFallback}><AdminDashboard /></Suspense></main>
        </div>
      </AdminSessionManager>
    );
  };

  // Common Layout for public pages
  const PublicLayout = ({ children }: { children: React.ReactNode }) => (
    <>
      <Header onLoginClick={() => handleAuthClick('login')} onSignupClick={() => handleAuthClick('signup')} onProfileClick={() => setShowProfile(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Routes>
        {/* Route Publique / Accueil */}
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> :
          <PublicLayout>
            <SEO />
            <main>
              <Hero onSearch={filters => setHeroFilters(filters)} />
              <PublicPropertyList onShowAuth={handleAuthClick} initialFilters={heroFilters} />
              <Features />
            </main>
          </PublicLayout>
        } />

        {/* Route Bien Spécifique (accessible connecté ou non) */}
        <Route path="/bien/:id" element={
          <PublicLayout>
            <SEO />
            <main>
              <Hero onSearch={filters => setHeroFilters(filters)} />
              <PublicPropertyList onShowAuth={handleAuthClick} initialFilters={heroFilters} />
              <Features />
            </main>
          </PublicLayout>
        } />

        {/* FAQ */}
        <Route path="/faq" element={
          <PublicLayout>
            <Suspense fallback={LazyFallback}><FAQPage /></Suspense>
          </PublicLayout>
        } />

        {/* Dashboard Connecté */}
        <Route path="/dashboard/*" element={
          !user ? <Navigate to="/" replace /> :
          <>
            <Header onLoginClick={() => handleAuthClick('login')} onSignupClick={() => handleAuthClick('signup')} onProfileClick={() => setShowProfile(true)} />
            <main className="flex-1">{renderDashboard()}</main>
          </>
        } />

        {/* Admin Portail */}
        <Route path="/portail-securise" element={<AdminRoute />} />
        <Route path="/admin" element={<Navigate to="/portail-securise" replace />} />

        {/* 404 */}
        <Route path="*" element={
          <PublicLayout>
            <NotFoundPage />
          </PublicLayout>
        } />
      </Routes>

      {/* Modals Globaux */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
      {pendingNewUser && (
        <RoleSelectModal uid={pendingNewUser.uid} displayName={pendingNewUser.displayName} photoURL={pendingNewUser.photoURL} onDone={() => clearPendingNewUser()} />
      )}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* Push notification toast (foreground) */}
      {pushToast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-slide-in-right"
          style={{ animation: 'slideInRight 0.3s ease-out' }}>
          <div className="rounded-xl p-4 shadow-2xl flex items-start gap-3"
            style={{ background: HColors.night, border: `1px solid ${HAlpha.orange25}` }}
            onClick={() => setPushToast(null)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: HAlpha.orange10 }}>
              <img src="/favicon-192x192.png" alt="" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                {pushToast.title}
              </p>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                {pushToast.body}
              </p>
            </div>
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
