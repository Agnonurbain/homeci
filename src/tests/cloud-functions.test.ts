/**
 * HOMECI — Cloud Functions Tests
 *
 * Tests de structure et de logique métier des Cloud Functions.
 * Vérifie les exports, les guards de sécurité, les triggers, et la logique business.
 *
 * Exécuter : npx vitest run src/tests/cloud-functions.test.ts
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');
const FUNC = resolve(ROOT, 'functions/src');

function readFunc(filename: string): string {
  return readFileSync(resolve(FUNC, filename), 'utf-8');
}
function funcExists(filename: string): boolean {
  return existsSync(resolve(FUNC, filename));
}

// ══════════════════════════════════════════════════════════════════════════
// 1. INDEX — Module d'entrée
// ══════════════════════════════════════════════════════════════════════════

describe('1. index.ts — Entry point', () => {
  let content: string;

  beforeAll(() => {
    expect(funcExists('index.ts')).toBe(true);
    content = readFunc('index.ts');
  });

  it('exporte autoResetPropertyStatus', () => {
    expect(content).toContain('export { autoResetPropertyStatus }');
  });

  it('exporte sendPushNotification', () => {
    expect(content).toContain('export { sendPushNotification }');
  });

  it('exporte assignNotaireRole et certifyProperty', () => {
    expect(content).toContain('export { assignNotaireRole, certifyProperty }');
  });

  it('exporte createAdmin', () => {
    expect(content).toContain('export { createAdmin }');
  });

  it('exporte onNewChatMessage', () => {
    expect(content).toContain('export { onNewChatMessage }');
  });

  it('importe depuis scheduler.ts', () => {
    expect(content).toContain('from "./scheduler"');
  });

  it('importe depuis notifications.ts', () => {
    expect(content).toContain('from "./notifications"');
  });

  it('importe depuis notaire.ts', () => {
    expect(content).toContain('from "./notaire"');
  });

  it('importe depuis admin.ts', () => {
    expect(content).toContain('from "./admin"');
  });

  it('importe depuis chat.ts', () => {
    expect(content).toContain('from "./chat"');
  });

  it('contient les commentaires de section', () => {
    expect(content).toContain('Scheduler');
    expect(content).toContain('Notifications');
    expect(content).toContain('Notaire');
    expect(content).toContain('Admin');
    expect(content).toContain('Chat');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 2. FIREBASE-ADMIN — Module shared
// ══════════════════════════════════════════════════════════════════════════

describe('2. firebase-admin.ts — Shared module', () => {
  let content: string;

  beforeAll(() => {
    content = readFunc('firebase-admin.ts');
  });

  it('importe initializeApp de firebase-admin/app', () => {
    expect(content).toMatch(/from ["']firebase-admin\/app["']/);
  });

  it('importe getFirestore et FieldValue de firebase-admin/firestore', () => {
    expect(content).toMatch(/from ["']firebase-admin\/firestore["']/);
    expect(content).toContain('getFirestore');
    expect(content).toContain('FieldValue');
  });

  it('importe getMessaging de firebase-admin/messaging', () => {
    expect(content).toMatch(/from ["']firebase-admin\/messaging["']/);
    expect(content).toContain('getMessaging');
  });

  it('importe getAuth de firebase-admin/auth', () => {
    expect(content).toMatch(/from ["']firebase-admin\/auth["']/);
    expect(content).toContain('getAuth');
  });

  it('importe logger de firebase-functions', () => {
    expect(content).toMatch(/from ["']firebase-functions["']/);
    expect(content).toContain('logger');
  });

  it('appelle initializeApp()', () => {
    expect(content).toMatch(/initializeApp\(\)/);
  });

  it('exporte tous les services', () => {
    expect(content).toContain('getStorage');
    expect(content).toContain('getFirestore');
    expect(content).toContain('getMessaging');
    expect(content).toContain('getAuth');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 3. ADMIN — createAdmin
// ══════════════════════════════════════════════════════════════════════════

describe('3. admin.ts — createAdmin', () => {
  let content: string;

  beforeAll(() => { content = readFunc('admin.ts'); });

  it('utilise onCall de firebase-functions/v2/https', () => {
    expect(content).toContain("from \"firebase-functions/v2/https\"");
    expect(content).toContain('onCall');
  });

  it('définit la région europe-west1', () => {
    expect(content).toContain('region: "europe-west1"');
  });

  it("vérifie l'authentification (request.auth)", () => {
    expect(content).toContain('request.auth');
    expect(content).toContain('"unauthenticated"');
    expect(content).toContain('Authentification requise');
  });

  it('exige email, password et fullName', () => {
    expect(content).toContain('email');
    expect(content).toContain('password');
    expect(content).toContain('fullName');
    expect(content).toContain('"invalid-argument"');
    expect(content).toContain('email, password et fullName requis');
  });

  it("vérifie que l'appelant est admin", () => {
    expect(content).toContain('callerDoc');
    expect(content).toContain("role !== \"admin\"");
    expect(content).toContain('"permission-denied"');
    expect(content).toContain('Seul un admin peut créer un admin');
  });

  it('crée un utilisateur Firebase Auth', () => {
    expect(content).toContain('getAuth()');
    expect(content).toContain('createUser');
    expect(content).toContain('email');
    expect(content).toContain('displayName');
  });

  it('crée le profil Firestore avec role admin', () => {
    expect(content).toContain('collection("users")');
    expect(content).toContain('role: "admin"');
    expect(content).toContain('created_by');
  });

  it('utilise FieldValue.serverTimestamp()', () => {
    expect(content).toContain('serverTimestamp()');
  });

  it('écrit un log admin', () => {
    expect(content).toContain('collection("admin_logs")');
    expect(content).toContain('action: "create_admin"');
    expect(content).toContain('target_uid');
    expect(content).toContain('performed_by');
  });

  it('retourne { success, uid }', () => {
    expect(content).toContain('success: true');
    expect(content).toContain('uid: newUser.uid');
  });

  it('gère les erreurs de création Auth', () => {
    expect(content).toContain('catch');
    expect(content).toContain('"internal"');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 4. CHAT — onNewChatMessage
// ══════════════════════════════════════════════════════════════════════════

describe('4. chat.ts — onNewChatMessage', () => {
  let content: string;

  beforeAll(() => { content = readFunc('chat.ts'); });

  it('utilise onDocumentCreated de firebase-functions/v2/firestore', () => {
    expect(content).toContain("from \"firebase-functions/v2/firestore\"");
    expect(content).toContain('onDocumentCreated');
  });

  it('écoute les sous-collections messages de chats', () => {
    expect(content).toContain('document: "chats/{chatId}/messages/{messageId}"');
  });

  it('définit la région europe-west1', () => {
    expect(content).toContain('region: "europe-west1"');
  });

  it('récupère les données deévénement', () => {
    expect(content).toContain('event.data?.data()');
  });

  it('récupère chatId depuis event.params', () => {
    expect(content).toContain('event.params.chatId');
  });

  it('récupère sender_id depuis les données', () => {
    expect(content).toContain('data.sender_id');
  });

  it("récupère le chat pour identifier le destinataire", () => {
    expect(content).toContain('collection("chats")');
    expect(content).toContain('chat.tenant_id');
    expect(content).toContain('chat.owner_id');
  });

  it('calcule correctement le recipientId', () => {
    // Le pattern ternaire : si sender == tenant, recipient = owner, sinon tenant
    expect(content).toContain('senderId === chat.tenant_id ? chat.owner_id : chat.tenant_id');
  });

  it('vérifie les préférences de notification', () => {
    expect(content).toContain('notification_prefs');
    expect(content).toContain('collection("users")');
  });

  it('récupère le nom deexpéditeur', () => {
    expect(content).toContain('senderName');
    expect(content).toContain('full_name');
  });

  it('tronque le contenu du message à 100 caractères', () => {
    expect(content).toContain('.slice(0, 100)');
  });

  it('crée une notification de type new_message', () => {
    expect(content).toContain('collection("notifications")');
    expect(content).toContain('type: "new_message"');
    expect(content).toContain('notifTitle');
    expect(content).toContain('notifMessage');
  });

  it('inclut property_id dans la notification', () => {
    expect(content).toContain('property_id: chat.property_id');
  });

  it('vérifie le statut en ligne/hors ligne (last_seen)', () => {
    expect(content).toContain('last_seen');
    expect(content).toContain('isOnline');
    expect(content).toContain('ONLINE_THRESHOLD');
  });

  it('ajoute delivery_mode à la notification', () => {
    expect(content).toContain('delivery_mode:');
    expect(content).toContain('"instant"');
    expect(content).toContain('"push"');
  });

  it('ajoute push_sent flag pour éviter les doublons', () => {
    expect(content).toContain('push_sent:');
    expect(content).toContain('!isOnline');
  });

  it('envoie push direct si destinataire hors ligne', () => {
    expect(content).toContain('if (!isOnline)');
    expect(content).toContain('sendPushToUser');
  });

  it('inclut chat_id dans les données FCM', () => {
    expect(content).toContain('chat_id:');
    expect(content).toContain('chatId');
  });

  it('utilise le lien deep link vers le chat dans fcmOptions', () => {
    expect(content).toContain('open_chat=');
    expect(content).toContain('dashboard?open_chat=');
  });

  it('vérifie la préférence messages en plus de visits', () => {
    expect(content).toContain('notifPrefs?.messages');
    expect(content).toContain('notifPrefs?.visits');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 5. NOTAIRE — assignNotaireRole + certifyProperty
// ══════════════════════════════════════════════════════════════════════════

describe('5. notaire.ts — assignNotaireRole', () => {
  let content: string;

  beforeAll(() => { content = readFunc('notaire.ts'); });

  it('utilise onCall et HttpsError', () => {
    expect(content).toContain("from \"firebase-functions/v2/https\"");
    expect(content).toContain('onCall');
    expect(content).toContain('HttpsError');
  });

  it('exige codeId en string', () => {
    expect(content).toContain('codeId');
    expect(content).toContain('typeof codeId !== "string"');
    expect(content).toContain('"invalid-argument"');
    expect(content).toContain('codeId requis');
  });

  it("vérifie l'authentification", () => {
    expect(content).toContain('request.auth');
    expect(content).toContain('"unauthenticated"');
  });

  it("vérifie que l'utilisateur n'a pas déjà un rôle privilégié", () => {
    expect(content).toContain('currentRole');
    expect(content).toContain('"admin"');
    expect(content).toContain('"notaire"');
    expect(content).toContain('"already-exists"');
    expect(content).toContain('rôle privilégié');
  });

  it('utilise une transaction Firestore atomique', () => {
    expect(content).toContain('runTransaction');
  });

  it('vérifie que le code notaire existe et nest pas utilisé', () => {
    expect(content).toContain('collection("notaire_codes")');
    expect(content).toContain('codeDoc.exists');
    expect(content).toContain('codeDoc.data()?.used');
    expect(content).toContain('"not-found"');
    expect(content).toContain('Code notaire introuvable');
    expect(content).toContain('déjà été utilisé');
  });

  it('marque le code comme utilisé avec used_at et used_by', () => {
    expect(content).toContain('used: true');
    expect(content).toContain('used_at');
    expect(content).toContain('used_by');
  });

  it('assigne le rôle notaire àutilisateur', () => {
    expect(content).toContain('role: "notaire"');
    expect(content).toContain('updated_at');
  });
});

describe('5b. notaire.ts — certifyProperty', () => {
  let content: string;

  beforeAll(() => { content = readFunc('notaire.ts'); });

  it('exige propertyId et action', () => {
    expect(content).toContain('propertyId');
    expect(content).toContain('action');
    expect(content).toContain('"certify" | "reject"');
    expect(content).toContain('propertyId et action requis');
  });

  it('vérifie que lappelant est notaire ou admin', () => {
    expect(content).toContain('role !== "notaire"');
    expect(content).toContain('role !== "admin"');
    expect(content).toContain('"permission-denied"');
    expect(content).toContain('Seuls les notaires peuvent certifier');
  });

  it('vérifie que le bien existe', () => {
    expect(content).toContain('collection("properties")');
    expect(content).toContain('propDoc.exists');
    expect(content).toContain('"not-found"');
    expect(content).toContain('Bien introuvable');
  });

  it("vérifie que le bien est assigné au notaire (sauf admin)", () => {
    expect(content).toContain('propData.notaire_id !== uid');
    expect(content).toContain("Ce bien ne vous est pas assigné");
  });

  it('en cas de certification, vérifie que tous les documents sont valides', () => {
    expect(content).toContain('collection("documents")');
    expect(content).toContain('status === "valide"');
    expect(content).toContain('"failed-precondition"');
    expect(content).toContain('Tous les documents doivent être validés');
  });

  it('met à jour verified_notaire, verification_date, status=published en cas de certify', () => {
    expect(content).toContain('verified_notaire: true');
    expect(content).toContain('verification_date');
    expect(content).toContain('status: "published"');
  });

  it('exige une raison en cas de rejet', () => {
    expect(content).toContain('!reason');
    expect(content).toContain('"invalid-argument"');
    expect(content).toContain('Raison requise pour un rejet');
  });

  it('met à jour decertified_at et decertification_reason en cas de reject', () => {
    expect(content).toContain('verified_notaire: false');
    expect(content).toContain('status: "pending"');
    expect(content).toContain('decertified_at');
    expect(content).toContain('decertification_reason');
    expect(content).toContain('decertified_by');
  });

  it('écrit un log admin pour certify/reject', () => {
    expect(content).toContain('collection("admin_logs")');
    expect(content).toContain('property_${action}');
    expect(content).toContain('property_id: propertyId');
    expect(content).toContain('performed_by: uid');
  });

  it('notifie le propriétaire du bien', () => {
    expect(content).toContain('propData.owner_id');
    expect(content).toContain('type: "notaire"');
    expect(content).toContain('Bien certifié par le notaire');
    expect(content).toContain('Certification refusée');
  });

  it('retourne { success: true }', () => {
    expect(content).toContain('success: true');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 6. NOTIFICATIONS — sendPushNotification
// ══════════════════════════════════════════════════════════════════════════

describe('6. notifications.ts — sendPushNotification', () => {
  let content: string;
  let pushContent: string;

  beforeAll(() => {
    content = readFunc('notifications.ts');
    pushContent = readFunc('pushHelper.ts');
  });

  it('utilise onDocumentCreated de firestore v2', () => {
    expect(content).toContain("from \"firebase-functions/v2/firestore\"");
    expect(content).toContain('onDocumentCreated');
  });

  it('écoute la collection notifications/{notifId}', () => {
    expect(content).toContain('document: "notifications/{notifId}"');
  });

  it('extrait user_id, title, body, property_id', () => {
    expect(content).toContain('data.user_id');
    expect(content).toContain('data.title');
    expect(content).toContain('data.message');
    expect(content).toContain('data.property_id');
  });

  it('retourne early si pas de user_id', () => {
    expect(content).toContain('!userId');
    expect(content).toContain('logger.warn');
    expect(content).toContain('pas de user_id');
  });

  it('vérifie les préférences de notification', () => {
    expect(content).toContain('notification_prefs');
    expect(content).toContain('prefs.visits === false');
    expect(content).toContain('prefs.certifications === false');
    expect(content).toContain('prefs.system === false');
  });

  it('catégorise les types de notification (visit_, notaire_, system)', () => {
    expect(content).toContain("notifType.startsWith(\"visit_\")");
    expect(content).toContain("notifType.startsWith(\"notaire_\")");
    expect(content).toContain("notifType === \"system\"");
    expect(content).toContain("notifType === \"new_message\"");
  });

  it('délègue l\'envoi push à sendPushToUser (pushHelper)', () => {
    expect(content).toContain('sendPushToUser');
    expect(content).toContain('from "./pushHelper"');
  });

  it('récupère les tokens FCM depuis la sous-collection fcm_tokens', () => {
    expect(pushContent).toContain('collection("fcm_tokens")');
  });

  it('retourne early si aucun token FCM', () => {
    expect(pushContent).toContain('tokensSnap.empty');
    expect(pushContent).toContain('Aucun token FCM');
  });

  it('construit le message FCM avec notification + data + webpush', () => {
    expect(pushContent).toContain('notification: { title, body }');
    expect(content).toContain('property_id: propertyId');
    expect(content).toContain('notification_id');
    expect(pushContent).toContain('webpush');
    expect(pushContent).toContain('fcmOptions');
  });

  it('utilise getMessaging().send()', () => {
    expect(pushContent).toContain('getMessaging()');
    expect(pushContent).toContain('messaging.send');
  });

  it('envoie avec Promise.allSettled pour tolérance aux erreurs', () => {
    expect(pushContent).toContain('Promise.allSettled');
  });

  it('nettoie les tokens FCM invalides', () => {
    expect(pushContent).toContain('messaging/invalid-registration-token');
    expect(pushContent).toContain('messaging/registration-token-not-registered');
    expect(pushContent).toContain('invalidTokens');
    expect(pushContent).toContain('batch.delete');
  });

  it('loge le nombre de tokens atteints', () => {
    expect(pushContent).toContain('logger.info');
    expect(pushContent).toContain('token(s) atteint(s)');
  });

  it('vérifie le flag push_sent pour éviter les doublons', () => {
    expect(content).toContain('push_sent');
    expect(content).toContain('pushSent');
    expect(content).toContain('Push déjà envoyé');
  });

  it('inclut chat_id dans les données FCM si présent', () => {
    expect(content).toContain('chat_id:');
    expect(content).toContain('data.chat_id');
  });

  it('inclut le type de notification dans les données FCM', () => {
    expect(content).toContain('type: notifType');
  });

  it('utilise deep link vers chat si chat_id présent', () => {
    expect(content).toContain('open_chat=');
    expect(content).toContain('chatId');
  });

  it('sépare la vérification messages des visits', () => {
    expect(content).toContain('isMessage');
    expect(content).toContain('prefs.messages === false');
    expect(content).not.toContain("notifType.startsWith(\"visit_\") || notifType === \"new_message\"");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 7. SCHEDULER — autoResetPropertyStatus
// ══════════════════════════════════════════════════════════════════════════

describe('7. scheduler.ts — autoResetPropertyStatus', () => {
  let content: string;

  beforeAll(() => { content = readFunc('scheduler.ts'); });

  it('utilise onSchedule de firebase-functions/v2/scheduler', () => {
    expect(content).toContain("from \"firebase-functions/v2/scheduler\"");
    expect(content).toContain('onSchedule');
  });

  it('définit un schedule cron toutes les heures', () => {
    expect(content).toContain('schedule: "every 1 hours"');
  });

  it('utilise le fuseau horaire Africa/Abidjan', () => {
    expect(content).toContain('timeZone: "Africa/Abidjan"');
  });

  it('définit la région europe-west1', () => {
    expect(content).toContain('region: "europe-west1"');
  });

  it('calcule un cutoff de 3 jours', () => {
    expect(content).toContain('DELAY_DAYS');
    expect(content).toContain('3');
    expect(content).toContain('cutoff');
    expect(content).toContain('24 * 60 * 60 * 1000');
  });

  it('cherche les visites avec status "completed"', () => {
    expect(content).toContain('collection("visits")');
    expect(content).toContain('where("status", "==", "completed")');
  });

  it('regroupe les visites par property_id', () => {
    expect(content).toContain('propertyVisits');
    expect(content).toContain('Map');
    expect(content).toContain('property_id');
  });

  it('trouve la visite la plus récente par bien', () => {
    expect(content).toContain('visitDate');
    expect(content).toContain('Math.max');
  });

  it('vérifie si le délai de 3 jours est passé', () => {
    expect(content).toContain('info.visitDate > cutoff');
  });

  it('ne reset que les propriétés encore "published"', () => {
    expect(content).toContain('propData.status !== "published"');
  });

  it('rejette les visites expirées avec un message', () => {
    expect(content).toContain('status: "rejected"');
    expect(content).toContain('Délai de 3 jours dépassé');
    expect(content).toContain('visite expirée automatiquement');
  });

  it('marque la propriété avec auto_reset_at', () => {
    expect(content).toContain('auto_reset_at');
  });

  it('notifie le propriétaire avec un message système', () => {
    expect(content).toContain('user_id: info.ownerId');
    expect(content).toContain('type: "system"');
    expect(content).toContain('Délai de mise à jour expiré');
    expect(content).toContain('automatiquement remis en disponible');
  });

  it('notifie les locataires affectés', () => {
    expect(content).toContain('tenant_id');
    expect(content).toContain('Bien remis en disponible');
    expect(content).toContain('refaire une demande de visite');
  });

  it('utilise db.batch() pour les écritures atomiques', () => {
    expect(content).toContain('db.batch()');
    expect(content).toContain('batch.commit()');
  });

  it('loge le nombre de biens reset', () => {
    expect(content).toContain('resetCount');
    expect(content).toContain('logger.info');
    expect(content).toContain('bien(s) remis en disponible');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 8. SÉCURITÉ — Guards communs à toutes les fonctions
// ══════════════════════════════════════════════════════════════════════════

describe('8. Sécurité — Guards communs', () => {
  it('toutes les fonctions callable vérifient request.auth', () => {
    const admin = readFunc('admin.ts');
    const notaire = readFunc('notaire.ts');
    [admin, notaire].forEach(content => {
      expect(content).toContain('request.auth');
      expect(content).toContain('"unauthenticated"');
      expect(content).toContain('Authentification requise');
    });
  });

  it('toutes les fonctions utilisent la région europe-west1', () => {
    const admin = readFunc('admin.ts');
    const scheduler = readFunc('scheduler.ts');
    const chat = readFunc('chat.ts');
    const notifications = readFunc('notifications.ts');
    const notaire = readFunc('notaire.ts');
    [admin, scheduler, chat, notifications, notaire].forEach(content => {
      expect(content).toContain('europe-west1');
    });
  });

  it('toutes les fonctions utilisent getFirestore du shared module', () => {
    const files = ['admin.ts', 'chat.ts', 'notaire.ts', 'notifications.ts', 'scheduler.ts'];
    files.forEach(f => {
      const content = readFunc(f);
      expect(content).toContain("from \"./firebase-admin\"");
    });
  });

  it('les fonctions callable valident les arguments requis', () => {
    const admin = readFunc('admin.ts');
    const notaire = readFunc('notaire.ts');
    [admin, notaire].forEach(content => {
      expect(content).toContain('"invalid-argument"');
    });
  });

  it('les actions sensibles écrivent dans admin_logs (admin + notaire)', () => {
    const admin = readFunc('admin.ts');
    const notaire = readFunc('notaire.ts');
    [admin, notaire].forEach(content => {
      expect(content).toContain('admin_logs');
    });
  });

  it('les notifications sont créées pour informer les utilisateurs (notaire, scheduler, chat)', () => {
    const notaire = readFunc('notaire.ts');
    const scheduler = readFunc('scheduler.ts');
    const chat = readFunc('chat.ts');
    [notaire, scheduler, chat].forEach(content => {
      expect(content).toContain('collection("notifications")');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 9. INTÉGRITÉ — Cohérence entre modules
// ══════════════════════════════════════════════════════════════════════════

describe('9. Intégrité — Cohérence entre modules', () => {
  it('index.ts exporte exactement 9 fonctions nommées', () => {
    const content = readFunc('index.ts');
    // Match the exported names from the export { ... } from "..." lines
    const exportLines = content.match(/export \{[^}]+\} from/g) || [];
    const allNames = exportLines
      .map(line => line.match(/\{([^}]+)\}/)?.[1] || '')
      .join(',')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    expect(allNames).toContain('autoResetPropertyStatus');
    expect(allNames).toContain('sendPushNotification');
    expect(allNames).toContain('assignNotaireRole');
    expect(allNames).toContain('certifyProperty');
    expect(allNames).toContain('createAdmin');
    expect(allNames).toContain('onNewChatMessage');
    expect(allNames).toContain('onReportCreated');
    expect(allNames).toContain('cleanupOrphanedFiles');
    expect(allNames).toContain('aggregateDailyStats');
    expect(allNames.length).toBe(9);
  });

  it('tous les fichiers source existent', () => {
    expect(funcExists('firebase-admin.ts')).toBe(true);
    expect(funcExists('admin.ts')).toBe(true);
    expect(funcExists('chat.ts')).toBe(true);
    expect(funcExists('notaire.ts')).toBe(true);
    expect(funcExists('notifications.ts')).toBe(true);
    expect(funcExists('pushHelper.ts')).toBe(true);
    expect(funcExists('scheduler.ts')).toBe(true);
    expect(funcExists('storageCleanup.ts')).toBe(true);
    expect(funcExists('dailyStats.ts')).toBe(true);
    expect(funcExists('index.ts')).toBe(true);
  });

  it('aucun fichier ne contient de hardcoded credentials', () => {
    const files = ['admin.ts', 'chat.ts', 'notaire.ts', 'notifications.ts', 'scheduler.ts', 'firebase-admin.ts'];
    files.forEach(f => {
      const content = readFunc(f);
      expect(content).not.toMatch(/apiKey\s*:/);
      expect(content).not.toMatch(/serviceAccount/);
      expect(content).not.toMatch(/privateKey/);
    });
  });

  it('aucun console.log (utiliser logger)', () => {
    const files = ['admin.ts', 'chat.ts', 'notaire.ts', 'notifications.ts', 'scheduler.ts'];
    files.forEach(f => {
      const content = readFunc(f);
      expect(content).not.toMatch(/console\.(log|error|warn)/);
    });
  });
});
