import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileScanner } from '../fileScanner';

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper pour créer un Blob/File
function makeFile(content: string | ArrayBuffer, name: string, type: string): File {
  return new File([content], name, { type });
}

describe('fileScanner', () => {
  describe('quickCheck', () => {
    it('accepte un fichier normal', () => {
      const file = makeFile('test', 'photo.jpg', 'image/jpeg');
      const result = fileScanner.quickCheck(file);
      expect(result.safe).toBe(true);
    });

    it('rejette un fichier exécutable', () => {
      const file = makeFile('malware', 'virus.exe', 'application/octet-stream');
      const result = fileScanner.quickCheck(file);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Extension exécutable bloquée');
    });

    it('rejette une double extension suspecte', () => {
      // .js n'est pas dans la liste des extensions exécutables bloquées directement
      // mais déclenche la détection double extension
      const file = makeFile('malware', 'document.pdf.js', 'text/plain');
      const result = fileScanner.quickCheck(file);
      expect(result.safe).toBe(false);
    });

    it('rejette un fichier trop volumineux (>50MB)', () => {
      const content = new ArrayBuffer(51 * 1024 * 1024);
      const file = makeFile(content, 'huge.mp4', 'video/mp4');
      const result = fileScanner.quickCheck(file);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Fichier trop volumineux (>50MB)');
    });

    it('accepte les fichiers .bat, .cmd, .ps1', () => {
      const names = ['script.bat', 'install.cmd', 'run.ps1'];
      for (const name of names) {
        const file = makeFile('script', name, 'text/plain');
        expect(fileScanner.quickCheck(file).safe).toBe(false);
      }
    });
  });

  describe('scan', () => {
    it('scan un fichier texte sain', async () => {
      const file = makeFile('Contenu normal du fichier', 'notes.txt', 'text/plain');
      const result = await fileScanner.scan(file);
      expect(result.safe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('détecte un script suspect dans un fichier texte', async () => {
      const file = makeFile('<script>alert("xss")</script>', 'malicious.txt', 'text/plain');
      const result = await fileScanner.scan(file);
      expect(result.safe).toBe(false);
      expect(result.issues.some(i => i.includes('Pattern suspect'))).toBe(true);
    });

    it('rejette un fichier trop volumineux', async () => {
      const content = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const file = makeFile(content, 'big.bin', 'application/octet-stream');
      const result = await fileScanner.scan(file, { maxSizeBytes: 10 * 1024 * 1024 });
      expect(result.safe).toBe(false);
      expect(result.sizeOk).toBe(false);
    });

    it('rejette un type MIME non autorisé', async () => {
      const file = makeFile('content', 'file.exe', 'application/octet-stream');
      const result = await fileScanner.scan(file, {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      });
      expect(result.safe).toBe(false);
      expect(result.extensionOk).toBe(false);
    });

    it('accepte un fichier avec type MIME autorisé', async () => {
      const content = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(100).fill(0)]);
      const file = makeFile(content.buffer, 'image.png', 'image/png');
      const result = await fileScanner.scan(file, {
        allowedMimeTypes: ['image/png'],
      });
      expect(result.safe).toBe(true);
    });
  });
});
