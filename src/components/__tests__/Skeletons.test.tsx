import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PropertyCardSkeleton,
  PropertyGridSkeleton,
  StatCardSkeleton,
  StatGridSkeleton,
  PropertyTableSkeleton,
  VisitCardSkeleton,
  VisitListSkeleton,
  NotaireCardSkeleton,
  NotaireListSkeleton,
} from '../Skeletons';

describe('Skeletons', () => {
  describe('PropertyCardSkeleton', () => {
    it('rend un conteneur avec une image placeholder', () => {
      const { container } = render(<PropertyCardSkeleton />);
      // Le Bone pour l'image fait 100% width et 180px height
      const bones = container.querySelectorAll('[style*="background"]');
      expect(bones.length).toBeGreaterThan(0);
    });
  });

  describe('PropertyGridSkeleton', () => {
    it('rend 6 cartes par défaut', () => {
      const { container } = render(<PropertyGridSkeleton />);
      // Chaque PropertyCardSkeleton a un conteneur rounded-2xl
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });

    it('rend le nombre demandé de cartes', () => {
      const { container } = render(<PropertyGridSkeleton count={3} />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('StatCardSkeleton', () => {
    it('rend une carte statistique', () => {
      const { container } = render(<StatCardSkeleton />);
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });
  });

  describe('StatGridSkeleton', () => {
    it('rend 4 stat cards par défaut', () => {
      const { container } = render(<StatGridSkeleton />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('rend le nombre demandé de stat cards', () => {
      const { container } = render(<StatGridSkeleton count={2} />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PropertyTableSkeleton', () => {
    it('rend un tableau avec les en-têtes', () => {
      render(<PropertyTableSkeleton />);
      expect(screen.getByText('Bien')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Prix')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Notaire')).toBeInTheDocument();
      expect(screen.getByText('Vues')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('rend le nombre demandé de lignes', () => {
      const { container } = render(<PropertyTableSkeleton rows={2} />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });
  });

  describe('VisitCardSkeleton', () => {
    it('rend une carte de visite skeleton', () => {
      const { container } = render(<VisitCardSkeleton />);
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });
  });

  describe('VisitListSkeleton', () => {
    it('rend 3 cartes de visite par défaut', () => {
      const { container } = render(<VisitListSkeleton />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('rend le nombre demandé de cartes', () => {
      const { container } = render(<VisitListSkeleton count={5} />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('NotaireCardSkeleton', () => {
    it('rend une carte notaire skeleton', () => {
      const { container } = render(<NotaireCardSkeleton />);
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });
  });

  describe('NotaireListSkeleton', () => {
    it('rend 3 cartes notaire par défaut', () => {
      const { container } = render(<NotaireListSkeleton />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('rend le nombre demandé de cartes', () => {
      const { container } = render(<NotaireListSkeleton count={2} />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });
});
