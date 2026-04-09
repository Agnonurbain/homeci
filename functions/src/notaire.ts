/**
 * HOMECI — Notaire-related callable functions
 * assignNotaireRole: validates a notaire code and assigns the role atomically.
 * certifyProperty: a notaire certifies or rejects a property.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, logger } from "./firebase-admin";

// ─────────────────────────────────────────────────────────────────
// assignNotaireRole
// ─────────────────────────────────────────────────────────────────
export const assignNotaireRole = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    const { codeId } = request.data as { codeId: string };
    if (!codeId || typeof codeId !== "string") {
      throw new HttpsError("invalid-argument", "codeId requis.");
    }

    const db = getFirestore();
    const uid = request.auth.uid;

    // Check user doesn't already have a privileged role
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "Profil utilisateur introuvable.");
    }
    const currentRole = userDoc.data()?.role;
    if (currentRole === "admin" || currentRole === "notaire") {
      throw new HttpsError("already-exists", "Vous avez déjà un rôle privilégié.");
    }

    // Atomic transaction: validate code + assign role
    await db.runTransaction(async (tx) => {
      const codeRef = db.collection("notaire_codes").doc(codeId);
      const codeDoc = await tx.get(codeRef);

      if (!codeDoc.exists) {
        throw new HttpsError("not-found", "Code notaire introuvable.");
      }
      if (codeDoc.data()?.used) {
        throw new HttpsError("already-exists", "Ce code a déjà été utilisé.");
      }

      tx.update(codeRef, {
        used: true,
        used_at: FieldValue.serverTimestamp(),
        used_by: uid,
      });

      tx.update(db.collection("users").doc(uid), {
        role: "notaire",
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    logger.info(`Rôle notaire assigné à ${uid} via code ${codeId}.`);
    return { success: true };
  }
);

// ─────────────────────────────────────────────────────────────────
// certifyProperty
// ─────────────────────────────────────────────────────────────────
export const certifyProperty = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    const { propertyId, action, reason } = request.data as {
      propertyId: string;
      action: "certify" | "reject";
      reason?: string;
    };

    if (!propertyId || !action) {
      throw new HttpsError("invalid-argument", "propertyId et action requis.");
    }

    const db = getFirestore();
    const uid = request.auth.uid;

    // Verify caller is notaire or admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "notaire" && userDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Seuls les notaires peuvent certifier.");
    }

    // Verify property exists and is assigned to this notaire
    const propDoc = await db.collection("properties").doc(propertyId).get();
    if (!propDoc.exists) {
      throw new HttpsError("not-found", "Bien introuvable.");
    }

    const propData = propDoc.data()!;
    if (userDoc.data()?.role === "notaire" && propData.notaire_id !== uid) {
      throw new HttpsError("permission-denied", "Ce bien ne vous est pas assigné.");
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
        throw new HttpsError(
          "failed-precondition",
          "Tous les documents doivent être validés avant certification."
        );
      }

      await db.collection("properties").doc(propertyId).update({
        verified_notaire: true,
        verification_date: new Date().toISOString(),
        status: "published",
        updated_at: FieldValue.serverTimestamp(),
      });
    } else {
      if (!reason) {
        throw new HttpsError("invalid-argument", "Raison requise pour un rejet.");
      }

      await db.collection("properties").doc(propertyId).update({
        verified_notaire: false,
        status: "pending",
        decertified_at: new Date().toISOString(),
        decertification_reason: reason,
        decertified_by: uid,
        updated_at: FieldValue.serverTimestamp(),
      });
    }

    // Admin log
    await db.collection("admin_logs").add({
      action: `property_${action}`,
      property_id: propertyId,
      performed_by: uid,
      reason: reason || null,
      created_at: FieldValue.serverTimestamp(),
    });

    // Notify owner
    await db.collection("notifications").doc().set({
      user_id: propData.owner_id,
      type: "notaire",
      title:
        action === "certify"
          ? "Bien certifié par le notaire"
          : "Certification refusée",
      message:
        action === "certify"
          ? `Votre bien "${propData.title}" a été certifié et publié.`
          : `La certification de "${propData.title}" a été refusée : ${reason}`,
      property_id: propertyId,
      read: false,
      created_at: FieldValue.serverTimestamp(),
    });

    logger.info(`Property ${propertyId} ${action}ed by notaire ${uid}.`);
    return { success: true };
  }
);
