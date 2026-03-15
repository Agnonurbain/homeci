import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { firestoreMocks } from '../../tests/firebase.mock';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1' },
    profile: { id: 'u1', role: 'proprietaire' },
  }),
}));

vi.mock('../OptimizedImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock LocationPicker (uses leaflet which doesn't work in jsdom)
vi.mock('../LocationPicker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

import AddPropertyForm from '../AddPropertyForm';
import EditPropertyForm from '../EditPropertyForm';

describe('AddPropertyForm', () => {
  it('rend le formulaire sans crash', () => {
    const { container } = render(
      <AddPropertyForm onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});

describe('EditPropertyForm', () => {
  it('rend le formulaire sans crash', () => {
    firestoreMocks.getDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => ({}),
    });
    const { container } = render(
      <EditPropertyForm propertyId="prop-1" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
