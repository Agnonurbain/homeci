"use strict";
/**
 * HOMECI — Cloud Functions (v2)
 *
 * autoResetPropertyStatus :
 *   Tourne toutes les heures via Cloud Scheduler.
 *   Vérifie les visites "completed" dont la date de visite + 3 jours est dépassée.
 *
 * sendPushNotification :
 *   Déclenché quand une notification est créée dans Firestore.
 *   Envoie un push FCM à tous les tokens du destinataire.
 *
 * assignNotaireRole :
 *   Callable : valide un code notaire et assigne le rôle atomiquement.
 *
 * certifyProperty :
 *   Callable : un notaire certifie un bien qui lui est assigné.
 *
 * createAdmin :
 *   Callable : l'admin principal crée un nouveau compte admin.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = exports.certifyProperty = exports.assignNotaireRole = exports.sendPushNotification = exports.autoResetPropertyStatus = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const auth_1 = require("firebase-admin/auth");
const firebase_functions_1 = require("firebase-functions");
(0, app_1.initializeApp)();
const DELAY_DAYS = 3;
exports.autoResetPropertyStatus = (0, scheduler_1.onSchedule)({
    schedule: "every 1 hours",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
}, async () => {
    var _a, _b;
    const db = (0, firestore_2.getFirestore)();
    const now = new Date();
    const cutoff = new Date(now.getTime() - DELAY_DAYS * 24 * 60 * 60 * 1000);
    // 1. Trouver toutes les visites "completed"
    const visitsSnap = await db
        .collection("visits")
        .where("status", "==", "completed")
        .get();
    if (visitsSnap.empty) {
        firebase_functions_1.logger.info("Aucune visite complétée à vérifier.");
        return;
    }
    // 2. Grouper par property_id et trouver la date de visite
    const propertyVisits = new Map();
    for (const doc of visitsSnap.docs) {
        const data = doc.data();
        const propertyId = data.property_id;
        const preferredDate = data.preferred_date;
        const updatedAt = ((_b = (_a = data.updated_at) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(preferredDate);
        const visitDate = new Date(Math.max(new Date(preferredDate).getTime(), updatedAt.getTime()));
        const existing = propertyVisits.get(propertyId);
        if (!existing || visitDate > existing.visitDate) {
            propertyVisits.set(propertyId, {
                visitDate,
                ownerId: data.owner_id,
                propertyTitle: data.property_title || "Bien immobilier",
            });
        }
    }
    // 3. Pour chaque propriété, vérifier si le délai est dépassé
    let resetCount = 0;
    for (const [propertyId, info] of propertyVisits) {
        if (info.visitDate > cutoff)
            continue;
        const propDoc = await db.collection("properties").doc(propertyId).get();
        if (!propDoc.exists)
            continue;
        const propData = propDoc.data();
        if (!propData)
            continue;
        // Ne reset que les biens encore "published"
        if (propData.status !== "published")
            continue;
        const batch = db.batch();
        // Rejeter les visites completed expirées
        const completedVisits = visitsSnap.docs.filter((d) => d.data().property_id === propertyId &&
            d.data().status === "completed");
        for (const visitDoc of completedVisits) {
            batch.update(visitDoc.ref, {
                status: "rejected",
                owner_notes: "Délai de 3 jours dépassé — visite expirée automatiquement.",
                updated_at: firestore_2.FieldValue.serverTimestamp(),
            });
        }
        // Marquer le bien comme auto-reset
        batch.update(propDoc.ref, {
            auto_reset_at: firestore_2.FieldValue.serverTimestamp(),
            updated_at: firestore_2.FieldValue.serverTimestamp(),
        });
        // Notifier le propriétaire
        batch.set(db.collection("notifications").doc(), {
            user_id: info.ownerId,
            type: "system",
            title: "⏰ Délai de mise à jour expiré",
            message: `Le délai de 3 jours pour mettre à jour le statut de "${info.propertyTitle}" est expiré. Le bien a été automatiquement remis en disponible.`,
            property_id: propertyId,
            read: false,
            created_at: firestore_2.FieldValue.serverTimestamp(),
        });
        // Notifier les locataires concernés
        for (const visitDoc of completedVisits) {
            const vData = visitDoc.data();
            batch.set(db.collection("notifications").doc(), {
                user_id: vData.tenant_id,
                type: "system",
                title: "Bien remis en disponible",
                message: `Le bien "${info.propertyTitle}" est à nouveau disponible. Vous pouvez refaire une demande de visite si vous êtes toujours intéressé.`,
                property_id: propertyId,
                read: false,
                created_at: firestore_2.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        resetCount++;
        firebase_functions_1.logger.info(`Auto-reset: "${info.propertyTitle}" (${propertyId}) — ` +
            `${completedVisits.length} visite(s) expirée(s).`);
    }
    firebase_functions_1.logger.info(`Auto-reset terminé: ${resetCount} bien(s) remis en disponible.`);
});
/**
 * sendPushNotification
 * Déclenché automatiquement quand un document est créé dans /notifications/{notifId}.
 * Récupère les tokens FCM du destinataire et envoie un push.
 */
