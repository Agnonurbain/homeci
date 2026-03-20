import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[HOMECI] ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)', padding: '1rem',
      }}>
        {/* Kente */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', height: 4 }}>
          {['#FF6B00','#009E49','#FFFFFF','#D4A017','#FF6B00','#009E49','#FFFFFF','#D4A017',
            '#FF6B00','#009E49','#FFFFFF','#D4A017'].map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>

        <div style={{
          maxWidth: 420, width: '100%', background: 'rgba(13,31,18,0.8)',
          border: '1px solid rgba(212,160,23,0.25)', borderRadius: 16,
          padding: 32, textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(139,29,29,0.15)', border: '2px solid rgba(139,29,29,0.3)',
            fontSize: 28,
          }}>
            ⚠️
          </div>

          <h1 style={{
            color: '#F5E6C8', fontFamily: 'Georgia, serif', fontSize: '1.5rem',
            fontWeight: 700, marginBottom: 8,
          }}>
            Oups, une erreur s'est produite
          </h1>

          <p style={{
            color: 'rgba(245,230,200,0.5)', fontFamily: 'sans-serif', fontSize: '0.875rem',
            marginBottom: 24, lineHeight: 1.5,
          }}>
            L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.
          </p>

          {/* Error details (dev only) */}
          {this.state.error && (
            <div style={{
              background: 'rgba(139,29,29,0.1)', border: '1px solid rgba(139,29,29,0.2)',
              borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'left',
            }}>
              <p style={{
                color: 'rgba(255,170,170,0.8)', fontFamily: 'monospace', fontSize: '0.7rem',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </p>
            </div>
          )}

          <button onClick={this.handleReload}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
              color: '#FFFFFF', fontFamily: 'sans-serif', fontSize: '0.875rem',
              fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>
            Retour à l'accueil
          </button>

          <p style={{
            color: 'rgba(245,230,200,0.25)', fontFamily: 'sans-serif', fontSize: '0.65rem',
            marginTop: 16,
          }}>
            HOMECI — L'immobilier ivoirien, certifié et sécurisé
          </p>
        </div>
      </div>
    );
  }
}
