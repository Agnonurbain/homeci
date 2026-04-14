"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOrphanedFiles = void 0;
/**
 * HOMECI — Storage Cleanup Function
 *
 * Cron job qui supprime les fichiers orphelins dans Firebase Storage.
 * Un fichier est considéré comme orphelin si :
 * - Il appartient à un bien supprimé ou rejeté depuis > 7 jours
 * - Il n'est référencé par aucun document actif dans Firestore
 *
 * Exécuté quotidiennement à 3h00 (heure d'Abidjan).
 */
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_admin_1 = require("./firebase-admin");
const CLEANUP_DELAY_DAYS = 7;
exports.cleanupOrphanedFiles = (0, scheduler_1.onSchedule)({
    schedule: "every day 03:00",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
}, async () => {
    const db = (0, firebase_admin_1.getFirestore)();
    const storage = (0, firebase_admin_1.getStorage)();
    const now = new Date();
    const cutoff = new Date(now.getTime() - CLEANUP_DELAY_DAYS * 24 * 60 * 60 * 1000);
    firebase_admin_1.logger.info("[Storage Cleanup] Démarrage du nettoyage...");
    // 1. Récupérer tous les biens supprimés/rejetés anciens
    const staleProperties = await db
        .collection("properties")
        .where("status", "in", ["rejected", "failed"])
        .where("updated_at", "<=", cutoff)
        .get();
    if (staleProperties.empty) {
        firebase_admin_1.logger.info("[Storage Cleanup] Aucun bien orphelin à nettoyer.");
        return;
    }
    let deletedImages = 0;
    let deletedDocuments = 0;
    const bucket = storage.bucket();
    for (const doc of staleProperties.docs) {
        const data = doc.data();
        const images = data.images || [];
        const documents = data.documents || [];
        // Supprimer les images
        for (const url of images) {
            try {
                // Extraire le chemin du fichier depuis l'URL
                // Format: https://firebasestorage.googleapis.com/.../o/path%2Fto%2Ffile?alt=media
                const decodedUrl = decodeURIComponent(url);
                const pathMatch = decodedUrl.match(/\/o\/(.+)\?/);
                if (pathMatch) {
                    const filePath = pathMatch[1];
                    const file = bucket.file(filePath);
                    const [exists] = await file.exists();
                    if (exists) {
                        await file.delete();
                        deletedImages++;
                        firebase_admin_1.logger.info(`[Storage Cleanup] Image supprimée: ${filePath}`);
                    }
                }
            }
            catch (err) {
                firebase_admin_1.logger.warn(`[Storage Cleanup] Erreur suppression image: ${url}`, err);
            }
        }
        // Supprimer les documents
        for (const docItem of documents) {
            if (typeof docItem === "object" && docItem.url) {
                try {
                    const decodedUrl = decodeURIComponent(docItem.url);
                    const pathMatch = decodedUrl.match(/\/o\/(.+)\?/);
                    if (pathMatch) {
                        const filePath = pathMatch[1];
                        const file = bucket.file(filePath);
                        const [exists] = await file.exists();
                        if (exists) {
                            await file.delete();
                            deletedDocuments++;
                            firebase_admin_1.logger.info(`[Storage Cleanup] Document supprimé: ${filePath}`);
                        }
                    }
                }
                catch (err) {
                    firebase_admin_1.logger.warn(`[Storage Cleanup] Erreur suppression document: ${docItem.url}`, err);
                }
            }
        }
    }
    firebase_admin_1.logger.info(`[Storage Cleanup] Terminé — ${deletedImages} images et ${deletedDocuments} documents supprimés (${staleProperties.size} biens traités).`);
});
//# sourceMappingURL=storageCleanup.js.map