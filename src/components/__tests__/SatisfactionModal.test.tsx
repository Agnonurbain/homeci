import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/surveyService', () => ({
  surveyService: {
    submitSurvey: vi.fn(async () => 'survey-1'),
    hasAlreadyResponded: vi.fn(async () => false),
  },
}));

import SatisfactionModal from '../SatisfactionModal';
import { surveyService } from '../../services/surveyService';

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  userId: 'user-1',
  userRole: 'locataire',
  trigger: 'visit_accepted' as const,
  propertyId: 'prop-1',
  propertyTitle: 'Villa Cocody',
};

describe('SatisfactionModal', () => {

  it('ne rend rien si isOpen est false', () => {
    const { container } = render(<SatisfactionModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('affiche le titre et le message de trigger', () => {
    render(<SatisfactionModal {...defaultProps} />);
    expect(screen.getByText('Votre avis compte')).toBeInTheDocument();
    expect(screen.getByText('Votre visite a été confirmée !')).toBeInTheDocument();
  });

  it('affiche le nom de la propriété', () => {
    render(<SatisfactionModal {...defaultProps} />);
    expect(screen.getByText('Villa Cocody')).toBeInTheDocument();
  });

  it('affiche 5 étoiles cliquables', () => {
    render(<SatisfactionModal {...defaultProps} />);
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    expect(stars).toHaveLength(5);
  });

  it('le bouton Envoyer est désactivé sans note', () => {
    render(<SatisfactionModal {...defaultProps} />);
    const btn = screen.getByText('Envoyer mon avis');
    expect(btn).toBeDisabled();
  });

  it('le bouton Envoyer est activé après sélection d\'une étoile', () => {
    render(<SatisfactionModal {...defaultProps} />);
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    fireEvent.click(stars[3]); // 4 étoiles
    const btn = screen.getByText('Envoyer mon avis');
    expect(btn).not.toBeDisabled();
  });

  it('affiche le label dynamique au survol', () => {
    render(<SatisfactionModal {...defaultProps} />);
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    fireEvent.mouseEnter(stars[4]); // 5ème étoile
    expect(screen.getByText('Très satisfait')).toBeInTheDocument();
  });

  it('soumet l\'enquête avec les bonnes données', async () => {
    render(<SatisfactionModal {...defaultProps} />);

    // Cliquer 4 étoiles
    const stars = screen.getAllByRole('button', { name: /étoile/ });
    fireEvent.click(stars[3]);

    // Écrire un commentaire
    const textarea = screen.getByPlaceholderText(/commentaire/i);
    fireEvent.change(textarea, { target: { value: 'Très bon service' } });

    // Soumettre
    fireEvent.click(screen.getByText('Envoyer mon avis'));

    await waitFor(() => {
      expect(surveyService.submitSurvey).toHaveBeenCalledWith({
        user_id: 'user-1',
        user_role: 'locataire',
        rating: 4,
        comment: 'Très bon service',
        trigger: 'visit_accepted',
        property_id: 'prop-1',
        property_title: 'Villa Cocody',
      });
    });
  });

  it('affiche la confirmation après soumission', async () => {
    render(<SatisfactionModal {...defaultProps} />);

    const stars = screen.getAllByRole('button', { name: /étoile/ });
    fireEvent.click(stars[4]);
    fireEvent.click(screen.getByText('Envoyer mon avis'));

    await waitFor(() => {
      expect(screen.getByText('Merci pour votre retour !')).toBeInTheDocument();
    });
  });

  it('appelle onClose quand on clique "Plus tard"', () => {
    render(<SatisfactionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Plus tard'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('affiche le compteur de caractères', () => {
    render(<SatisfactionModal {...defaultProps} />);
    expect(screen.getByText('0/500')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/commentaire/i);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });
});
