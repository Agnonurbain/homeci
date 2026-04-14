/**
 * HOMECI — Auto-moderation Cloud Function
 * Trigger: onReportCreated (Firestore onCreate on /reports/{id})
 *
 * Analyse automatiquement les signalements pour détecter :
 * - Contenu suspect (mots-clés frauduleux, spam)
 * - Doublons de propriétés (même titre + même ville + même prix)
 * - Signalements multiples (≥3 reports → auto-flag)
 *
 * Actions :
 * - Met à jour le statut de la propriété si risque élevé
 * - Crée une notification admin
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "./firebase-admin";
import { logger } from "firebase-functions";

// ── Configuration ──────────────────────────────────────────────────────

const AUTO_FLAG_THRESHOLD = 3; // Nombre de reports pour auto-flag

// Mots-clés suspects dans les titres/descriptions
const SUSPICIOUS_KEYWORDS = [
  "arnaque", "fraude", "faux", "fake", "scam", "phishing",
  "gratuit", "free", "0 fcfa", "sans caution", "sans garantie",
  "urgent", "arnaq", "brouteur", "faussaire",
];

// Patterns de spam dans les descriptions
const SPAM_PATTERNS = [
  /(.)\1{9,}/,          // Caractères répétés (aaaaaaaaaa)
  /(https?:\/\/[^\s]+)/g, // Liens externes
  /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, // Numéros de téléphone
];

// ── Types ──────────────────────────────────────────────────────────────

interface ReportData {
  property_id: string;
  property_title: string;
  reporter_id: string;
  reporter_role: string;
  reason: string;
  details: string;
  status: string;
  created_at: any;
}

interface PropertyData {
  title: string;
  description?: string;
  price: number;
  city: string;
  commune: string;
  owner_id: string;
  status: string;
  auto_flagged?: boolean;
  auto_flag_reason?: string;
  report_count?: number;
}

// ── Helper functions ───────────────────────────────────────────────────

/**
 * Détecte des mots-clés suspects dans le titre/description
 */
function hasSuspiciousKeywords(title: string, description: string = ""): { found: boolean; keywords: string[] } {
  const text = `${title} ${description}`.toLowerCase();
  const found = SUSPICIOUS_KEYWORDS.filter(kw => text.includes(kw));
  return { found: found.length > 0, keywords: found };
}

/**
 * Détecte des patterns de spam dans la description
 */
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

/**
 * Calcule la similarité entre deux chaînes (Levenshtein simplifié)
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const editDist = levenshteinDistance(longer, shorter);
  return (longer.length - editDist) / longer.length;
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

/**
 * Vérifie si une propriété similaire existe déjà (doublon potentiel)
 */
async function findSimilarProperties(db: any, propertyId: string, city: string, price: number, title: string): Promise<string[]> {
  const q = db.collection("properties")
    .where("city", "==", city)
    .where("status", "==", "published");

  const snap = await q.get();
  const similar: string[] = [];

  snap.docs.forEach((doc: any) => {
    if (doc.id === propertyId) return;
    const data = doc.data() as PropertyData;

    // Même ville + même prix (à ±10%) + titre similaire (≥80%)
    const priceMatch = Math.abs(data.price - price) / price < 0.1;
    const titleSim = similarity(title.toLowerCase(), data.title.toLowerCase());

    if (priceMatch && titleSim >= 0.8) {
      similar.push(doc.id);
    }
  });

  return similar;
}

/**
 * Comptabilise les reports pour une propriété
 */
async function getReportCount(db: any, propertyId: string): Promise<number> {
  const snap = await db.collection("reports")
    .where("property_id", "==", propertyId)
    .where("status", "==", "pending")
    .get();
  return snap.size;
}

// ── Cloud Function ─────────────────────────────────────────────────────

export const onReportCreated = onDocumentCreated(
  {
    region: "europe-west1",
    document: "reports/{reportId}",
  },
  async (event) => {
    const db = getFirestore();
    const reportId = event.params?.reportId;
    const data = event.data?.data() as ReportData | undefined;

    if (!data || !data.property_id) {
      logger.warn("Report created with missing data", { reportId });
      return;
    }

    const propertyId = data.property_id;
    const analysisResults: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    try {
      // 1. Récupérer la propriété
      const propDoc = await db.collection("properties").doc(propertyId).get();
      if (!propDoc.exists) {
        logger.warn("Reported property not found", { propertyId });
        return;
      }
      const propData = propDoc.data() as PropertyData;

      // 2. Analyse des mots-clés suspects
      const keywordsCheck = hasSuspiciousKeywords(propData.title, propData.description);
      if (keywordsCheck.found) {
        analysisResults.push(`mots_clés_suspects: ${keywordsCheck.keywords.join(", ")}`);
        riskLevel = "medium";
      }

      // 3. Analyse des patterns de spam
      const spamCheck = hasSpamPatterns(propData.description);
      if (spamCheck.found) {
        analysisResults.push(`spam_patterns: ${spamCheck.patterns.join(", ")}`);
        riskLevel = "medium";
      }

      // 4. Vérification des doublons
      const similarProps = await findSimilarProperties(
        db, propertyId, propData.city, propData.price, propData.title
      );
      if (similarProps.length > 0) {
        analysisResults.push(`doublons_potentiels: ${similarProps.join(", ")}`);
        riskLevel = "high";
      }

      // 5. Comptage des reports
      const reportCount = await getReportCount(db, propertyId);
      if (reportCount >= AUTO_FLAG_THRESHOLD) {
        analysisResults.push(`reports_multiples: ${reportCount} (seuil: ${AUTO_FLAG_THRESHOLD})`);
        riskLevel = "high";
      }

      // 6. Action si risque élevé
      if (riskLevel === "high") {
        await db.collection("properties").doc(propertyId).update({
          auto_flagged: true,
          auto_flag_reason: analysisResults.join(" | "),
          report_count: reportCount,
          status: "pending", // Rétrograder en pending pour revue
          updated_at: FieldValue.serverTimestamp(),
        });

        logger.info("Property auto-flagged", {
          propertyId,
          reason: analysisResults.join(" | "),
          reportCount,
        });

        // Notification admin
        await db.collection("notifications").doc().set({
          user_id: "admin",
          type: "auto_moderation",
          title: "⚠️ Bien signalé automatiquement",
          message: `Le bien "${propData.title}" a été automatiquement signalé pour revue. Raisons : ${analysisResults.join(", ")}`,
          property_id: propertyId,
          read: false,
          created_at: FieldValue.serverTimestamp(),
        });
      } else if (riskLevel === "medium") {
        // Mise à jour légère pour tracking
        await db.collection("properties").doc(propertyId).update({
          report_count: reportCount,
          updated_at: FieldValue.serverTimestamp(),
        });

        logger.info("Medium risk detected", {
          propertyId,
          analysis: analysisResults.join(" | "),
          reportCount,
        });
      } else {
        logger.info("Low risk - no action needed", { propertyId, reportCount });
      }

      return { success: true, riskLevel, analysisResults, reportCount };
    } catch (error) {
      logger.error("Auto-moderation failed", { reportId, propertyId, error });
      throw error;
    }
  }
);
