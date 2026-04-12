import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dossierService,
  REQUIRED_DOSSIER_DOCS,
  ALL_DOSSIER_DOCS,
} from '../dossierService';

// Mock Firebase
beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock('../../lib/firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => ({}),
    id: 'user-1',
  })),
  updateDoc: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({
    docs: [],
  })),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(async () => {}),
  getDownloadURL: vi.fn(async () => 'https://firebasestorage.url/doc.pdf'),
  deleteObject: vi.fn(async () => {}),
}));

vi.mock('../utils/compressImage', () => ({
  compressImage: vi.fn(async (file: File) => file),
  COMPRESS_PRESETS: { avatar: { quality: 0.7 } },
}));

import * as fs from 'firebase/firestore';
const { getDoc, updateDoc, getDocs } = fs;

describe('dossierService constants', () => {
  it('REQUIRED_DOSSIER_DOCS contient 4 documents', () => {
    expect(REQUIRED_DOSSIER_DOCS).toHaveLength(4);
    expect(REQUIRED_DOSSIER_DOCS).toContain('pay_slip_1');
    expect(REQUIRED_DOSSIER_DOCS).toContain('pay_slip_2');
    expect(REQUIRED_DOSSIER_DOCS).toContain('pay_slip_3');
    expect(REQUIRED_DOSSIER_DOCS).toContain('employment_proof');
  });

  it('ALL_DOSSIER_DOCS contient 6 documents', () => {
    expect(ALL_DOSSIER_DOCS).toHaveLength(6);
    expect(ALL_DOSSIER_DOCS).toContain('guarantor_identity');
    expect(ALL_DOSSIER_DOCS).toContain('guarantor_income');
  });
});

describe('dossierService.calculateStats', () => {
  it('retourne 0% pour un dossier vide', () => {
    const stats = dossierService.calculateStats(undefined);
    expect(stats.progress).toBe(0);
    expect(stats.completedRequired).toBe(0);
    expect(stats.totalRequired).toBe(4);
    expect(stats.isComplete).toBe(false);
    expect(stats.canSubmit).toBe(false);
  });

  it('calcule 50% quand 2/4 documents requis sont présents', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
    };

    const stats = dossierService.calculateStats(dossier);
    expect(stats.progress).toBe(50);
    expect(stats.completedRequired).toBe(2);
    expect(stats.isComplete).toBe(false);
    expect(stats.canSubmit).toBe(false);
  });

  it('marque le dossier comme complet quand tous les requis sont là', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
      pay_slip_3_url: 'https://example.com/3.pdf',
      employment_proof_url: 'https://example.com/4.pdf',
    };

    const stats = dossierService.calculateStats(dossier);
    expect(stats.progress).toBe(100);
    expect(stats.completedRequired).toBe(4);
    expect(stats.isComplete).toBe(true);
    expect(stats.canSubmit).toBe(true);
  });

  it('compte les documents optionnels séparément', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
      pay_slip_3_url: 'https://example.com/3.pdf',
      employment_proof_url: 'https://example.com/4.pdf',
      guarantor_identity_url: 'https://example.com/5.pdf',
    };

    const stats = dossierService.calculateStats(dossier);
    expect(stats.completedRequired).toBe(4);
    expect(stats.completedOptional).toBe(1);
    expect(stats.totalOptional).toBe(2);
  });
});

describe('dossierService.isDossierComplete', () => {
  it('retourne false si un document requis manque', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
      pay_slip_3_url: 'https://example.com/3.pdf',
      // employment_proof manquant
    };

    expect(dossierService.isDossierComplete(dossier)).toBe(false);
  });

  it('retourne true si tous les documents requis sont présents', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
      pay_slip_3_url: 'https://example.com/3.pdf',
      employment_proof_url: 'https://example.com/4.pdf',
    };

    expect(dossierService.isDossierComplete(dossier)).toBe(true);
  });

  it('ignore les documents optionnels', () => {
    const dossier = {
      pay_slip_1_url: 'https://example.com/1.pdf',
      pay_slip_2_url: 'https://example.com/2.pdf',
      pay_slip_3_url: 'https://example.com/3.pdf',
      employment_proof_url: 'https://example.com/4.pdf',
      // guarantor_identity et guarantor_income manquants (optionnels)
    };

    expect(dossierService.isDossierComplete(dossier)).toBe(true);
  });
});

describe('dossierService.uploadDocument', () => {
  it('upload un fichier PDF et retourne l\'URL', async () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const url = await dossierService.uploadDocument('user-1', 'pay_slip_1', file);

    expect(url).toBe('https://firebasestorage.url/doc.pdf');
  });

  it('rejette un fichier trop volumineux (> 5 Mo)', async () => {
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });

    await expect(dossierService.uploadDocument('user-1', 'pay_slip_1', bigFile))
      .rejects.toThrow('trop volumineux');
  });

  it('rejette un format de fichier non accepté', async () => {
    const exeFile = new File(['content'], 'virus.exe', { type: 'application/x-msdownload' });

    await expect(dossierService.uploadDocument('user-1', 'pay_slip_1', exeFile))
      .rejects.toThrow('Format non accepté');
  });

  it('accepte les images JPG', async () => {
    const jpgFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const url = await dossierService.uploadDocument('user-1', 'pay_slip_1', jpgFile);
    expect(url).toBe('https://firebasestorage.url/doc.pdf');
  });

  it('accepte les images PNG', async () => {
    const pngFile = new File(['content'], 'photo.png', { type: 'image/png' });
    const url = await dossierService.uploadDocument('user-1', 'pay_slip_1', pngFile);
    expect(url).toBe('https://firebasestorage.url/doc.pdf');
  });

  it('accepte les images WebP', async () => {
    const webpFile = new File(['content'], 'photo.webp', { type: 'image/webp' });
    const url = await dossierService.uploadDocument('user-1', 'pay_slip_1', webpFile);
    expect(url).toBe('https://firebasestorage.url/doc.pdf');
  });
});