exports.sendPushNotification = (0, firestore_1.onDocumentCreated)({
    document: "notifications/{notifId}",
    region: "europe-west1",
}, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const userId = data.user_id;
    const title = data.title || "HOMECI";
    const body = data.message || "";
    const propertyId = data.property_id || "";
    if (!userId) {
        firebase_functions_1.logger.warn("sendPushNotification: pas de user_id dans la notification.");
        return;
    }
    const db = (0, firestore_2.getFirestore)();
    // Récupérer tous les tokens FCM du destinataire
    const tokensSnap = await db
        .collection("users")
        .doc(userId)
        .collection("fcm_tokens")
        .get();
    if (tokensSnap.empty) {
        firebase_functions_1.logger.info(`Aucun token FCM pour l'utilisateur ${userId}.`);
        return;
    }
    const tokens = tokensSnap.docs.map((d) => d.data().token);
    // Construire le message FCM
    const message = {
        notification: {
            title,
            body,
        },
        data: {
            property_id: propertyId,
            notification_id: event.params.notifId,
        },
        webpush: {
            fcmOptions: {
                link: propertyId ? `/?property=${propertyId}` : "/",
            },
            notification: {
                icon: "/favicon-192x192.png",
                badge: "/favicon-192x192.png",
                vibrate: [100, 50, 100],
            },
        },
    };
    const messaging = (0, messaging_1.getMessaging)();
    // Envoyer à chaque token
    const results = await Promise.allSettled(tokens.map((token) => messaging.send({ ...message, token })));
    // Nettoyer les tokens expirés/invalides
    const invalidTokens = [];
    results.forEach((result, idx) => {
        var _a;
        if (result.status === "rejected") {
            const errorCode = ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.code) || "";
            if (errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered") {
                invalidTokens.push(tokens[idx]);
            }
        }
    });
    // Supprimer les tokens invalides de Firestore
    if (invalidTokens.length > 0) {
        const batch = db.batch();
        for (const token of invalidTokens) {
            const tokenDoc = tokensSnap.docs.find((d) => d.data().token === token);
            if (tokenDoc)
                batch.delete(tokenDoc.ref);
        }
        await batch.commit();
        firebase_functions_1.logger.info(`Nettoyé ${invalidTokens.length} token(s) FCM invalide(s) pour ${userId}.`);
    }
    const sent = results.filter((r) => r.status === "fulfilled").length;
    firebase_functions_1.logger.info(`Push envoyé à ${userId}: ${sent}/${tokens.length} token(s) atteint(s).`);
});
// ─────────────────────────────────────────────────────────────────
// assignNotaireRole
// Valide un code notaire et assigne le rôle atomiquement côté serveur.
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
    const db = (0, firestore_2.getFirestore)();
    const uid = request.auth.uid;
    // Vérifier que l'utilisateur n'a pas déjà un rôle notaire/admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError("not-found", "Profil utilisateur introuvable.");
    }
    const currentRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (currentRole === "admin" || currentRole === "notaire") {
        throw new https_1.HttpsError("already-exists", "Vous avez déjà un rôle privilégié.");
    }
    // Transaction atomique : valider le code + assigner le rôle
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
        // Marquer le code comme utilisé
        tx.update(codeRef, {
            used: true,
            used_at: firestore_2.FieldValue.serverTimestamp(),
            used_by: uid,
        });
        // Assigner le rôle notaire
        tx.update(db.collection("users").doc(uid), {
            role: "notaire",
            updated_at: firestore_2.FieldValue.serverTimestamp(),
        });
    });
    firebase_functions_1.logger.info(`Rôle notaire assigné à ${uid} via code ${codeId}.`);
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────
// certifyProperty
// Un notaire certifie un bien qui lui est assigné (notaire_id).
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
    const db = (0, firestore_2.getFirestore)();
    const uid = request.auth.uid;
    // Vérifier que l'appelant est bien notaire
    const userDoc = await db.collection("users").doc(uid).get();
    if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== "notaire" && ((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Seuls les notaires peuvent certifier.");
    }
    // Vérifier que le bien existe et est assigné à ce notaire
    const propDoc = await db.collection("properties").doc(propertyId).get();
    if (!propDoc.exists) {
        throw new https_1.HttpsError("not-found", "Bien introuvable.");
    }
    const propData = propDoc.data();
    if (((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.role) === "notaire" && propData.notaire_id !== uid) {
        throw new https_1.HttpsError("permission-denied", "Ce bien ne vous est pas assigné.");
    }
    if (action === "certify") {
        // Vérifier que tous les documents requis sont validés
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
            updated_at: firestore_2.FieldValue.serverTimestamp(),
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
            updated_at: firestore_2.FieldValue.serverTimestamp(),
        });
    }
    // Log admin
    await db.collection("admin_logs").add({
        action: `property_${action}`,
        property_id: propertyId,
        performed_by: uid,
        reason: reason || null,
        created_at: firestore_2.FieldValue.serverTimestamp(),
    });
    // Notifier le propriétaire
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
        created_at: firestore_2.FieldValue.serverTimestamp(),
    });
    firebase_functions_1.logger.info(`Property ${propertyId} ${action}ed by notaire ${uid}.`);
    return { success: true };
});
// ─────────────────────────────────────────────────────────────────
// createAdmin
// L'admin principal crée un nouveau compte admin.
// ─────────────────────────────────────────────────────────────────
exports.createAdmin = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentification requise.");
    }
    const { email, password, fullName } = request.data;
    if (!email || !password || !fullName) {
        throw new https_1.HttpsError("invalid-argument", "email, password et fullName requis.");
    }
    const db = (0, firestore_2.getFirestore)();
    const uid = request.auth.uid;
    // Vérifier que l'appelant est admin
    const callerDoc = await db.collection("users").doc(uid).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Seul un admin peut créer un admin.");
    }
    // Créer l'utilisateur Firebase Auth
    const auth = (0, auth_1.getAuth)();
    let newUser;
    try {
        newUser = await auth.createUser({
            email,
            password,
            displayName: fullName,
        });
    }
    catch (err) {
        const error = err;
        throw new https_1.HttpsError("internal", error.message || "Erreur lors de la création.");
    }
    // Créer le profil Firestore avec rôle admin
    await db.collection("users").doc(newUser.uid).set({
        id: newUser.uid,
        email,
        full_name: fullName,
        role: "admin",
        created_at: firestore_2.FieldValue.serverTimestamp(),
        updated_at: firestore_2.FieldValue.serverTimestamp(),
        created_by: uid,
    });
    // Log
    await db.collection("admin_logs").add({
        action: "create_admin",
        target_uid: newUser.uid,
        target_email: email,
        performed_by: uid,
        created_at: firestore_2.FieldValue.serverTimestamp(),
    });
    firebase_functions_1.logger.info(`Admin ${email} créé par ${uid}.`);
    return { success: true, uid: newUser.uid };
});
//# sourceMappingURL=index.js.map