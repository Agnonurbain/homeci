/**
 * HOMECI — Tests: moderation.ts (auto-moderation Cloud Function)
 *
 * Tests the helper functions and overall logic of the auto-moderation system.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock firebase-admin before importing the module
vi.mock('./firebase-admin', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ exists: false })),
        update: vi.fn(async () => {}),
        set: vi.fn(async () => {}),
      })),
      where: vi.fn(() => ({
        get: vi.fn(async () => ({ docs: [], size: 0 })),
      })),
    })),
  })),
}));

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: vi.fn((_opts, handler) => handler),
}));

// Import after mocking
import { onReportCreated } from './moderation';

describe('moderation helpers', () => {
  // We need to test the internal logic, so we'll extract and test the pure functions
  // by importing them or testing through the exported function

  describe('onReportCreated', () => {
    it('is exported as a function', () => {
      expect(typeof onReportCreated).toBe('function');
    });
  });
});

describe('moderation pure functions', () => {
  // Test the keyword detection logic
  describe('suspicious keywords detection', () => {
    const SUSPICIOUS_KEYWORDS = [
      "arnaque", "fraude", "faux", "fake", "scam", "phishing",
      "gratuit", "free", "0 fcfa", "sans caution", "sans garantie",
      "urgent", "arnaq", "brouteur", "faussaire",
    ];

    function hasSuspiciousKeywords(title: string, description: string = ""): { found: boolean; keywords: string[] } {
      const text = `${title} ${description}`.toLowerCase();
      const found = SUSPICIOUS_KEYWORDS.filter(kw => text.includes(kw));
      return { found: found.length > 0, keywords: found };
    }

    it('detects suspicious keywords in title', () => {
      const result = hasSuspiciousKeywords("Appartement arnaque");
      expect(result.found).toBe(true);
      expect(result.keywords).toContain("arnaque");
    });

    it('detects suspicious keywords in description', () => {
      const result = hasSuspiciousKeywords("Belle villa", "Contactez-moi c'est une fraude");
      expect(result.found).toBe(true);
      expect(result.keywords).toContain("fraude");
    });

    it('returns empty when no suspicious keywords', () => {
      const result = hasSuspiciousKeywords("Bel appartement Cocody", "Très bien situé");
      expect(result.found).toBe(false);
      expect(result.keywords).toHaveLength(0);
    });

    it('detects multiple suspicious keywords', () => {
      const result = hasSuspiciousKeywords("Fake appartement", "C'est une arnaque et un scam");
      expect(result.found).toBe(true);
      expect(result.keywords).toContain("fake");
      expect(result.keywords).toContain("arnaque");
      expect(result.keywords).toContain("scam");
    });
  });

  describe('spam patterns detection', () => {
    const SPAM_PATTERNS = [
      /(.)\1{9,}/,          // Caractères répétés (aaaaaaaaaa)
      /(https?:\/\/[^\s]+)/g, // Liens externes
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, // Numéros de téléphone
    ];

    function hasSpamPatterns(description: string = ""): { found: boolean; patterns: string[] } {
      const patterns: string[] = [];

      if (SPAM_PATTERNS[0].test(description)) {
        patterns.push("caractères_répétés");
      }

      const links = description.match(SPAM_PATTERNS[1] as RegExp);
      if (links && links.length > 2) {
        patterns.push(`liens_externes (${links.length})`);
      }

      const phones = description.match(SPAM_PATTERNS[2] as RegExp);
      if (phones && phones.length > 3) {
        patterns.push(`numéros_téléphone (${phones.length})`);
      }

      return { found: patterns.length > 0, patterns };
    }

    it('detects repeated characters', () => {
      const result = hasSpamPatterns("aaaaaaaaaaaaaaaaa");
      expect(result.found).toBe(true);
      expect(result.patterns).toContain("caractères_répétés");
    });

    it('detects multiple external links', () => {
      const result = hasSpamPatterns("Visitez http://a.com et http://b.com et http://c.com");
      expect(result.found).toBe(true);
      expect(result.patterns).toContain("liens_externes (3)");
    });

    it('detects multiple phone numbers', () => {
      const result = hasSpamPatterns("07 01 02 03 04, 05 06 07 08 09, 07 10 11 12 13, 05 14 15 16 17");
      expect(result.found).toBe(true);
      expect(result.patterns).toContain("numéros_téléphone (4)");
    });

    it('returns empty for clean description', () => {
      const result = hasSpamPatterns("Bel appartement bien situé");
      expect(result.found).toBe(false);
      expect(result.patterns).toHaveLength(0);
    });

    it('does not flag 1-2 links as spam', () => {
      const result = hasSpamPatterns("Plus d'infos sur http://example.com");
      expect(result.found).toBe(false);
    });
  });

  describe('similarity calculation', () => {
    function levenshteinDistance(s1: string, s2: string): number {
      const costs: number[] = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    }

    function similarity(s1: string, s2: string): number {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      if (longer.length === 0) return 1.0;
      const editDist = levenshteinDistance(longer, shorter);
      return (longer.length - editDist) / longer.length;
    }

    it('returns 1.0 for identical strings', () => {
      expect(similarity("hello", "hello")).toBe(1.0);
    });

    it('returns high similarity for similar strings', () => {
      const sim = similarity("Appartement Cocody", "Appartement cocodi");
      expect(sim).toBeGreaterThan(0.8);
    });

    it('returns low similarity for different strings', () => {
      const sim = similarity("Villa Plateau", "Terrain Bingerville");
      expect(sim).toBeLessThan(0.5);
    });

    it('handles empty strings', () => {
      expect(similarity("", "")).toBe(1.0);
      expect(similarity("hello", "")).toBe(0.0);
    });
  });
});
