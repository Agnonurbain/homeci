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

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions";

initializeApp();

const DELAY_DAYS = 3;

export const autoResetPropertyStatus = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Africa/Abidjan",
    region: "europe-west1",
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const cutoff = new Date(now.getTime() - DELAY_DAYS * 24 * 60 * 60 * 1000);

    // 1. Trouver toutes les visites "completed"
    const visitsSnap = await db
      .collection("visits")
      .where("status", "==", "completed")
      .get();

    if (visitsSnap.empty) {
      logger.info("Aucune visite complétée à vérifier.");
      return;
    }

    // 2. Grouper par property_id et trouver la date de visite
    const propertyVisits = new Map<
      string,
      { visitDate: Date; ownerId: string; propertyTitle: string }
    >();

    for (const doc of visitsSnap.docs) {
      const data = doc.data();
      const propertyId = data.property_id as string;
      const preferredDate = data.preferred_date as string;
      const updatedAt = data.updated_at?.toDate?.() || new Date(preferredDate);

      const visitDate = new Date(
        Math.max(new Date(preferredDate).getTime(), updatedAt.getTime())
      );

      const existing = propertyVisits.get(propertyId);
      if (!existing || visitDate > existing.visitDate) {
        propertyVisits.set(propertyId, {
          visitDate,
          ownerId: data.owner_id as string,
          propertyTitle: (data.property_title as string) || "Bien immobilier",
        });
      }
    }

    // 3. Pour chaque propriété, vérifier si le délai est dépassé
    let resetCount = 0;

    for (const [propertyId, info] of propertyVisits) {
      if (info.visitDate > cutoff) continue;

      const propDoc = await db.collection("properties").doc(propertyId).get();
      if (!propDoc.exists) continue;

      const propData = propDoc.data();
      if (!propData) continue;

      // Ne reset que les biens encore "published"
      if (propData.status !== "published") continue;

      const batch = db.batch();

      // Rejeter les visites completed expirées
      const completedVisits = visitsSnap.docs.filter(
        (d) =>
          d.data().property_id === propertyId &&
          d.data().status === "completed"
      );

      for (const visitDoc of completedVisits) {
        batch.update(visitDoc.ref, {
          status: "rejected",
          owner_notes:
            "Délai de 3 jours dépassé — visite expirée automatiquement.",
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      // Marquer le bien comme auto-reset
      batch.update(propDoc.ref, {
        auto_reset_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

      // Notifier le propriétaire
      batch.set(db.collection("notifications").doc(), {
        user_id: info.ownerId,
        type: "system",
        title: "⏰ Délai de mise à jour expiré",
        message: `Le délai de 3 jours pour mettre à jour le statut de "${info.propertyTitle}" est expiré. Le bien a été automatiquement remis en disponible.`,
        property_id: propertyId,
        read: false,
        created_at: FieldValue.serverTimestamp(),
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
          created_at: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      resetCount++;

      logger.info(
        `Auto-reset: "${info.propertyTitle}" (${propertyId}) — ` +
          `${completedVisits.length} visite(s) expirée(s).`
      );
    }

    logger.info(
      `Auto-reset terminé: ${resetCount} bien(s) remis en disponible.`
    );
  }
);

/**
 * sendPushNotification
 * Déclenché automatiquement quand un document est créé dans /notifications/{notifId}.
 * Récupère les tokens FCM du destinataire et envoie un push.
 */
export const sendPushNotification = onDocumentCreated(
  {
    document: "notifications/{notifId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const userId = data.user_id as string;
    const title = (data.title as string) || "HOMECI";
    const body = (data.message as string) || "";
    const propertyId = (data.property_id as string) || "";

    if (!userId) {
      logger.warn("sendPushNotification: pas de user_id dans la notification.");
      return;
    }

    const notifType = (data.type as string) || "";
    const db = getFirestore();

    // Vérifier les préférences de notification du destinataire
    const userSnap = await db.collection("users").doc(userId).get();
    const prefs = userSnap.data()?.notification_prefs;
    if (prefs) {
      const isVisit = notifType.startsWith("visit_") || notifType === "new_message";
      const isCert = notifType.startsWith("notaire_");
      const isSystem = notifType === "system";
      if ((isVisit && prefs.visits === false) || (isCert && prefs.certifications === false) || (isSystem && prefs.system === false)) {
        logger.info(`Push ignoré pour ${userId}: notification ${notifType} désactivée dans les préférences.`);
        return;
      }
    }

    // Récupérer tous les tokens FCM du destinataire
    const tokensSnap = await db
      .collection("users")
      .doc(userId)
      .collection("fcm_tokens")
      .get();

    if (tokensSnap.empty) {
      logger.info(`Aucun token FCM pour l'utilisateur ${userId}.`);
      return;
    }

    const tokens = tokensSnap.docs.map((d) => d.data().token as string);

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
          vibrate: [100, 50, 100] as unknown as number[],
        },
      },
    };

    const messaging = getMessaging();

    // Envoyer à chaque token
    const results = await Promise.allSettled(
      tokens.map((token) =>
        messaging.send({ ...message, token })
      )
    );

    // Nettoyer les tokens expirés/invalides
    const invalidTokens: string[] = [];
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        const errorCode = (result.reason as any)?.code || "";
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Supprimer les tokens invalides de Firestore
    if (invalidTokens.length > 0) {
      const batch = db.batch();
      for (const token of invalidTokens) {
        const tokenDoc = tokensSnap.docs.find((d) => d.data().token === token);
        if (tokenDoc) batch.delete(tokenDoc.ref);
      }
      await batch.commit();
      logger.info(
        `Nettoyé ${invalidTokens.length} token(s) FCM invalide(s) pour ${userId}.`
      );
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    logger.info(
      `Push envoyé à ${userId}: ${sent}/${tokens.length} token(s) atteint(s).`
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// assignNotaireRole
// Valide un code notaire et assigne le rôle atomiquement côté serveur.
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

    // Vérifier que l'utilisateur n'a pas déjà un rôle notaire/admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "Profil utilisateur introuvable.");
    }
    const currentRole = userDoc.data()?.role;
    if (currentRole === "admin" || currentRole === "notaire") {
      throw new HttpsError("already-exists", "Vous avez déjà un rôle privilégié.");
    }

    // Transaction atomique : valider le code + assigner le rôle
    await db.runTransaction(async (tx) => {
      const codeRef = db.collection("notaire_codes").doc(codeId);
      const codeDoc = await tx.get(codeRef);

      if (!codeDoc.exists) {
        throw new HttpsError("not-found", "Code notaire introuvable.");
      }
      if (codeDoc.data()?.used) {
        throw new HttpsError("already-exists", "Ce code a déjà été utilisé.");
      }

      // Marquer le code comme utilisé
      tx.update(codeRef, {
        used: true,
        used_at: FieldValue.serverTimestamp(),
        used_by: uid,
      });

      // Assigner le rôle notaire
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
// Un notaire certifie un bien qui lui est assigné (notaire_id).
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

    // Vérifier que l'appelant est bien notaire
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.data()?.role !== "notaire" && userDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Seuls les notaires peuvent certifier.");
    }

    // Vérifier que le bien existe et est assigné à ce notaire
    const propDoc = await db.collection("properties").doc(propertyId).get();
    if (!propDoc.exists) {
      throw new HttpsError("not-found", "Bien introuvable.");
    }

    const propData = propDoc.data()!;
    if (userDoc.data()?.role === "notaire" && propData.notaire_id !== uid) {
      throw new HttpsError(
        "permission-denied",
        "Ce bien ne vous est pas assigné."
      );
    }

    if (action === "certify") {
      // Vérifier que tous les documents requis sont validés
      const docsSnap = await db
        .collection("properties")
        .doc(propertyId)
        .collection("documents")
        .get();

      const allValid = docsSnap.docs.every(
        (d) => d.data().status === "valide"
      );

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

    // Log admin
    await db.collection("admin_logs").add({
      action: `property_${action}`,
      property_id: propertyId,
      performed_by: uid,
      reason: reason || null,
      created_at: FieldValue.serverTimestamp(),
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
      created_at: FieldValue.serverTimestamp(),
    });

    logger.info(
      `Property ${propertyId} ${action}ed by notaire ${uid}.`
    );
    return { success: true };
  }
);

// ─────────────────────────────────────────────────────────────────
// createAdmin
// L'admin principal crée un nouveau compte admin.
// ─────────────────────────────────────────────────────────────────
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

    // Vérifier que l'appelant est admin
    const callerDoc = await db.collection("users").doc(uid).get();
    if (callerDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Seul un admin peut créer un admin.");
    }

    // Créer l'utilisateur Firebase Auth
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

    // Créer le profil Firestore avec rôle admin
    await db.collection("users").doc(newUser.uid).set({
      id: newUser.uid,
      email,
      full_name: fullName,
      role: "admin",
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      created_by: uid,
    });

    // Log
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

/**
 * onNewChatMessage
 * Déclenché quand un message est créé dans /chats/{chatId}/messages/{messageId}.
 * Crée une notification "new_message" pour le destinataire.
 */
export const onNewChatMessage = onDocumentCreated(
  {
    document: "chats/{chatId}/messages/{messageId}",
    region: "europe-west1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const chatId = event.params.chatId;
    const senderId = data.sender_id;
    const db = getFirestore();

    // Récupérer le chat pour identifier le destinataire
    const chatSnap = await db.collection("chats").doc(chatId).get();
    if (!chatSnap.exists) return;

    const chat = chatSnap.data()!;
    const recipientId = senderId === chat.tenant_id ? chat.owner_id : chat.tenant_id;

    if (!recipientId) return;

    // Vérifier les préférences de notification du destinataire
    const recipientSnap = await db.collection("users").doc(recipientId).get();
    const recipientData = recipientSnap.data();
    if (recipientData?.notification_prefs?.visits === false) return;

    // Récupérer le nom de l'expéditeur
    const senderSnap = await db.collection("users").doc(senderId).get();
    const senderName = senderSnap.data()?.full_name || "Quelqu'un";

    const content = String(data.content || "").slice(0, 100);

    await db.collection("notifications").add({
      user_id: recipientId,
      type: "new_message",
      title: `Message de ${senderName}`,
      message: content,
      property_id: chat.property_id || null,
      read: false,
      created_at: FieldValue.serverTimestamp(),
    });

    logger.info(`Notification new_message créée pour ${recipientId} (chat ${chatId}).`);
  }
);
