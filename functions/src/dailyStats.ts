/**
 * HOMECI — Statistics Aggregation Function
 *
 * Cron job qui agrège les statistiques quotidiennes dans Firestore.
 * Écrit les compteurs dans `daily_stats/{YYYY-MM-DD}` pour un accès rapide
 * aux graphiques du dashboard admin.
 *
 * Exécuté quotidiennement à 23h59 (heure d'Abidjan).
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, logger } from "./firebase-admin";

export const aggregateDailyStats = onSchedule(
  {
    schedule: "every day 23:59",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
  },
  async () => {
    const db = getFirestore();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    logger.info(`[Daily Stats] Agrégation pour ${dateStr}...`);

    // 1. Compter les utilisateurs créés aujourd'hui
    const usersSnap = await db
      .collection("users")
      .where("created_at", ">=", dateStr)
      .where("created_at", "<=", dateStr + "T23:59:59")
      .get();

    // 2. Compter les propriétés créées aujourd'hui
    const propsSnap = await db
      .collection("properties")
      .where("created_at", ">=", dateStr)
      .where("created_at", "<=", dateStr + "T23:59:59")
      .get();

    // 3. Compter les visites créées aujourd'hui
    const visitsSnap = await db
      .collection("visits")
      .where("created_at", ">=", dateStr)
      .where("created_at", "<=", dateStr + "T23:59:59")
      .get();

    // 4. Compter les biens certifiés aujourd'hui
    const certifiedSnap = await db
      .collection("properties")
      .where("verified_notaire", "==", true)
      .where("updated_at", ">=", dateStr)
      .where("updated_at", "<=", dateStr + "T23:59:59")
      .get();

    // 5. Compter les signalements aujourd'hui
    const reportsSnap = await db
      .collection("reports")
      .where("created_at", ">=", dateStr)
      .where("created_at", "<=", dateStr + "T23:59:59")
      .get();

    // 6. Statuts agrégés
    const allPropsSnap = await db.collection("properties").get();
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    allPropsSnap.forEach((doc) => {
      const data = doc.data();
      statusCounts[data.status || "unknown"] = (statusCounts[data.status || "unknown"] || 0) + 1;
      typeCounts[data.property_type || "unknown"] = (typeCounts[data.property_type || "unknown"] || 0) + 1;
    });

    // 7. Total users/properties
    const allUsersSnap = await db.collection("users").get();

    const stats = {
      date: dateStr,
      new_users: usersSnap.size,
      new_properties: propsSnap.size,
      new_visits: visitsSnap.size,
      new_certifications: certifiedSnap.size,
      new_reports: reportsSnap.size,
      total_users: allUsersSnap.size,
      total_properties: allPropsSnap.size,
      status_counts: statusCounts,
      type_counts: typeCounts,
      created_at: new Date().toISOString(),
    };

    await db.collection("daily_stats").doc(dateStr).set(stats);

    logger.info(
      `[Daily Stats] ${dateStr} — users: ${stats.new_users}, propriétés: ${stats.new_properties}, visites: ${stats.new_visits}, certifications: ${stats.new_certifications}, signalements: ${stats.new_reports}`
    );
  }
);
