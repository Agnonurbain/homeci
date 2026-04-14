"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateDailyStats = exports.cleanupOrphanedFiles = exports.onReportCreated = exports.onNewChatMessage = exports.createAdmin = exports.certifyProperty = exports.assignNotaireRole = exports.sendPushNotification = exports.autoResetPropertyStatus = void 0;
// ── Scheduler ──
var scheduler_1 = require("./scheduler");
Object.defineProperty(exports, "autoResetPropertyStatus", { enumerable: true, get: function () { return scheduler_1.autoResetPropertyStatus; } });
// ── Notifications ──
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "sendPushNotification", { enumerable: true, get: function () { return notifications_1.sendPushNotification; } });
// ── Notaire ──
var notaire_1 = require("./notaire");
Object.defineProperty(exports, "assignNotaireRole", { enumerable: true, get: function () { return notaire_1.assignNotaireRole; } });
Object.defineProperty(exports, "certifyProperty", { enumerable: true, get: function () { return notaire_1.certifyProperty; } });
// ── Admin ──
var admin_1 = require("./admin");
Object.defineProperty(exports, "createAdmin", { enumerable: true, get: function () { return admin_1.createAdmin; } });
// ── Chat ──
var chat_1 = require("./chat");
Object.defineProperty(exports, "onNewChatMessage", { enumerable: true, get: function () { return chat_1.onNewChatMessage; } });
// ── Moderation ──
var moderation_1 = require("./moderation");
Object.defineProperty(exports, "onReportCreated", { enumerable: true, get: function () { return moderation_1.onReportCreated; } });
// ── Storage Cleanup ──
var storageCleanup_1 = require("./storageCleanup");
Object.defineProperty(exports, "cleanupOrphanedFiles", { enumerable: true, get: function () { return storageCleanup_1.cleanupOrphanedFiles; } });
// ── Daily Stats ──
var dailyStats_1 = require("./dailyStats");
Object.defineProperty(exports, "aggregateDailyStats", { enumerable: true, get: function () { return dailyStats_1.aggregateDailyStats; } });
//# sourceMappingURL=index.js.map