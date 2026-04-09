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
exports.onNewChatMessage = exports.createAdmin = exports.certifyProperty = exports.assignNotaireRole = exports.sendPushNotification = exports.autoResetPropertyStatus = void 0;
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
//# sourceMappingURL=index.js.map