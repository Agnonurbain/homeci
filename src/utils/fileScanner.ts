/**
 * HOMECI — File Scanner Service
 *
 * Scan de sécurité pour les fichiers uploadés.
 * Vérifie les signatures MIME, les extensions, et les patterns suspects.
 *
 * Ce service implémente une validation côté client-side avec :
 * - Vérification des signatures de fichiers (magic bytes)
 * - Détection de fichiers double-extension suspects
 * - Vérification de la taille
 * - Scan de patterns malveillants connus dans les fichiers texte/PDF
 *
 * Pour un vrai scan antivirus, intégrer ClamAV ou un service externe
 * (ex: VirusTotal API) côté Cloud Function.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface ScanResult {
  safe: boolean;
  issues: string[];
  mimeType: string | null;
  sizeOk: boolean;
  extensionOk: boolean;
}

export interface ScanOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

// ── Magic Bytes (signatures de fichiers) ──────────────────────────────────

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
};

// ── Patterns suspects ─────────────────────────────────────────────────────

const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>/gi,
  /javascript\s*:/gi,
  /on(load|error|click|mouseover)\s*=/gi,
  /eval\s*\(/gi,
  /document\.(cookie|write)/gi,
  /window\.location/gi,
  /iframe[^>]*src/gi,
];

// ── Service ───────────────────────────────────────────────────────────────

export const fileScanner = {
  /**
   * Scan un fichier blob pour détecter des problèmes de sécurité
   */
  async scan(file: File | Blob, options: ScanOptions = {}): Promise<ScanResult> {
    const result: ScanResult = {
      safe: true,
      issues: [],
      mimeType: file.type || null,
      sizeOk: true,
      extensionOk: true,
    };

    // 1. Vérification taille
    const maxSize = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB par défaut
    if (file.size > maxSize) {
      result.safe = false;
      result.sizeOk = false;
      result.issues.push(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB > ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
    }

    // 2. Vérification MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      const mime = file.type.toLowerCase();
      if (!options.allowedMimeTypes.includes(mime)) {
        result.safe = false;
        result.extensionOk = false;
        result.issues.push(`Type MIME non autorisé : ${mime}`);
      }
    }

    // 3. Vérification signature (magic bytes)
    if (file.size >= 4) {
      const buffer = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const declaredType = (file.type || '').toLowerCase();

      // Vérifie si les magic bytes correspondent au type déclaré
      if (MAGIC_BYTES[declaredType]) {
        const expectedSignatures = MAGIC_BYTES[declaredType];
        const hasMatch = expectedSignatures.some(sig => {
          return sig.every((byte, i) => buffer[i] === byte);
        });

        if (!hasMatch && result.safe) {
          result.safe = false;
          result.issues.push(`Signature fichier ne correspond pas au type déclaré (${declaredType})`);
        }
      }
    }

    // 4. Scan contenu texte pour patterns suspects (pour PDF et fichiers texte)
    if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
      try {
        const text = await file.text();
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(text)) {
            result.safe = false;
            result.issues.push(`Pattern suspect détecté : ${pattern.source}`);
            break;
          }
        }
      } catch {
        // Impossible de lire le contenu texte — on ignore
      }
    }

    return result;
  },

  /**
   * Scan un fichier avant upload (vérification rapide)
   */
  quickCheck(file: File): { safe: boolean; reason?: string } {
    // Vérifie double extension suspecte
    const name = file.name.toLowerCase();
    if (/\.(js|exe|bat|cmd|ps1|vbs|wsf|scr|pif|com|dll)$/i.test(name)) {
      return { safe: false, reason: 'Extension exécutable bloquée' };
    }

    // Vérifie double extension (ex: file.pdf.exe)
    const extensions = name.split('.').filter(Boolean);
    if (extensions.length >= 3) {
      const lastExt = extensions[extensions.length - 1];
      if (['exe', 'bat', 'cmd', 'ps1', 'vbs', 'js'].includes(lastExt)) {
        return { safe: false, reason: 'Double extension suspecte détectée' };
      }
    }

    // Vérifie taille basique (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return { safe: false, reason: 'Fichier trop volumineux (>50MB)' };
    }

    return { safe: true };
  },
};

// ── Cloud Function Helper ─────────────────────────────────────────────────

/**
 * Fonction helper pour Cloud Functions — scan côté serveur.
 * À utiliser dans une Cloud Function HTTP pour scanner les fichiers
 * après upload dans Firebase Storage.
 *
 * Pour un vrai scan antivirus, appeler l'API ClamAV ou VirusTotal ici.
 */
export async function scanServerFile(
  filePath: string,
  bucket: any,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const result: ScanResult = {
    safe: true,
    issues: [],
    mimeType: null,
    sizeOk: true,
    extensionOk: true,
  };

  try {
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();

    result.mimeType = metadata.contentType;

    // Vérifie taille
    const maxSize = options.maxSizeBytes || 10 * 1024 * 1024;
    if (metadata.size > maxSize) {
      result.safe = false;
      result.sizeOk = false;
      result.issues.push(`Fichier serveur trop volumineux (${metadata.size} bytes)`);
    }

    // Vérifie MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(metadata.contentType)) {
        result.safe = false;
        result.issues.push(`Type MIME serveur non autorisé : ${metadata.contentType}`);
      }
    }

    // Scan contenu pour patterns suspects
    if (metadata.contentType === 'application/pdf' || metadata.contentType?.startsWith('text/')) {
      const [content] = await file.download();
      const text = content.toString('utf-8');
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(text)) {
          result.safe = false;
          result.issues.push(`Pattern suspect côté serveur : ${pattern.source}`);
          break;
        }
      }
    }
  } catch (err) {
    result.safe = false;
    result.issues.push(`Erreur lors du scan serveur : ${err}`);
  }

  return result;
}
