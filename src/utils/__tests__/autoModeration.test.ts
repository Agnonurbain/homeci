import { describe, it, expect } from 'vitest';

/**
 * Tests for the auto-moderation logic (pure functions only)
 * Mirrors the logic in functions/src/moderation.ts
 */

const SUSPICIOUS_KEYWORDS = [
  "arnaque", "fraude", "faux", "fake", "scam", "phishing",
  "gratuit", "free", "0 fcfa", "sans caution", "sans garantie",
  "urgent", "arnaq", "brouteur", "faussaire",
];

const SPAM_PATTERNS = [
  /(.)\1{9,}/,
  /(https?:\/\/[^\s]+)/g,
  /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
];

function hasSuspiciousKeywords(title: string, description: string = ""): { found: boolean; keywords: string[] } {
  const text = `${title} ${description}`.toLowerCase();
  const found = SUSPICIOUS_KEYWORDS.filter(kw => text.includes(kw));
  return { found: found.length > 0, keywords: found };
}

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

describe('autoModeration', () => {
  describe('hasSuspiciousKeywords', () => {
    it('detects "arnaque" in title', () => {
      const result = hasSuspiciousKeywords("Appartement arnaque");
      expect(result.found).toBe(true);
      expect(result.keywords).toContain("arnaque");
    });

    it('detects "fraude" in description', () => {
      const result = hasSuspiciousKeywords("Villa", "C'est une fraude");
      expect(result.found).toBe(true);
      expect(result.keywords).toContain("fraude");
    });

    it('detects multiple keywords', () => {
      const result = hasSuspiciousKeywords("Fake bien", "scam et arnaque");
      expect(result.found).toBe(true);
      expect(result.keywords.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty for clean text', () => {
      const result = hasSuspiciousKeywords("Bel appartement", "Bien situé");
      expect(result.found).toBe(false);
    });
  });

  describe('hasSpamPatterns', () => {
    it('detects repeated characters', () => {
      const result = hasSpamPatterns("aaaaaaaaaaaaaaaaa");
      expect(result.found).toBe(true);
      expect(result.patterns).toContain("caractères_répétés");
    });

    it('detects multiple external links', () => {
      const result = hasSpamPatterns("Visit http://a.com and http://b.com and http://c.com");
      expect(result.found).toBe(true);
    });

    it('detects multiple phone numbers', () => {
      const result = hasSpamPatterns("070 102 030 050 607 080 071 011 213 051 415 161");
      expect(result.found).toBe(true);
    });

    it('returns empty for clean text', () => {
      const result = hasSpamPatterns("Bel appartement bien situé");
      expect(result.found).toBe(false);
    });
  });

  describe('similarity', () => {
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
  });
});
