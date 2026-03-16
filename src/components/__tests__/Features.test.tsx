import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Features } from '../Features';

describe('Features', () => {

  it('affiche le titre Pourquoi HOMECI', () => {
    render(<Features />);
    expect(screen.getByText(/Pourquoi HOMECI/)).toBeInTheDocument();
  });

  it('affiche les 6 fonctionnalités', () => {
    render(<Features />);
    expect(screen.getByText('Vérification Notaire')).toBeInTheDocument();
    expect(screen.getByText('Annonces Certifiées')).toBeInTheDocument();
    expect(screen.getByText('Paiements Mobile Money')).toBeInTheDocument();
    expect(screen.getByText('14 Districts Couverts')).toBeInTheDocument();
    expect(screen.getByText('Support 24/7')).toBeInTheDocument();
    expect(screen.getByText('Contrats Automatiques')).toBeInTheDocument();
  });

  it('affiche les descriptions des fonctionnalités', () => {
    render(<Features />);
    expect(screen.getByText(/Orange Money/)).toBeInTheDocument();
    expect(screen.getByText(/zéro arnaque/i)).toBeInTheDocument();
    expect(screen.getByText(/Abidjan/)).toBeInTheDocument();
  });
});
