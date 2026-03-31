import { useState, useEffect, useMemo, useCallback } from 'react';
import { propertyService } from '../services/propertyService';
import { notificationService } from '../services/notificationService';
import { analyticsService } from '../services/analyticsService';
import type { Property } from '../types/property';
import type { VisitRequest } from '../services/visitService';
import { TYPE_LABELS } from '../constants/labels';

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface PropertyStats {
  total: number;
  published: number;
  pending: number;
  rented_sold: number;
  views: number;
  verified: number;
}

export interface ChartItem {
  name: string;
  [key: string]: string | number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  published: 'Publié',
  rented: 'Loué',
  sold: 'Vendu',
  failed: 'Non abouti',
};

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useOwnerProperties(userId: string | undefined) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingVerif, setSubmittingVerif] = useState<string | null>(null);

  /* ── Firestore listener ── */
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const unsub = propertyService.listenToPropertiesByOwner(userId, (props) => {
      setProperties(props);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  /* ── Derived stats ── */
  const stats = useMemo<PropertyStats>(() => ({
    total: properties.length,
    published: properties.filter(p => p.status === 'published').length,
    pending: properties.filter(p => p.status === 'pending').length,
    rented_sold: properties.filter(p => p.status === 'rented' || p.status === 'sold').length,
    views: properties.reduce((s, p) => s + (p.views_count || 0), 0),
    verified: properties.filter(p => p.verified_notaire).length,
  }), [properties]);

  /* ── Chart data ── */
  const viewsChartData = useMemo<ChartItem[]>(() =>
    [...properties]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 6)
      .map(p => ({ name: p.title.length > 18 ? p.title.substring(0, 18) + '…' : p.title, vues: p.views_count || 0 })),
    [properties]);

  const typeChartData = useMemo<ChartItem[]>(() =>
    Object.entries(
      properties.reduce((acc, p) => { acc[p.property_type] = (acc[p.property_type] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value })),
    [properties]);

  const monthlyChartData = useMemo<ChartItem[]>(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })] = 0;
    }
    properties.forEach(p => {
      const key = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([mois, biens]) => ({ mois, biens }));
  }, [properties]);

  /* ── Handlers ── */
  const submitForVerification = useCallback(async (property: Property) => {
    setSubmittingVerif(property.id);
    try {
      await propertyService.updateProperty(property.id, { status: 'pending' });
      await notificationService.createNotification({
        user_id: 'notaires',
        type: 'visit_request',
        title: 'Nouveau bien à vérifier',
        message: `Le bien "${property.title}" à ${property.city} est soumis pour vérification.`,
        property_id: property.id,
      });
    } catch (e) { console.error(e); }
    finally { setSubmittingVerif(null); }
  }, []);

  const updatePropertyStatus = useCallback(async (
    property: Property,
    status: 'rented' | 'sold' | 'published' | 'failed',
    visitRequests: VisitRequest[],
  ) => {
    const updates: Record<string, any> = { status, needs_status_update: false };
    if (status === 'rented' || status === 'sold') {
      updates.status_updated_at = new Date().toISOString();
    }
    await propertyService.updateProperty(property.id, updates);

    // Notify tenants
    const visits = visitRequests.filter(v => v.property_id === property.id && (v.status === 'accepted' || v.status === 'completed'));
    if (status === 'rented' || status === 'sold' || status === 'failed') {
      const statusLabel = status === 'rented' ? 'loué' : status === 'sold' ? 'vendu' : 'non abouti (visite)';
      for (const visit of visits) {
        await notificationService.createNotification({
          user_id: visit.tenant_id,
          type: 'system',
          title: `Bien ${statusLabel}`,
          message: `Le bien "${property.title}" a été ${statusLabel}. Merci pour votre intérêt.`,
          property_id: property.id,
        });
      }
    }

    setProperties(prev => prev.map(p => p.id === property.id ? { ...p, status, needs_status_update: false } : p));
    analyticsService.updatePropertyStatus(property.id, status);
  }, []);

  const exportCSV = useCallback(() => {
    if (properties.length === 0) return;
    const headers = ['ID', 'Titre', 'Type de bien', 'Transaction', 'Prix (FCFA)', 'Surface (m²)', 'Chambres', 'Ville', 'Commune', 'Quartier', 'Statut', 'Vues', 'Date Création'];
    const rows = properties.map(p => {
      const clean = (s: string | null) => (s || '').replace(/[";,]/g, ' ');
      return [
        p.id, `"${clean(p.title)}"`, TYPE_LABELS[p.property_type] || p.property_type,
        p.transaction_type === 'location' ? 'Location' : 'Vente', p.price, p.surface_area || 0, p.bedrooms || 0,
        `"${clean(p.city)}"`, `"${clean(p.commune)}"`, `"${clean(p.quartier)}"`,
        STATUS_LABELS[p.status] || p.status, p.views_count || 0,
        new Date(p.created_at).toLocaleDateString('fr-FR'),
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `homeci_export_biens_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  }, [properties]);

  /** Used by visits hook to flag a property for status update */
  const flagNeedsStatusUpdate = useCallback((propertyId: string) => {
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, needs_status_update: true } : p));
  }, []);

  return {
    properties,
    loading,
    stats,
    submittingVerif,
    viewsChartData,
    typeChartData,
    monthlyChartData,
    submitForVerification,
    updatePropertyStatus,
    exportCSV,
    flagNeedsStatusUpdate,
  };
}
