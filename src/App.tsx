import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import PublicPropertyList from './components/PublicPropertyList';
import TenantDashboard from './components/TenantDashboard';
import OwnerAgentDashboard from './components/OwnerAgentDashboard';
import AdminDashboard from './components/AdminDashboard';
import NotaireDashboard from './components/NotaireDashboard';
import AdminAccessCode, { clearSessionCode } from './components/AdminAccessCode';
import AdminLogin from './components/AdminLogin';
import AdminSessionManager from './components/AdminSessionManager';
import RoleSelectModal from './components/RoleSelectModal';

interface HeroFilters {
  propertyType: string;
  propertyTypes: string[];
  verifiedNotaire: boolean;
  transactionType: string;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string;
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [accessCodeValidated, setAccessCodeValidated] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [pendingRoleUser, setPendingRoleUser] = useState<{uid:string;displayName:string;photoURL:string|null}|null>(null);
  const [heroFilters, setHeroFilters] = useState<HeroFilters>({ propertyType: '', propertyTypes: [], verifiedNotaire: false, transactionType: '', district: '', region: '', departement: '', city: '', commune: '', quartier: '' });

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      setIsAdminRoute(path === '/portail-securise' || path === '/admin');
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      checkRoute();
    };
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    if (user && profile?.role === 'admin' && isAdminRoute) {
      setAdminAuthenticated(true);
    } else if (!user) {
      setAdminAuthenticated(false);
      setAccessCodeValidated(false);
      clearSessionCode();
    }
  }, [user, profile, isAdminRoute]);

  useEffect(() => {
    if (user && !isAdminRoute) setShowAuthModal(false);
  }, [user, isAdminRoute]);

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // ── PORTAIL ADMIN ──
  const currentPath = window.location.pathname;
  const isCurrentlyAdminPath = currentPath === '/portail-securise' || currentPath === '/admin';

  if (isAdminRoute && isCurrentlyAdminPath) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      );
    }
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
        }}
      >
        <div className="min-h-screen bg-white">
          <Header onLoginClick={() => handleAuthClick('login')} onSignupClick={() => handleAuthClick('signup')} />
          <main><AdminDashboard /></main>
        </div>
      </AdminSessionManager>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        {/* Kente stripe */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 5 }}>
          {['#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
            '#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
            '#D4A017','#2D6A4F','#C07C3E','#7B1D1D','#D4A017','#2D6A4F'].map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>
        {/* Logo */}
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
        {/* Spinner doré */}
        <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(212,160,23,0.25)', borderTopColor: '#D4A017' }} />
        <p className="text-xs tracking-widest uppercase"
          style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
          Chargement…
        </p>
      </div>
    );
  }

  // ── PAGE PUBLIQUE (non connecté) ──
  if (!user) {
    return (
      <>
        <Header
          onLoginClick={() => handleAuthClick('login')}
          onSignupClick={() => handleAuthClick('signup')}
        />
        <main>
          <Hero onSearch={filters => setHeroFilters(filters)} />
          <PublicPropertyList
            onShowAuth={handleAuthClick}
            initialFilters={heroFilters}
          />
          <Features />
          <Footer />
        </main>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onNewGoogleUser={(data) => setPendingRoleUser(data)}
        />
        {pendingRoleUser && (
          <RoleSelectModal
            uid={pendingRoleUser.uid}
            displayName={pendingRoleUser.displayName}
            photoURL={pendingRoleUser.photoURL}
            onDone={() => setPendingRoleUser(null)}
          />
        )}
      </>
    );
  }

  // ── DASHBOARDS CONNECTÉS ──
  const renderDashboard = () => {
    if (!profile) return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(212,160,23,0.2)', borderTopColor: '#D4A017' }} />
          <p className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
            Chargement…
          </p>
        </div>
      </div>
    );
    switch (profile.role) {
      case 'locataire': return <TenantDashboard />;
      case 'proprietaire':
      case 'agent': return <OwnerAgentDashboard />;
      case 'admin': return <AdminDashboard />;
      case 'notaire': return <NotaireDashboard />;
      default: return <TenantDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={() => handleAuthClick('login')} onSignupClick={() => handleAuthClick('signup')} />
      <main>{renderDashboard()}</main>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onNewGoogleUser={(data) => setPendingRoleUser(data)}
      />
      {pendingRoleUser && (
        <RoleSelectModal
          uid={pendingRoleUser.uid}
          displayName={pendingRoleUser.displayName}
          photoURL={pendingRoleUser.photoURL}
          onDone={() => setPendingRoleUser(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
