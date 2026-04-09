"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = void 0;
/**
 * HOMECI — Admin callable functions
 * createAdmin: the principal admin creates a new admin account.
 */
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("./firebase-admin");
exports.createAdmin = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentification requise.");
    }
    const { email, password, fullName } = request.data;
    if (!email || !password || !fullName) {
        throw new https_1.HttpsError("invalid-argument", "email, password et fullName requis.");
    }
    const db = (0, firebase_admin_1.getFirestore)();
    const uid = request.auth.uid;
    // Verify caller is admin
    const callerDoc = await db.collection("users").doc(uid).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Seul un admin peut créer un admin.");
    }
    // Create Firebase Auth user
    const auth = (0, firebase_admin_1.getAuth)();
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
    // Create Firestore profile with admin role
    await db.collection("users").doc(newUser.uid).set({
        id: newUser.uid,
        email,
        full_name: fullName,
        role: "admin",
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
        updated_at: firebase_admin_1.FieldValue.serverTimestamp(),
        created_by: uid,
    });
    // Admin log
    await db.collection("admin_logs").add({
        action: "create_admin",
        target_uid: newUser.uid,
        target_email: email,
        performed_by: uid,
        created_at: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    firebase_admin_1.logger.info(`Admin ${email} créé par ${uid}.`);
    return { success: true, uid: newUser.uid };
});
//# sourceMappingURL=admin.js.map