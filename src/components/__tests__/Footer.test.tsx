import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../Footer';

describe('Footer', () => {

  it('affiche le logo HOMECI', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByText('HOMECI')).toBeInTheDocument();
  });

  it('affiche le copyright 2026', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByText(/2026 HOMECI/)).toBeInTheDocument();
  });

  it('affiche la section Contact', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('contact@homeci.ci')).toBeInTheDocument();
  });

  it('affiche les liens légaux', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByText("Conditions d'utilisation")).toBeInTheDocument();
    expect(screen.getByText('Politique de confidentialité')).toBeInTheDocument();
    expect(screen.getByText('Mentions légales')).toBeInTheDocument();
  });

  it('affiche la devise nationale', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByText(/Union, Discipline, Travail/)).toBeInTheDocument();
  });
});
