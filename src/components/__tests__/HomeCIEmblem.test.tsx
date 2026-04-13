import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeCIEmblem } from '../HomeCIEmblem';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, ...rest }: any) => (
    <a href={to} className={className} {...rest}>{children}</a>
  ),
}));

describe('HomeCIEmblem', () => {
  it('rend la variante full par défaut avec éléphant et texte', () => {
    render(<HomeCIEmblem />);
    const elephant = screen.getByLabelText('éléphant');
    expect(elephant).toBeInTheDocument();
    expect(screen.getByText('HOMECI')).toBeInTheDocument();
  });

  it('rend la variante header avec lien', () => {
    render(<HomeCIEmblem variant="header" to="/dashboard" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard');
    expect(screen.getByLabelText('éléphant')).toBeInTheDocument();
  });

  it('rend la variante watermark sans lien', () => {
    render(<HomeCIEmblem variant="watermark" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/HOMECI/)).toBeInTheDocument();
  });

  it('rend la variante favicon avec juste l\'éléphant', () => {
    render(<HomeCIEmblem variant="favicon" />);
    expect(screen.getByLabelText('éléphant')).toBeInTheDocument();
    expect(screen.queryByText('HOMECI')).not.toBeInTheDocument();
  });

  it('applique la className personnalisée', () => {
    render(<HomeCIEmblem className="my-custom-class" />);
    const container = screen.getByText('HOMECI').closest('a');
    expect(container).toHaveClass('my-custom-class');
  });
});
