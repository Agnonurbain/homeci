/**
 * HOMECI — Admin callable functions
 * createAdmin: the principal admin creates a new admin account.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, getAuth, FieldValue, logger } from "./firebase-admin";

export const createAdmin = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    const { email, password, fullName } = request.data as {
      email: string;
      password: string;
      fullName: string;
    };

    if (!email || !password || !fullName) {
      throw new HttpsError("invalid-argument", "email, password et fullName requis.");
    }

    const db = getFirestore();
    const uid = request.auth.uid;

    // Verify caller is admin
    const callerDoc = await db.collection("users").doc(uid).get();
    if (callerDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Seul un admin peut créer un admin.");
    }

    // Create Firebase Auth user
    const auth = getAuth();
    let newUser;
    try {
      newUser = await auth.createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      throw new HttpsError("internal", error.message || "Erreur lors de la création.");
    }

    // Create Firestore profile with admin role
    await db.collection("users").doc(newUser.uid).set({
      id: newUser.uid,
      email,
      full_name: fullName,
      role: "admin",
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      created_by: uid,
    });

    // Admin log
    await db.collection("admin_logs").add({
      action: "create_admin",
      target_uid: newUser.uid,
      target_email: email,
      performed_by: uid,
      created_at: FieldValue.serverTimestamp(),
    });

    logger.info(`Admin ${email} créé par ${uid}.`);
    return { success: true, uid: newUser.uid };
  }
);
