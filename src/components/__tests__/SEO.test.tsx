import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from '../SEO';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

describe('SEO', () => {
  it('rend sans erreur avec un titre', () => {
    const { container } = render(<SEO title="Mon Bien" />, { wrapper });
    expect(container).toBeInTheDocument();
  });

  it('rend sans erreur sans props', () => {
    const { container } = render(<SEO />, { wrapper });
    expect(container).toBeInTheDocument();
  });

  it('rend avec toutes les props', () => {
    const { container } = render(
      <SEO title="Villa Cocody" description="Belle villa" image="https://img.ci/villa.jpg" url="https://homeci.ci/bien/1" />,
      { wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});
