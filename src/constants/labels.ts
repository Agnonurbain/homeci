import { HColors, HAlpha } from '../styles/homeci-tokens';

/* ── Labels de type de bien ──────────────────────────────────────────────── */
export const TYPE_LABELS: Record<string, string> = {
    appartement: 'Appartement',
    maison: 'Maison',
    villa: 'Villa',
    terrain: 'Terrain',
    hotel: 'Hôtel',
    appart_hotel: 'Appart-Hôtel',
};

/* ── Labels de documents officiels ───────────────────────────────────────── */
export const DOC_LABELS: Record<string, string> = {
    titre_foncier: 'Titre foncier',
    permis_construire: 'Permis de construire',
    plan_cadastral: 'Plan cadastral',
    certificat_propriete: 'Certificat de propriété',
    arrete_lotissement: 'Arrêté de lotissement',
    autorisation_exploitation: "Autorisation d'exploitation",
    registre_commerce: 'Registre de commerce',
    cni: "Carte d'identité (CNI)",
    passeport: 'Passeport',
    attestation_residence: 'Attestation de résidence',
    registre_commerce_proprio: 'Registre de commerce (propriétaire)',
    carte_sejour: 'Carte de séjour / Résidence',
};

/* ── Configuration des rôles (badge style) ───────────────────────────────── */
export const ROLE_CFG: Record<string, { label: string; bg: string; bd: string; text: string }> = {
    locataire: { label: 'Locataire', bg: HAlpha.navy08, bd: HAlpha.navy20, text: HColors.navy },
    proprietaire: { label: 'Propriétaire', bg: HAlpha.vertCI10, bd: HAlpha.vertCI25, text: HColors.vertCI },
    agent: { label: 'Agent', bg: HAlpha.gold10, bd: HAlpha.gold25, text: HColors.brownMid },
    notaire: { label: 'Notaire', bg: HAlpha.orange10, bd: HAlpha.terra20, text: HColors.brownDeep },
    admin: { label: 'Admin', bg: HAlpha.bord10, bd: HAlpha.bord25, text: HColors.bordeaux },
};
