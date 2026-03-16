import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Hero n'utilise pas AuthContext, juste des données géo
import { Hero } from '../Hero';

describe('Hero', () => {

  it('affiche le titre principal', () => {
    render(<Hero />);
    expect(screen.getByText(/immobilier ivoirien/)).toBeInTheDocument();
    expect(screen.getByText(/certifié & sécurisé/)).toBeInTheDocument();
  });

  it('affiche le sous-titre', () => {
    render(<Hero />);
    expect(screen.getByText(/vérifié par notaire/)).toBeInTheDocument();
  });

  it('affiche le select Type de bien', () => {
    render(<Hero />);
    expect(screen.getByText('Type de bien')).toBeInTheDocument();
  });

  it('affiche le bouton Rechercher', () => {
    render(<Hero />);
    expect(screen.getByText('Rechercher')).toBeInTheDocument();
  });

  it('affiche le résumé localisation par défaut', () => {
    render(<Hero />);
    expect(screen.getByText("Toute la Côte d'Ivoire")).toBeInTheDocument();
  });

  it('appelle onSearch au clic sur Rechercher', () => {
    const onSearch = vi.fn();
    render(<Hero onSearch={onSearch} />);
    fireEvent.click(screen.getByText('Rechercher'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