describe('dossierService.deleteDocument', () => {
  it('supprime le fichier du storage et met à jour Firestore', async () => {
    await dossierService.deleteDocument('user-1', 'pay_slip_1', 'https://example.com/doc.pdf');

    expect(updateDoc).toHaveBeenCalled();
    const callArgs = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    const data = callArgs[1] as Record<string, unknown>;
    expect(data['dossier.pay_slip_1_url']).toBeNull();
    expect(data['dossier.pay_slip_1_status']).toBeNull();
  });
});

describe('dossierService.updateDocumentStatus', () => {
  it('met à jour le statut d\'un document', async () => {
    await dossierService.updateDocumentStatus('user-1', 'pay_slip_1', 'provided');

    expect(updateDoc).toHaveBeenCalled();
    const callArgs = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    const data = callArgs[1] as Record<string, unknown>;
    expect(data['dossier.pay_slip_1_status']).toBe('provided');
  });
});

describe('dossierService.submitDossier', () => {
  it('rejette la soumission si le dossier n\'est pas complet', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({
      exists: () => true,
      id: 'user-1',
      data: () => ({
        dossier: {
          pay_slip_1_url: 'https://example.com/1.pdf',
          // incomplet
        },
      }),
    });

    await expect(dossierService.submitDossier('user-1'))
      .rejects.toThrow('n\'est pas complet');
  });

  it('soumet le dossier quand il est complet', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({
      exists: () => true,
      id: 'user-1',
      data: () => ({
        dossier: {
          pay_slip_1_url: 'https://example.com/1.pdf',
          pay_slip_2_url: 'https://example.com/2.pdf',
          pay_slip_3_url: 'https://example.com/3.pdf',
          employment_proof_url: 'https://example.com/4.pdf',
        },
      }),
    });

    await expect(dossierService.submitDossier('user-1')).resolves.not.toThrow();

    expect(updateDoc).toHaveBeenCalled();
    const callArgs = (updateDoc as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    const data = callArgs[1] as Record<string, unknown>;
    expect(data['dossier.overall_status']).toBe('submitted');
    expect(data['dossier.submitted_at']).toBeDefined();
  });

  it('rejette si l\'utilisateur n\'existe pas', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({ exists: () => false });

    await expect(dossierService.submitDossier('nonexistent'))
      .rejects.toThrow('introuvable');
  });
});

describe('dossierService.getDossier', () => {
  it('retourne null si l\'utilisateur n\'existe pas', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({ exists: () => false });

    const result = await dossierService.getDossier('user-1');
    expect(result).toBeNull();
  });

  it('retourne le dossier de l\'utilisateur', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({
      exists: () => true,
      id: 'user-1',
      data: () => ({
        dossier: {
          pay_slip_1_url: 'https://example.com/1.pdf',
          overall_status: 'submitted',
        },
      }),
    });

    const result = await dossierService.getDossier('user-1');
    expect(result).not.toBeNull();
    expect(result!.pay_slip_1_url).toBe('https://example.com/1.pdf');
  });

  it('retourne null si le champ dossier n\'existe pas', async () => {
    const mg = getDoc as ReturnType<typeof vi.fn>;
    mg.mockResolvedValueOnce({
      exists: () => true,
      id: 'user-1',
      data: () => ({ full_name: 'Test' }),
    });

    const result = await dossierService.getDossier('user-1');
    expect(result).toBeNull();
  });
});

describe('dossierService.findTenantsWithCompleteDossier', () => {
  it('retourne la liste des locataires avec dossier soumis', async () => {
    const md = getDocs as ReturnType<typeof vi.fn>;
    md.mockResolvedValueOnce({
      docs: [
        {
          id: 'tenant-1',
          data: () => ({
            full_name: 'Jean Kouassi',
            email: 'jean@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            role: 'locataire',
            dossier: { submitted_at: '2026-04-10T10:00:00Z' },
          }),
        },
        {
          id: 'tenant-2',
          data: () => ({
            full_name: 'Aya Diallo',
            email: 'aya@example.com',
            avatar_url: null,
            role: 'locataire',
            dossier: { submitted_at: '2026-04-11T14:00:00Z' },
          }),
        },
      ],
    });

    const results = await dossierService.findTenantsWithCompleteDossier();
    expect(results).toHaveLength(2);
    expect(results[0].uid).toBe('tenant-1');
    expect(results[0].full_name).toBe('Jean Kouassi');
    expect(results[1].submitted_at).toBe('2026-04-11T14:00:00Z');
  });

  it('retourne un tableau vide si aucun résultat', async () => {
    const md = getDocs as ReturnType<typeof vi.fn>;
    md.mockResolvedValueOnce({ docs: [] });

    const results = await dossierService.findTenantsWithCompleteDossier();
    expect(results).toHaveLength(0);
  });
});
