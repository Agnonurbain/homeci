import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock PropertyFormBase since the wrappers just delegate to it
vi.mock('../PropertyFormBase', () => ({
  default: ({ mode, propertyId, onClose, onSuccess }: any) => (
    <div data-testid="form-base" data-mode={mode} data-property-id={propertyId || ''}>
      PropertyFormBase
    </div>
  ),
}));

import AddPropertyForm from '../AddPropertyForm';
import EditPropertyForm from '../EditPropertyForm';

describe('AddPropertyForm', () => {
  it('rend PropertyFormBase en mode create', () => {
    const { getByTestId } = render(<AddPropertyForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    const el = getByTestId('form-base');
    expect(el.getAttribute('data-mode')).toBe('create');
    expect(el.getAttribute('data-property-id')).toBe('');
  });
});

describe('EditPropertyForm', () => {
  it('rend PropertyFormBase en mode edit avec propertyId', () => {
    const { getByTestId } = render(
      <EditPropertyForm propertyId="prop-42" onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    const el = getByTestId('form-base');
    expect(el.getAttribute('data-mode')).toBe('edit');
    expect(el.getAttribute('data-property-id')).toBe('prop-42');
  });
});
