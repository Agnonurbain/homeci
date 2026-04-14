"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.getStorage = exports.getAuth = exports.getMessaging = exports.FieldValue = exports.getFirestore = void 0;
/**
 * HOMECI — Shared Firebase Admin imports
 * Centralized to avoid duplicate initialization across modules.
 */
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
Object.defineProperty(exports, "getFirestore", { enumerable: true, get: function () { return firestore_1.getFirestore; } });
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firestore_1.FieldValue; } });
const messaging_1 = require("firebase-admin/messaging");
Object.defineProperty(exports, "getMessaging", { enumerable: true, get: function () { return messaging_1.getMessaging; } });
const auth_1 = require("firebase-admin/auth");
Object.defineProperty(exports, "getAuth", { enumerable: true, get: function () { return auth_1.getAuth; } });
const storage_1 = require("firebase-admin/storage");
Object.defineProperty(exports, "getStorage", { enumerable: true, get: function () { return storage_1.getStorage; } });
const firebase_functions_1 = require("firebase-functions");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return firebase_functions_1.logger; } });
(0, app_1.initializeApp)();
//# sourceMappingURL=firebase-admin.js.map