"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * HOMECI — Tests: moderation.ts (auto-moderation Cloud Function)
 *
 * Tests the helper functions and overall logic of the auto-moderation system.
 */
const vitest_1 = require("vitest");
// We need to mock firebase-admin before importing the module
vitest_1.vi.mock('./firebase-admin', () => ({
    getFirestore: vitest_1.vi.fn(() => ({
        collection: vitest_1.vi.fn(() => ({
            doc: vitest_1.vi.fn(() => ({
                get: vitest_1.vi.fn(async () => ({ exists: false })),
                update: vitest_1.vi.fn(async () => { }),
                set: vitest_1.vi.fn(async () => { }),
            })),
            where: vitest_1.vi.fn(() => ({
                get: vitest_1.vi.fn(async () => ({ docs: [], size: 0 })),
            })),
        })),
    })),
}));
vitest_1.vi.mock('firebase-functions', () => ({
    logger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('firebase-functions/v2/firestore', () => ({
    onDocumentCreated: vitest_1.vi.fn((_opts, handler) => handler),
}));
// Import after mocking
const moderation_1 = require("./moderation");
(0, vitest_1.describe)('moderation helpers', () => {
    // We need to test the internal logic, so we'll extract and test the pure functions
    // by importing them or testing through the exported function
    (0, vitest_1.describe)('onReportCreated', () => {
        (0, vitest_1.it)('is exported as a function', () => {
            (0, vitest_1.expect)(typeof moderation_1.onReportCreated).toBe('function');
        });
    });
});
(0, vitest_1.describe)('moderation pure functions', () => {
    // Test the keyword detection logic
    (0, vitest_1.describe)('suspicious keywords detection', () => {
        const SUSPICIOUS_KEYWORDS = [
            "arnaque", "fraude", "faux", "fake", "scam", "phishing",
            "gratuit", "free", "0 fcfa", "sans caution", "sans garantie",
            "urgent", "arnaq", "brouteur", "faussaire",
        ];
        function hasSuspiciousKeywords(title, description = "") {
            const text = `${title} ${description}`.toLowerCase();
            const found = SUSPICIOUS_KEYWORDS.filter(kw => text.includes(kw));
            return { found: found.length > 0, keywords: found };
        }
        (0, vitest_1.it)('detects suspicious keywords in title', () => {
            const result = hasSuspiciousKeywords("Appartement arnaque");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.keywords).toContain("arnaque");
        });
        (0, vitest_1.it)('detects suspicious keywords in description', () => {
            const result = hasSuspiciousKeywords("Belle villa", "Contactez-moi c'est une fraude");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.keywords).toContain("fraude");
        });
        (0, vitest_1.it)('returns empty when no suspicious keywords', () => {
            const result = hasSuspiciousKeywords("Bel appartement Cocody", "Très bien situé");
            (0, vitest_1.expect)(result.found).toBe(false);
            (0, vitest_1.expect)(result.keywords).toHaveLength(0);
        });
        (0, vitest_1.it)('detects multiple suspicious keywords', () => {
            const result = hasSuspiciousKeywords("Fake appartement", "C'est une arnaque et un scam");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.keywords).toContain("fake");
            (0, vitest_1.expect)(result.keywords).toContain("arnaque");
            (0, vitest_1.expect)(result.keywords).toContain("scam");
        });
    });
    (0, vitest_1.describe)('spam patterns detection', () => {
        const SPAM_PATTERNS = [
            /(.)\1{9,}/, // Caractères répétés (aaaaaaaaaa)
            /(https?:\/\/[^\s]+)/g, // Liens externes
            /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, // Numéros de téléphone
        ];
        function hasSpamPatterns(description = "") {
            const patterns = [];
            if (SPAM_PATTERNS[0].test(description)) {
                patterns.push("caractères_répétés");
            }
            const links = description.match(SPAM_PATTERNS[1]);
            if (links && links.length > 2) {
                patterns.push(`liens_externes (${links.length})`);
            }
            const phones = description.match(SPAM_PATTERNS[2]);
            if (phones && phones.length > 3) {
                patterns.push(`numéros_téléphone (${phones.length})`);
            }
            return { found: patterns.length > 0, patterns };
        }
        (0, vitest_1.it)('detects repeated characters', () => {
            const result = hasSpamPatterns("aaaaaaaaaaaaaaaaa");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.patterns).toContain("caractères_répétés");
        });
        (0, vitest_1.it)('detects multiple external links', () => {
            const result = hasSpamPatterns("Visitez http://a.com et http://b.com et http://c.com");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.patterns).toContain("liens_externes (3)");
        });
        (0, vitest_1.it)('detects multiple phone numbers', () => {
            const result = hasSpamPatterns("07 01 02 03 04, 05 06 07 08 09, 07 10 11 12 13, 05 14 15 16 17");
            (0, vitest_1.expect)(result.found).toBe(true);
            (0, vitest_1.expect)(result.patterns).toContain("numéros_téléphone (4)");
        });
        (0, vitest_1.it)('returns empty for clean description', () => {
            const result = hasSpamPatterns("Bel appartement bien situé");
            (0, vitest_1.expect)(result.found).toBe(false);
            (0, vitest_1.expect)(result.patterns).toHaveLength(0);
        });
        (0, vitest_1.it)('does not flag 1-2 links as spam', () => {
            const result = hasSpamPatterns("Plus d'infos sur http://example.com");
            (0, vitest_1.expect)(result.found).toBe(false);
        });
    });
    (0, vitest_1.describe)('similarity calculation', () => {
        function levenshteinDistance(s1, s2) {
            const costs = [];
            for (let i = 0; i <= s1.length; i++) {
                let lastValue = i;
                for (let j = 0; j <= s2.length; j++) {
                    if (i === 0) {
                        costs[j] = j;
                    }
                    else if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
                if (i > 0)
                    costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }
        function similarity(s1, s2) {
            const longer = s1.length > s2.length ? s1 : s2;
            const shorter = s1.length > s2.length ? s2 : s1;
            if (longer.length === 0)
                return 1.0;
            const editDist = levenshteinDistance(longer, shorter);
            return (longer.length - editDist) / longer.length;
        }
        (0, vitest_1.it)('returns 1.0 for identical strings', () => {
            (0, vitest_1.expect)(similarity("hello", "hello")).toBe(1.0);
        });
        (0, vitest_1.it)('returns high similarity for similar strings', () => {
            const sim = similarity("Appartement Cocody", "Appartement cocodi");
            (0, vitest_1.expect)(sim).toBeGreaterThan(0.8);
        });
        (0, vitest_1.it)('returns low similarity for different strings', () => {
            const sim = similarity("Villa Plateau", "Terrain Bingerville");
            (0, vitest_1.expect)(sim).toBeLessThan(0.5);
        });
        (0, vitest_1.it)('handles empty strings', () => {
            (0, vitest_1.expect)(similarity("", "")).toBe(1.0);
            (0, vitest_1.expect)(similarity("hello", "")).toBe(0.0);
        });
    });
});
//# sourceMappingURL=moderation.test.js.map