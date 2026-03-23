import React from 'react';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

/* ── Styles de statut de visite (Owner/Agent) ────────────────────────────── */
export const VISIT_STATUS_STYLES: Record<string, {
    bg: string; text: string; border: string; label: string; icon: React.ReactNode;
}> = {
    pending: { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'En attente', icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }) },
    accepted: { bg: HAlpha.vertCI10, text: HColors.vertCI, border: HAlpha.vertCI25, label: 'Acceptée', icon: React.createElement(CheckCircle, { className: 'w-3.5 h-3.5' }) },
    rejected: { bg: HAlpha.bord10, text: HColors.bordeaux, border: HAlpha.bord30, label: 'Refusée', icon: React.createElement(XCircle, { className: 'w-3.5 h-3.5' }) },
    completed: { bg: HAlpha.navy18, text: HColors.navy, border: HAlpha.navy30, label: 'Effectuée', icon: React.createElement(CheckCircle, { className: 'w-3.5 h-3.5' }) },
    counter_proposed: { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'Date proposée', icon: React.createElement(Calendar, { className: 'w-3.5 h-3.5' }) },
};

export const VISIT_STATUS_FALLBACK = {
    bg: 'rgba(90,64,0,0.08)', text: HColors.brown, border: 'rgba(90,64,0,0.2)',
    label: 'Inconnu', icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }),
};

/* ── Styles de statut de visite (Tenant) ─────────────────────────────────── */
export const VISIT_STATUS_TENANT: Record<string, {
    bg: string; border: string; text: string; label: string; icon: React.ReactNode;
}> = {
    pending: { bg: HAlpha.orange10, border: HAlpha.orange25, text: HColors.orangeCI, label: 'Demande envoyée', icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }) },
    accepted: { bg: HAlpha.vertCI10, border: HAlpha.vertCI25, text: HColors.vertCI, label: 'Confirmée', icon: React.createElement(CheckCircle, { className: 'w-3.5 h-3.5' }) },
    rejected: { bg: HAlpha.bord10, border: HAlpha.bord30, text: HColors.bordeaux, label: 'Refusée', icon: React.createElement(XCircle, { className: 'w-3.5 h-3.5' }) },
    completed: { bg: HAlpha.navy08, border: HAlpha.navy30, text: HColors.navy, label: 'Effectuée', icon: React.createElement(CheckCircle, { className: 'w-3.5 h-3.5' }) },
    counter_proposed: { bg: HAlpha.orange10, border: HAlpha.orange25, text: HColors.orangeCI, label: 'Nouvelle date proposée', icon: React.createElement(Calendar, { className: 'w-3.5 h-3.5' }) },
    counter_waiting: { bg: HAlpha.navy08, border: HAlpha.navy25, text: HColors.navy, label: 'En attente de réponse', icon: React.createElement(Clock, { className: 'w-3.5 h-3.5' }) },
};
