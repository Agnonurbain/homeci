import { describe, it, expect } from 'vitest';
import { HColors, HAlpha, HS } from '../homeci-tokens';

describe('homeci-tokens', () => {

  describe('HS.headerDark', () => {
    it('utilise forest comme background (pas night)', () => {
      expect(HS.headerDark.background).toBe(HColors.forest);
    });

    it('utilise une bordure gold à 25% d\'opacité', () => {
      expect(HS.headerDark.borderBottom).toContain('0.25');
    });
  });

  describe('HColors', () => {
    it('forest est plus clair que night', () => {
      // forest = #1B5E3A → R=27, night = #0A3D1F → R=10
      const toRGB = (hex: string) => {
        const h = hex.replace('#', '');
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
      };
      const forest = toRGB(HColors.forest);
      const night = toRGB(HColors.night);
      const luminance = (c: { r: number; g: number; b: number }) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
      expect(luminance(forest)).toBeGreaterThan(luminance(night));
    });
  });

  describe('HAlpha', () => {
    it('gold25 a une opacité de 0.25', () => {
      expect(HAlpha.gold25).toBe('rgba(212,160,23,0.25)');
    });
  });
});
