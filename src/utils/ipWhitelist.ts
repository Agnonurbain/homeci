/**
 * HOMECI — IP Whitelist Middleware
 *
 * Middleware Express/Firebase Functions pour restreindre l'accès
 * au portail admin à des IPs autorisées.
 *
 * Utilise des variables d'environnement pour la liste des IPs autorisées.
 * Supporte les ranges CIDR (ex: 192.168.1.0/24).
 */

// ── Config ─────────────────────────────────────────────────────────────────

/**
 * Liste des IPs autorisées (séparées par des virgules).
 * Format : IPs individuelles ou ranges CIDR.
 * Exemple : "196.1.2.3,41.210.0.0/16,::1"
 */
const ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '').split(',').filter(Boolean);

// ── CIDR Check ─────────────────────────────────────────────────────────────

/** Vérifie si une IP appartient à un range CIDR */
function isIpInRange(ip: string, range: string): boolean {
  // IPv4 CIDR
  if (range.includes('/')) {
    const [base, maskStr] = range.split('/');
    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return false;

    const ipNum = ipToNumber(ip);
    const baseNum = ipToNumber(base);
    const maskNum = mask === 0 ? 0 : ~((1 << (32 - mask)) - 1);

    return (ipNum & maskNum) === (baseNum & maskNum);
  }

  return ip === range;
}

/** Convertit une IP IPv4 en nombre */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return 0;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// ── Middleware ─────────────────────────────────────────────────────────────

/**
 * Middleware pour vérifier l'IP du requérant.
 * Retourne true si l'IP est autorisée, false sinon.
 */
export function checkAdminIp(clientIp: string): boolean {
  // Si aucune IP n'est configurée, on autorise tout (mode dev)
  if (ALLOWED_IPS.length === 0) return true;

  // localhost toujours autorisé (développement local)
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost') return true;

  return ALLOWED_IPS.some(allowed => isIpInRange(clientIp, allowed.trim()));
}

/**
 * Middleware pour Firebase Functions HTTP
 */
export function adminIpMiddleware(req: any, res: any, next: () => void): void {
  const clientIp = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '';

  if (!checkAdminIp(clientIp)) {
    res.status(403).json({
      error: 'Accès refusé — IP non autorisée',
      ip: clientIp,
    });
    return;
  }

  next();
}

/**
 * Middleware pour Vercel (Edge Functions / API Routes)
 */
export function adminIpMiddlewareVercel(req: Request): Response | null {
  const clientIp =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '';

  if (!checkAdminIp(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Accès refusé — IP non autorisée', ip: clientIp }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null; // Continue
}

// ── Utilitaires ────────────────────────────────────────────────────────────

/**
 * Retourne la liste des IPs autorisées (pour debug/admin)
 */
export function getAllowedIps(): string[] {
  return ALLOWED_IPS.map(ip => ip.trim());
}

/**
 * Vérifie si la restriction IP est activée
 */
export function isIpRestrictionEnabled(): boolean {
  return ALLOWED_IPS.length > 0;
}
