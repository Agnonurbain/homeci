"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certifyProperty = exports.assignNotaireRole = void 0;
/**
 * HOMECI — Notaire-related callable functions
 * assignNotaireRole: validates a notaire code and assigns the role atomically.
 * certifyProperty: a notaire certifies or rejects a property.
 */
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("./firebase-admin");
// ─────────────────────────────────────────────────────────────────
// assignNotaireRole
// ─────────────────────────────────────────────────────────────────
exports.assignNotaireRole = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentification requise.");
    }
    const { codeId } = request.data;
    if (!codeId || typeof codeId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "codeId requis.");
    }
    const db = (0, firebase_admin_1.getFirestore)();
    const uid = request.auth.uid;
    // Check user doesn't already have a privileged role
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError("not-found", "Profil utilisateur introuvable.");
    }
    const currentRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (currentRole === "admin" || currentRole === "notaire") {
        throw new https_1.HttpsError("already-exists", "Vous avez déjà un rôle privilégié.");
    }
    // Atomic transaction: validate code + assign role
    await db.runTransaction(async (tx) => {
        var _a;
        const codeRef = db.collection("notaire_codes").doc(codeId);
        const codeDoc = await tx.get(codeRef);
        if (!codeDoc.exists) {
            throw new https_1.HttpsError("not-found", "Code notaire introuvable.");
        }
        if ((_a = codeDoc.data()) === null || _a === void 0 ? void 0 : _a.used) {
            throw new https_1.HttpsError("already-exists", "Ce code a déjà été utilisé.");
        }
        tx.update(codeRef, {
            used: true,
            used_at: firebase_admin_1.FieldValue.serverTimestamp(),
            used_by: uid,
        });
        tx.update(db.collection("users").doc(uid), {
            role: "notaire",
            updated_at: firebase_admin_1.FieldValue.serverTimestamp(),
        });
    });
    firebase_admin_1.logger.info(`Rôle notaire assigné à ${uid} via code ${codeId}.`);
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────
// certifyProperty
// ─────────────────────────────────────────────────────────────────
exports.certifyProperty = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentification requise.");
    }
    const { propertyId, action, reason } = request.data;
    if (!propertyId || !action) {
        throw new https_1.HttpsError("invalid-argument", "propertyId et action requis.");
    }
    const db = (0, firebase_admin_1.getFirestore)();
    const uid = request.auth.uid;
    // Verify caller is notaire or admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== "notaire" && ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Seuls les notaires peuvent certifier.");
    }
    // Verify property exists and is assigned to this notaire
    const propDoc = await db.collection("properties").doc(propertyId).get();
    if (!propDoc.exists) {
        throw new https_1.HttpsError("not-found", "Bien introuvable.");
    }
    const propData = propDoc.data();
    if (((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.role) === "notaire" && propData.notaire_id !== uid) {
        throw new https_1.HttpsError("permission-denied", "Ce bien ne vous est pas assigné.");
    }
    if (action === "certify") {
        // Check all documents are validated
        const docsSnap = await db
            .collection("properties")
            .doc(propertyId)
            .collection("documents")
            .get();
        const allValid = docsSnap.docs.every((d) => d.data().status === "valide");
        if (!docsSnap.empty && !allValid) {
            throw new https_1.HttpsError("failed-precondition", "Tous les documents doivent être validés avant certification.");
        }
        await db.collection("properties").doc(propertyId).update({
            verified_notaire: true,
            verification_date: new Date().toISOString(),
            status: "published",
            updated_at: firebase_admin_1.FieldValue.serverTimestamp(),
        });
    }
    else {
        if (!reason) {
            throw new https_1.HttpsError("invalid-argument", "Raison requise pour un rejet.");
        }
        await db.collection("properties").doc(propertyId).update({
            verified_notaire: false,
            status: "pending",
            decertified_at: new Date().toISOString(),
            decertification_reason: reason,
            decertified_by: uid,
            updated_at: firebase_admin_1.FieldValue.serverTimestamp(),
        });
    }
    // Admin log
    await db.collection("admin_logs").add({
        action: `property_${action}`,
        property_id: propertyId,
        performed_by: uid,
        reason: reason || null,
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    // Notify owner
    await db.collection("notifications").doc().set({
        user_id: propData.owner_id,
        type: "notaire",
        title: action === "certify"
            ? "Bien certifié par le notaire"
            : "Certification refusée",
        message: action === "certify"
            ? `Votre bien "${propData.title}" a été certifié et publié.`
            : `La certification de "${propData.title}" a été refusée : ${reason}`,
        property_id: propertyId,
        read: false,
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    firebase_admin_1.logger.info(`Property ${propertyId} ${action}ed by notaire ${uid}.`);
    return { success: true };
});
//# sourceMappingURL=notaire.js.map