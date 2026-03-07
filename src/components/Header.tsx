import { Building2, Heart, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HColors, HAlpha } from '../styles/homeci-tokens';

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

  const navLink = "text-sm transition-all duration-200 hover:opacity-100";

  return (
    <header className="sticky top-0 z-50"
      style={{ background:'rgba(10,22,14,0.96)', backdropFilter:'blur(12px)',
               borderBottom:'1px solid rgba(212,160,23,0.15)' }}>

      {/* Thin kente top line */}
      <div className="w-full flex" style={{ height:3 }}>
        {[HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
          HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
          HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D'].map((c,i) => (
          <div key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background:HColors.gold }}>
              <Building2 className="w-4 h-4" style={{ color:HColors.night }} />
            </div>
            <span className="text-xl font-bold tracking-widest"
              style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', letterSpacing:'0.18em' }}>
              HOMECI
            </span>
            <span className="hidden sm:inline text-xs ml-1"
              style={{ color:'rgba(212,160,23,0.6)', fontFamily:'var(--font-nunito)' }}>
              Côte d'Ivoire
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {[
              { href:'#search', label:'Rechercher' },
              { href:'#properties', label:'Biens' },
            ].map(l => (
              <a key={l.label} href={l.href} className={navLink}
                style={{ color:'rgba(245,230,200,0.7)', fontFamily:'var(--font-nunito)' }}>
                {l.label}
              </a>
            ))}
            {user && (
              <>
                <a href="#favorites" className={navLink}
                  style={{ color:'rgba(245,230,200,0.7)', fontFamily:'var(--font-nunito)' }}>
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />Favoris</span>
                </a>
                {(profile?.role === 'proprietaire') && (
                  <a href="#dashboard" className={navLink}
                    style={{ color:'rgba(245,230,200,0.7)', fontFamily:'var(--font-nunito)' }}>
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
                  style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
                  <User className="w-3.5 h-3.5" style={{ color:HColors.gold }} />
                  <span className="text-sm font-medium" style={{ color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
                    {profile?.full_name}
                  </span>
                  <span className="text-xs capitalize" style={{ color:'rgba(212,160,23,0.7)' }}>
                    ({profile?.role})
                  </span>
                </div>
                <button onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </div>
            ) : (
              <>
                <button onClick={onLoginClick}
                  className="text-sm transition-all hover:opacity-100"
                  style={{ color:'rgba(245,230,200,0.75)', fontFamily:'var(--font-nunito)' }}>
                  Connexion
                </button>
                <button onClick={onSignupClick}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                  Inscription
                </button>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen
              ? <X className="w-6 h-6" style={{ color:HColors.cream }} />
              : <Menu className="w-6 h-6" style={{ color:HColors.cream }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4" style={{ borderTop:'1px solid rgba(212,160,23,0.15)' }}>
            <div className="flex flex-col gap-4" style={{ fontFamily:'var(--font-nunito)' }}>
              <a href="#search"  style={{ color:'rgba(245,230,200,0.8)' }}>Rechercher</a>
              <a href="#properties" style={{ color:'rgba(245,230,200,0.8)' }}>Biens</a>
              {user ? (
                <>
                  <a href="#favorites" style={{ color:'rgba(245,230,200,0.8)' }}>Favoris</a>
                  {(profile?.role === 'proprietaire') && (
                    <a href="#dashboard" style={{ color:'rgba(245,230,200,0.8)' }}>Mes biens</a>
                  )}
                  <div className="pt-2" style={{ borderTop:'1px solid rgba(212,160,23,0.15)' }}>
                    <p className="text-sm font-medium" style={{ color:HColors.cream }}>{profile?.full_name}</p>
                    <p className="text-xs capitalize mt-0.5" style={{ color:'rgba(212,160,23,0.7)' }}>{profile?.role}</p>
                    <button onClick={() => { setShowLogoutConfirm(true); setMobileMenuOpen(false); }}
                      className="mt-2 text-sm" style={{ color:HColors.terracotta }}>Déconnexion</button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }}
                    className="text-left" style={{ color:'rgba(245,230,200,0.8)' }}>Connexion</button>
                  <button onClick={() => { onSignupClick?.(); setMobileMenuOpen(false); }}
                    className="text-left font-semibold" style={{ color:HColors.gold }}>Inscription</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl"
            style={{ background:HColors.night, border:'1px solid rgba(212,160,23,0.3)' }}>
            <h3 className="text-xl font-bold mb-3"
              style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)' }}>
              Confirmer la déconnexion
            </h3>
            <p className="mb-6 text-sm" style={{ color:'rgba(245,230,200,0.65)', fontFamily:'var(--font-nunito)' }}>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ border:'1px solid rgba(212,160,23,0.3)', color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
                Annuler
              </button>
              <button onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background:HColors.bordeaux, color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
