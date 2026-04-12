import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../auditService';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({ id: 'log-1' })),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({
    docs: [
      {
        id: 'log-1',
        data: () => ({
          action: 'admin_login',
          performed_by: 'admin-1',
          performed_by_email: 'admin@homeci.ci',
          created_at: { seconds: 1700000000, nanoseconds: 0, toDate: () => new Date() },
        }),
      },
    ],
  })),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
  Timestamp: class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(s: number, n: number) { this.seconds = s; this.nanoseconds = n; }
    toDate() { return new Date(); }
  },
}));

import * as fs from 'firebase/firestore';

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('enregistre un log et retourne son ID', async () => {
      const id = await auditService.log({
        action: 'admin_login',
        performed_by: 'admin-1',
        performed_by_email: 'admin@homeci.ci',
      });

      expect(id).toBe('log-1');
      expect(fs.addDoc).toHaveBeenCalledTimes(1);
    });

    it('inclut les détails optionnels', async () => {
      const id = await auditService.log({
        action: 'property_approved',
        performed_by: 'admin-1',
        property_id: 'prop-1',
        property_title: 'Villa Cocody',
      });

      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.property_id).toBe('prop-1');
      expect(data.property_title).toBe('Villa Cocody');
    });
  });

  describe('getAuditLogs', () => {
    it('récupère les logs triés par date', async () => {
      const logs = await auditService.getAuditLogs(1, 20);

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('admin_login');
      expect(fs.getDocs).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLogsByAction', () => {
    it('filtre les logs par action', async () => {
      const logs = await auditService.getLogsByAction('admin_login');

      expect(logs).toHaveLength(1);
      expect(fs.where).toHaveBeenCalledWith('action', '==', 'admin_login');
    });
  });

  describe('getLogsByUser', () => {
    it('filtre les logs par utilisateur', async () => {
      const logs = await auditService.getLogsByUser('admin-1');

      expect(logs).toHaveLength(1);
      expect(fs.where).toHaveBeenCalledWith('performed_by', '==', 'admin-1');
    });
  });

  describe('getLogsByTarget', () => {
    it('filtre les logs par cible', async () => {
      const logs = await auditService.getLogsByTarget('user-1');

      expect(logs).toHaveLength(1);
      expect(fs.where).toHaveBeenCalledWith('target_uid', '==', 'user-1');
    });
  });

  describe('raccourcis', () => {
    it('logAdminLogin enregistre une connexion réussie', async () => {
      const id = await auditService.logAdminLogin('admin-1', 'admin@homeci.ci', 'Admin');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('admin_login');
    });

    it('logAdminLoginFailed enregistre un échec', async () => {
      const id = await auditService.logAdminLoginFailed('fake@homeci.ci', 'Mot de passe incorrect');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('admin_login_failed');
    });

    it('logUserSuspend enregistre une suspension', async () => {
      const id = await auditService.logUserSuspend('admin-1', 'admin@homeci.ci', 'user-1', 'user@test.com', 'Comportement frauduleux');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('user_suspended');
      expect(data.reason).toBe('Comportement frauduleux');
    });

    it('logPropertyApproved enregistre une approbation', async () => {
      const id = await auditService.logPropertyApproved('admin-1', 'prop-1', 'Villa Cocody');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('property_approved');
    });

    it('logPropertyRejected enregistre un rejet avec motif', async () => {
      const id = await auditService.logPropertyRejected('admin-1', 'prop-1', 'Villa', 'Documents manquants');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('property_rejected');
      expect(data.reason).toBe('Documents manquants');
    });

    it('logPropertyCertified enregistre une certification', async () => {
      const id = await auditService.logPropertyCertified('notaire-1', 'prop-1', 'Villa');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('property_certified');
    });

    it('logPropertyDecertified enregistre une décértilification', async () => {
      const id = await auditService.logPropertyDecertified('notaire-1', 'prop-1', 'Villa', 'Faux documents');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('property_decertified');
    });

    it('logReportReviewed enregistre un signalement traité', async () => {
      const id = await auditService.logReportReviewed('admin-1', 'report-1', 'action_taken', 'Bien supprimé');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('report_reviewed');
    });

    it('logCgvUpdated enregistre une modification CGV', async () => {
      const id = await auditService.logCgvUpdated('admin-1', '2.0', 'locataire');
      expect(id).toBe('log-1');
      const callArgs = (fs.addDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
      const data = callArgs[1] as Record<string, unknown>;
      expect(data.action).toBe('cgv_updated');
    });
  });
});
