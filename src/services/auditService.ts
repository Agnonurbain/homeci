/**
 * HOMECI — Audit Log Service
 *
 * Enregistre toutes les actions sensibles dans la collection `admin_logs`.
 * Actions tracées :
 * - Modération (approbation/rejet de biens)
 * - Suspension/réactivation d'utilisateurs
 * - Certification/décértilification de biens
 * - Création/suppression de comptes admin
 * - Changements de rôle
 * - Connexions/déconnexions admin
 * - Signalements traités
 * - CGV modifiées
 */

import {
  collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ── Types ─────────────────────────────────────────────────────────────────

export type AuditAction =
  // Auth
  | 'admin_login'
  | 'admin_logout'
  | 'admin_login_failed'
  | 'admin_account_locked'
  // User management
  | 'user_suspended'
  | 'user_reactivated'
  | 'user_role_changed'
  | 'user_deleted'
  // Property moderation
  | 'property_approved'
  | 'property_rejected'
  | 'property_deleted'
  | 'property_featured'
  | 'property_unfeatured'
  // Notaire
  | 'property_certified'
  | 'property_decertified'
  | 'notaire_code_created'
  | 'notaire_assigned'
  // Admin management
  | 'create_admin'
  | 'admin_deleted'
  // Reports
  | 'report_reviewed'
  | 'report_dismissed'
  // CGV
  | 'cgv_updated'
  // Ads
  | 'ad_created'
  | 'ad_updated'
  | 'ad_deleted'
  // Custom
  | string;

export interface AuditLog {
  id: string;
  action: AuditAction;
  performed_by?: string;
  performed_by_email?: string;
  performed_by_name?: string;
  target_uid?: string;
  target_email?: string;
  target_name?: string;
  property_id?: string;
  property_title?: string;
  report_id?: string;
  reason?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ── Service ──────────────────────────────────────────────────────────────

export const auditService = {
  /**
   * Enregistre une action dans les logs d'audit
   */
  async log(data: Omit<AuditLog, 'id' | 'created_at'>): Promise<string> {
    const ref = await addDoc(collection(db, 'admin_logs'), {
      ...data,
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  /**
   * Récupère les logs d'audit avec pagination
   */
  async getAuditLogs(page: number = 1, pageSize: number = 20): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'admin_logs'),
      orderBy('created_at', 'desc'),
      limit(pageSize * page)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: toISO((d.data() as any).created_at),
    })) as AuditLog[];
  },

  /**
   * Filtre les logs par action
   */
  async getLogsByAction(action: AuditAction, pageSize: number = 20): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'admin_logs'),
      where('action', '==', action),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: toISO((d.data() as any).created_at),
    })) as AuditLog[];
  },

  /**
   * Filtre les logs par utilisateur (qui a effectué l'action)
   */
  async getLogsByUser(performedBy: string, pageSize: number = 20): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'admin_logs'),
      where('performed_by', '==', performedBy),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: toISO((d.data() as any).created_at),
    })) as AuditLog[];
  },

  /**
   * Filtre les logs par cible (utilisateur ou propriété visé)
   */
  async getLogsByTarget(targetUid: string, pageSize: number = 20): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'admin_logs'),
      where('target_uid', '==', targetUid),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: toISO((d.data() as any).created_at),
    })) as AuditLog[];
  },

  /**
   * Raccourci : log de connexion admin réussie
   */
  async logAdminLogin(uid: string, email: string, name: string): Promise<string> {
    return this.log({
      action: 'admin_login',
      performed_by: uid,
      performed_by_email: email,
      performed_by_name: name,
    });
  },

  /**
   * Raccourci : log de connexion admin échouée
   */
  async logAdminLoginFailed(email: string, reason?: string): Promise<string> {
    return this.log({
      action: 'admin_login_failed',
      performed_by_email: email,
      reason: reason || 'Identifiants incorrects',
    });
  },

  /**
   * Raccourci : log de suspension d'utilisateur
   */
  async logUserSuspend(
    performedBy: string, performedByEmail: string,
    targetUid: string, targetEmail: string, reason: string
  ): Promise<string> {
    return this.log({
      action: 'user_suspended',
      performed_by: performedBy,
      performed_by_email: performedByEmail,
      target_uid: targetUid,
      target_email: targetEmail,
      reason,
    });
  },

  /**
   * Raccourci : log de réactivation d'utilisateur
   */
  async logUserReactivate(
    performedBy: string, performedByEmail: string,
    targetUid: string, targetEmail: string
  ): Promise<string> {
    return this.log({
      action: 'user_reactivated',
      performed_by: performedBy,
      performed_by_email: performedByEmail,
      target_uid: targetUid,
      target_email: targetEmail,
    });
  },

  /**
   * Raccourci : log d'approbation de bien
   */
  async logPropertyApproved(
    performedBy: string, propertyId: string, propertyTitle: string
  ): Promise<string> {
    return this.log({
      action: 'property_approved',
      performed_by: performedBy,
      property_id: propertyId,
      property_title: propertyTitle,
    });
  },

  /**
   * Raccourci : log de rejet de bien
   */
  async logPropertyRejected(
    performedBy: string, propertyId: string, propertyTitle: string, reason: string
  ): Promise<string> {
    return this.log({
      action: 'property_rejected',
      performed_by: performedBy,
      property_id: propertyId,
      property_title: propertyTitle,
      reason,
    });
  },

  /**
   * Raccourci : log de suppression de bien
   */
  async logPropertyDeleted(
    performedBy: string, propertyId: string, propertyTitle: string, reason?: string
  ): Promise<string> {
    return this.log({
      action: 'property_deleted',
      performed_by: performedBy,
      property_id: propertyId,
      property_title: propertyTitle,
      reason,
    });
  },

  /**
   * Raccourci : log de certification
   */
  async logPropertyCertified(
    performedBy: string, propertyId: string, propertyTitle: string
  ): Promise<string> {
    return this.log({
      action: 'property_certified',
      performed_by: performedBy,
      property_id: propertyId,
      property_title: propertyTitle,
    });
  },

  /**
   * Raccourci : log de décértilification
   */
  async logPropertyDecertified(
    performedBy: string, propertyId: string, propertyTitle: string, reason: string
  ): Promise<string> {
    return this.log({
      action: 'property_decertified',
      performed_by: performedBy,
      property_id: propertyId,
      property_title: propertyTitle,
      reason,
    });
  },

  /**
   * Raccourci : log de signalement traité
   */
  async logReportReviewed(
    performedBy: string, reportId: string, action: 'dismissed' | 'action_taken', reason?: string
  ): Promise<string> {
    return this.log({
      action: action === 'dismissed' ? 'report_dismissed' : 'report_reviewed',
      performed_by: performedBy,
      report_id: reportId,
      reason,
    });
  },

  /**
   * Raccourci : log de modification CGV
   */
  async logCgvUpdated(
    performedBy: string, version: string, role: string
  ): Promise<string> {
    return this.log({
      action: 'cgv_updated',
      performed_by: performedBy,
      details: { version, role },
    });
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}
