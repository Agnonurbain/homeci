/**
 * HOMECI — Cloud Functions (v2)
 *
 * Entry point that re-exports all functions from domain-specific modules.
 *
 * Modules:
 *   - scheduler:    autoResetPropertyStatus (cron)
 *   - notifications: sendPushNotification (firestore trigger)
 *   - notaire:      assignNotaireRole, certifyProperty (callable)
 *   - admin:        createAdmin (callable)
 *   - chat:         onNewChatMessage (firestore trigger)
 *
 * All functions run in europe-west1, nodejs20.
 */

// ── Scheduler ──
export { autoResetPropertyStatus } from "./scheduler";

// ── Notifications ──
export { sendPushNotification } from "./notifications";

// ── Notaire ──
export { assignNotaireRole, certifyProperty } from "./notaire";

// ── Admin ──
export { createAdmin } from "./admin";

// ── Chat ──
export { onNewChatMessage } from "./chat";
