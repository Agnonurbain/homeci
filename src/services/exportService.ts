/**
 * HOMECI — Export Service
 *
 * Export de données en CSV pour l'administration.
 * Supporte : utilisateurs, biens, visites, enquêtes, signalements.
 * Format : séparateur point-virgule (;), UTF-8 BOM pour compatibilité Excel.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type ExportType = 'users' | 'properties' | 'visits' | 'surveys' | 'reports';

export interface ExportableUser {
  uid: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  verified: boolean;
  suspended: boolean;
  created_at: string;
  [key: string]: unknown;
}

export interface ExportableProperty {
  id: string;
  title: string;
  owner_id: string;
  property_type: string;
  transaction_type: string;
  price: number;
  city: string;
  commune: string;
  quartier: string;
  bedrooms: number;
  surface_area: number;
  status: string;
  verified_notaire: boolean;
  views_count: number;
  created_at: string;
  [key: string]: unknown;
}

export interface ExportableVisit {
  id: string;
  property_id: string;
  property_title?: string;
  tenant_name: string;
  tenant_email?: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  owner_id: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ExportableSurvey {
  id: string;
  user_id: string;
  user_role: string;
  rating: number;
  comment?: string;
  trigger: string;
  property_title?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ExportableReport {
  id: string;
  property_id: string;
  property_title: string;
  reporter_email: string;
  reporter_role: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

// ── Column Definitions ────────────────────────────────────────────────────

const COLUMNS: Record<ExportType, { key: string; label: string }[]> = {
  users: [
    { key: 'uid', label: 'UID' },
    { key: 'email', label: 'Email' },
    { key: 'full_name', label: 'Nom complet' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'role', label: 'Rôle' },
    { key: 'verified', label: 'Vérifié' },
    { key: 'suspended', label: 'Suspendu' },
    { key: 'created_at', label: 'Date inscription' },
  ],
  properties: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Titre' },
    { key: 'owner_id', label: 'Propriétaire' },
    { key: 'property_type', label: 'Type' },
    { key: 'transaction_type', label: 'Transaction' },
    { key: 'price', label: 'Prix (FCFA)' },
    { key: 'city', label: 'Ville' },
    { key: 'commune', label: 'Commune' },
    { key: 'quartier', label: 'Quartier' },
    { key: 'bedrooms', label: 'Chambres' },
    { key: 'surface_area', label: 'Surface (m²)' },
    { key: 'status', label: 'Statut' },
    { key: 'verified_notaire', label: 'Certifié notaire' },
    { key: 'views_count', label: 'Vues' },
    { key: 'created_at', label: 'Date création' },
  ],
  visits: [
    { key: 'id', label: 'ID' },
    { key: 'property_id', label: 'Bien ID' },
    { key: 'property_title', label: 'Bien' },
    { key: 'tenant_name', label: 'Locataire' },
    { key: 'tenant_email', label: 'Email locataire' },
    { key: 'preferred_date', label: 'Date souhaitée' },
    { key: 'preferred_time', label: 'Heure' },
    { key: 'status', label: 'Statut' },
    { key: 'owner_id', label: 'Propriétaire ID' },
    { key: 'created_at', label: 'Date demande' },
  ],
  surveys: [
    { key: 'id', label: 'ID' },
    { key: 'user_id', label: 'Utilisateur' },
    { key: 'user_role', label: 'Rôle' },
    { key: 'rating', label: 'Note (/5)' },
    { key: 'comment', label: 'Commentaire' },
    { key: 'trigger', label: 'Déclencheur' },
    { key: 'property_title', label: 'Bien' },
    { key: 'created_at', label: 'Date' },
  ],
  reports: [
    { key: 'id', label: 'ID' },
    { key: 'property_id', label: 'Bien ID' },
    { key: 'property_title', label: 'Bien' },
    { key: 'reporter_email', label: 'Signalé par' },
    { key: 'reporter_role', label: 'Rôle' },
    { key: 'reason', label: 'Motif' },
    { key: 'details', label: 'Détails' },
    { key: 'status', label: 'Statut' },
    { key: 'created_at', label: 'Date' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Échappe une valeur CSV (guillemets si nécessaire) */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'boolean' ? (val ? 'Oui' : 'Non') : String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Génère le contenu CSV à partir de données et d'un type d'export */
function generateCsvContent<T extends Record<string, unknown>>(
  data: T[],
  type: ExportType
): string {
  const cols = COLUMNS[type];
  const headers = cols.map(c => c.label);
  const rows = data.map(item =>
    cols.map(c => escapeCsvValue(item[c.key]))
  );

  // BOM UTF-8 pour compatibilité Excel
  return '\uFEFF' + [headers, ...rows].map(r => r.join(';')).join('\n');
}

/** Télécharge un fichier CSV généré */
function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Service ───────────────────────────────────────────────────────────────

export const exportService = {
  /**
   * Exporte des utilisateurs en CSV
   */
  exportUsers(users: ExportableUser[]): void {
    const content = generateCsvContent(users, 'users');
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(content, `homeci_utilisateurs_${date}.csv`);
  },

  /**
   * Exporte des biens en CSV
   */
  exportProperties(properties: ExportableProperty[]): void {
    const content = generateCsvContent(properties, 'properties');
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(content, `homeci_biens_${date}.csv`);
  },

  /**
   * Exporte des visites en CSV
   */
  exportVisits(visits: ExportableVisit[]): void {
    const content = generateCsvContent(visits, 'visits');
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(content, `homeci_visites_${date}.csv`);
  },

  /**
   * Exporte des enquêtes de satisfaction en CSV
   */
  exportSurveys(surveys: ExportableSurvey[]): void {
    const content = generateCsvContent(surveys, 'surveys');
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(content, `homeci_enquetes_${date}.csv`);
  },

  /**
   * Exporte des signalements en CSV
   */
  exportReports(reports: ExportableReport[]): void {
    const content = generateCsvContent(reports, 'reports');
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(content, `homeci_signalements_${date}.csv`);
  },

  /**
   * Retourne les colonnes pour un type d'export
   */
  getColumns(type: ExportType): { key: string; label: string }[] {
    return COLUMNS[type];
  },
};
