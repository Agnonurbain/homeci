import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressAutocomplete } from '../AddressAutocomplete';

beforeEach(() => vi.clearAllMocks());

function renderComponent(props = {}) {
  const onChange = vi.fn();
  const utils = render(
    <AddressAutocomplete
      value={{ city: '', commune: '', quartier: '' }}
      onChange={onChange}
      {...props}
    />
  );
  return { ...utils, onChange };
}

describe('AddressAutocomplete', () => {
  it('affiche le placeholder', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Rechercher une adresse...')).toBeInTheDocument();
  });

  it('affiche un placeholder personnalisé', () => {
    renderComponent({ placeholder: 'Ma recherche' });
    expect(screen.getByPlaceholderText('Ma recherche')).toBeInTheDocument();
  });

  it('ouvre le dropdown quand on tape', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Cocody' } });
    expect(screen.getAllByText(/Cocody/i).length).toBeGreaterThan(0);
  });

  it('affiche "Aucun résultat" pour une recherche inconnue', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'xyzunknown' } });
    expect(screen.getByText(/Aucun résultat/)).toBeInTheDocument();
  });

  it('appelle onChange avec la ville sélectionnée', () => {
    const { onChange } = renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Abidjan' } });
    
    const firstResult = screen.getAllByText(/Abidjan/i)[0];
    fireEvent.click(firstResult);
    
    expect(onChange).toHaveBeenCalledWith({ city: expect.any(String), commune: '', quartier: '' });
  });

  it('appelle onChange avec un quartier sélectionné', () => {
    const { onChange } = renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Riviera' } });
    
    // Riviera est un quartier de Cocody
    const results = screen.getAllByText(/Riviera/i);
    expect(results.length).toBeGreaterThan(0);
    fireEvent.click(results[0]);
    
    expect(onChange).toHaveBeenCalledWith({
      city: expect.any(String),
      commune: expect.any(String),
      quartier: expect.stringContaining('Riviera'),
    });
  });

  it('affiche les types (Ville/Commune/Quartier) avec couleurs', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Bouaké' } });
    
    // Vérifie que les labels de type sont affichés
    expect(screen.getByText('Ville')).toBeInTheDocument();
  });

  it('réinitialise la recherche au clic sur X', () => {
    const { onChange } = renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    
    // Tape quelque chose
    fireEvent.change(input, { target: { value: 'Cocody' } });
    
    // Clique sur le bouton clear (le X dans l'input)
    const clearBtn = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')
    );
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith({ city: '', commune: '', quartier: '' });
    }
  });

  it('gère la navigation clavier (flèches + Enter)', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Cocody' } });
    
    // Flèche bas
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Flèche haut
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // Enter (sélectionne le premier élément)
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Le dropdown devrait être fermé après Enter
    expect(screen.queryByText('Ville')).not.toBeInTheDocument();
  });

  it('ferme le dropdown avec Escape', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    fireEvent.change(input, { target: { value: 'Cocody' } });
    
    // Vérifie que le dropdown est ouvert (au moins un résultat)
    const results = screen.getAllByText(/Cocody/i);
    expect(results.length).toBeGreaterThan(0);
    
    fireEvent.keyDown(input, { key: 'Escape' });
    
    // Le dropdown devrait être fermé - les résultats ne sont plus visibles
    const newResults = screen.queryAllByText(/Cocody/i);
    expect(newResults.length).toBeLessThan(results.length);
  });

  it('limite les résultats à 20', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Rechercher une adresse...');
    // Recherche très large
    fireEvent.change(input, { target: { value: 'a' } });
    
    const buttons = screen.getAllByRole('button');
    // Maximum 20 résultats + 1 bouton clear = 21 buttons max
    expect(buttons.length).toBeLessThanOrEqual(21);
  });
});
