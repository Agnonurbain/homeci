import { Heart, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HomeCIEmblem } from './HomeCIEmblem';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha, HGradients } from '../styles/homeci-tokens';

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
      if (window.location.pathname === '/portail-securise' || window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    } catch (error) { console.error('Error logging out:', error); }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Bande Kente signature */}
      <KenteLine height={3} />

      <nav style={{ background: 'rgba(10,61,31,0.96)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">

            {/* Logo */}
            <HomeCIEmblem variant="header" />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              {[
                { href: '#search', label: 'Rechercher' },
                { href: '#properties', label: 'Biens' },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="text-sm transition-all duration-200 hover:opacity-100"
                  style={{ color: HAlpha.white70, fontFamily: 'var(--font-nunito)' }}>
                  {l.label}
                </a>
              ))}
              {user && (
                <>
                  <a href="#favorites"
                    className="text-sm transition-all duration-200 hover:opacity-100"
                    style={{ color: HAlpha.white70, fontFamily: 'var(--font-nunito)' }}>
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" /> Favoris
                    </span>
                  </a>
                  {profile?.role === 'proprietaire' && (
                    <a href="#dashboard"
                      className="text-sm transition-all duration-200 hover:opacity-100"
                      style={{ color: HAlpha.white70, fontFamily: 'var(--font-nunito)' }}>
                      Mes biens
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange20}` }}>
                    <User className="w-3.5 h-3.5" style={{ color: HColors.orangeCI }} />
                    <span className="text-sm font-medium"
                      style={{ color: HColors.white, fontFamily: 'var(--font-nunito)' }}>
                      {profile?.full_name}
                    </span>
                    <span className="text-xs capitalize" style={{ color: HAlpha.gold50 }}>
                      ({profile?.role})
                    </span>
                  </div>
                  <button onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: HAlpha.white50, fontFamily: 'var(--font-nunito)' }}>
                    <LogOut className="w-3.5 h-3.5" /> Déconnexion
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={onLoginClick}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                    style={{ border: '1px solid rgba(255,255,255,0.25)', color: HColors.white,
                             fontFamily: 'var(--font-nunito)' }}>
                    Connexion
                  </button>
                  <button onClick={onSignupClick}
                    className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: HColors.orangeCI, color: HColors.white,
                             fontFamily: 'var(--font-nunito)' }}>
                    S'inscrire
                  </button>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen
                ? <X className="w-6 h-6" style={{ color: HColors.white }} />
                : <Menu className="w-6 h-6" style={{ color: HColors.white }} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4" style={{ borderTop: '1px solid rgba(212,160,23,0.15)' }}>
              <div className="flex flex-col gap-4" style={{ fontFamily: 'var(--font-nunito)' }}>
                <a href="#search" style={{ color: HAlpha.white70 }}>Rechercher</a>
                <a href="#properties" style={{ color: HAlpha.white70 }}>Biens</a>
                {user ? (
                  <>
                    <a href="#favorites" style={{ color: HAlpha.white70 }}>Favoris</a>
                    {profile?.role === 'proprietaire' && (
                      <a href="#dashboard" style={{ color: HAlpha.white70 }}>Mes biens</a>
                    )}
                    <div className="pt-2" style={{ borderTop: '1px solid rgba(212,160,23,0.15)' }}>
                      <p className="text-sm font-medium" style={{ color: HColors.white }}>{profile?.full_name}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: HAlpha.gold50 }}>{profile?.role}</p>
                      <button onClick={() => { setShowLogoutConfirm(true); setMobileMenuOpen(false); }}
                        className="mt-2 text-sm" style={{ color: HColors.orangeCI }}>Déconnexion</button>
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }}
                      className="text-left" style={{ color: HAlpha.white70 }}>Connexion</button>
                    <button onClick={() => { onSignupClick?.(); setMobileMenuOpen(false); }}
                      className="text-left font-semibold" style={{ color: HColors.orangeCI }}>S'inscrire</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl"
            style={{ background: HColors.night, border: `1px solid ${HAlpha.gold30}` }}>
            <KenteLine height={3} className="mb-4 -mx-6 -mt-6 rounded-t-2xl overflow-hidden" />
            <h3 className="text-xl font-bold mb-3"
              style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              Confirmer la déconnexion
            </h3>
            <p className="mb-6 text-sm" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ border: `1px solid ${HAlpha.gold20}`, color: HColors.cream,
                         fontFamily: 'var(--font-nunito)' }}>
                Annuler
              </button>
              <button onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: HColors.bordeaux, color: HColors.white,
                         fontFamily: 'var(--font-nunito)' }}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
