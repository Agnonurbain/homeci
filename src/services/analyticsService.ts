/**
 * HOMECI — Analytics Service
 *
 * Événements trackés :
 * - Authentification (login, signup, logout)
 * - Navigation (page_view, search)
 * - Propriétés (view, favorite, publish, certify)
 * - Visites (request, accept, complete, status_update)
 * - Engagement (survey_submit, report_submit)
 */

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { analyticsPromise } from '../lib/firebase';

let analytics: Analytics | null = null;

// Initialisation lazy — ne bloque pas le rendu
analyticsPromise.then(a => { analytics = a; }).catch(() => {});

/** Log un événement si analytics est disponible */
function track(event: string, params?: Record<string, string | number | boolean>) {
  if (!analytics) return;
  try {
    logEvent(analytics, event, params);
  } catch {
    // Silencieux en cas d'erreur (ad-blocker, mode privé, etc.)
  }
}

export const analyticsService = {
  // ── Identification ──

  /** Associe l'utilisateur Firebase à ses events */
  setUser(userId: string, role: string) {
    if (!analytics) return;
    try {
      setUserId(analytics, userId);
      setUserProperties(analytics, { user_role: role });
    } catch {}
  },

  clearUser() {
    if (!analytics) return;
    try {
      setUserId(analytics, '');
    } catch {}
  },

  // ── Auth ──

  login(method: 'email' | 'google' | 'phone') {
    track('login', { method });
  },

  signup(method: 'email' | 'google' | 'phone', role: string) {
    track('sign_up', { method, role });
  },

  logout() {
    track('logout');
  },

  // ── Navigation ──

  pageView(page: string) {
    track('page_view', { page_title: page });
  },

  search(query: string, resultsCount: number) {
    track('search', {
      search_term: query.slice(0, 100),
      results_count: resultsCount,
    });
  },

  // ── Propriétés ──

  viewProperty(propertyId: string, propertyType: string, city: string) {
    track('view_property', { property_id: propertyId, property_type: propertyType, city });
  },

  favoriteProperty(propertyId: string, action: 'add' | 'remove') {
    track('favorite_property', { property_id: propertyId, action });
  },

  publishProperty(propertyId: string, propertyType: string, transactionType: string) {
    track('publish_property', {
      property_id: propertyId,
      property_type: propertyType,
      transaction_type: transactionType,
    });
  },

  certifyProperty(propertyId: string) {
    track('certify_property', { property_id: propertyId });
  },

  decertifyProperty(propertyId: string, reason: string) {
    track('decertify_property', { property_id: propertyId, reason: reason.slice(0, 100) });
  },

  updatePropertyStatus(propertyId: string, status: string) {
    track('update_property_status', { property_id: propertyId, status });
  },

  // ── Visites ──

  requestVisit(propertyId: string) {
    track('request_visit', { property_id: propertyId });
  },

  acceptVisit(visitId: string) {
    track('accept_visit', { visit_id: visitId });
  },

  completeVisit(visitId: string) {
    track('complete_visit', { visit_id: visitId });
  },

  // ── Engagement ──

  submitSurvey(rating: number, trigger: string) {
    track('submit_survey', { rating, trigger });
  },

  submitReport(propertyId: string, reason: string) {
    track('submit_report', { property_id: propertyId, reason });
  },

  // ── Paiements ──

  initiatePayment(provider: string, amount: number) {
    track('begin_checkout', { payment_method: provider, value: amount, currency: 'XOF' });
  },

  completePayment(provider: string, amount: number) {
    track('purchase', { payment_method: provider, value: amount, currency: 'XOF' });
  },
};
