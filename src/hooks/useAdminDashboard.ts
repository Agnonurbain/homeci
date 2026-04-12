import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { propertyService } from '../services/propertyService';
import { emailService } from '../services/emailService';
import { delegateService } from '../services/delegateService';
import type { Property } from '../types/property';
import type { Profile } from '../contexts/AuthContext';

export interface AdminStats {
  total_users: number;
  total_properties: number;
  pending_properties: number;
  verified_properties: number;
}

export type AdminTab = 'overview' | 'users' | 'properties' | 'verification' | 'notaires' | 'reports' | 'surveys' | 'visits' | 'user-search' | 'security' | 'admin-management' | 'cgv' | 'ads' | 'audit';

export function useAdminDashboard(adminProfile: Profile | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<(Profile & { suspended?: boolean })[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total_users: 0, total_properties: 0, pending_properties: 0, verified_properties: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters & Sorts
  const [filterRole, setFilterRole] = useState('');
  const [filterDate, setFilterDate] = useState<'asc' | 'desc'>('desc');
  const [filterPropType, setFilterPropType] = useState('');
  const [filterPropStatus, setFilterPropStatus] = useState('');
  const [filterPropCity, setFilterPropCity] = useState('');
  const [sortProp, setSortProp] = useState<'date_desc' | 'date_asc' | 'price_asc' | 'price_desc'>('date_desc');
  const [filterModType, setFilterModType] = useState('');
  const [sortMod, setSortMod] = useState<'date_desc' | 'date_asc' | 'price_asc' | 'price_desc'>('date_desc');

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!adminProfile) return;
    setLoading(true);

    const toISO = (v: unknown) => {
      if (!v) return new Date().toISOString();
      if (v instanceof Timestamp) return v.toDate().toISOString();
      return String(v);
    };

    // 1. Recent Users Listener (Last 50)
    const usersQuery = query(collection(db, 'users'), orderBy('created_at', 'desc'), limit(50));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const profiles = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          email: String(data.email ?? ''),
          full_name: String(data.full_name ?? ''),
          phone: (data.phone as string | null) ?? null,
          role: (data.role as Profile['role']) ?? 'locataire',
          avatar_url: (data.avatar_url as string | null) ?? null,
          company_name: (data.company_name as string | null) ?? null,
          verified: Boolean(data.verified ?? false),
          suspended: Boolean(data.suspended ?? false),
          created_at: toISO(data.created_at),
          updated_at: toISO(data.updated_at),
        } as Profile & { suspended: boolean };
      });
      setUsers(profiles);
      setLoading(false);
    }, (err) => {
      console.error('[HOMECI] Admin Users listener error:', err);
      setLoading(false);
    });

    // Total Users Counter (Aggregated manually for now)
    getDocs(collection(db, 'users'))
      .then(snap => setStats(prev => ({ ...prev, total_users: snap.size })))
      .catch(err => console.error('[HOMECI] Admin Users count error:', err));

    // 2. All Properties Listener
    const propsQuery = query(collection(db, 'properties'), orderBy('created_at', 'desc'));
    const unsubProps = onSnapshot(propsQuery, (snapshot) => {
      const allProperties = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          owner_id: String(data.owner_id ?? ''),
          title: String(data.title ?? ''),
          property_type: data.property_type ?? 'appartement',
          transaction_type: data.transaction_type ?? 'location',
          price: Number(data.price ?? 0),
          city: String(data.city ?? ''),
          status: data.status ?? 'pending',
          verified_notaire: Boolean(data.verified_notaire ?? false),
          created_at: toISO(data.created_at),
          images: Array.isArray(data.images) ? data.images : [],
          surface_area: data.surface_area,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          quartier: data.quartier,
          address: data.address,
          amenities: data.amenities,
          updated_at: toISO(data.updated_at),
        } as Property;
      });
      
      setProperties(allProperties);
      setStats(prev => ({
        ...prev,
        total_properties: allProperties.length,
        pending_properties: allProperties.filter(p => p.status === 'pending').length,
        verified_properties: allProperties.filter(p => p.verified_notaire).length,
      }));
    }, (err) => {
      console.error('[HOMECI] Admin Properties listener error:', err);
    });

    return () => {
      unsubUsers();
      unsubProps();
    };
  }, [adminProfile]);

  const rejectProperty = async (propertyId: string) => {
    console.info(`[ADMIN_ACTION] Rejecting property: ${propertyId} by admin ${adminProfile?.id}`);
    try {
      await propertyService.updateProperty(propertyId, { status: 'rejected' });
      showToast('Bien rejeté');
      
      const prop = properties.find(p => p.id === propertyId);
      if (prop?.owner_id) {
        const ownerSnap = await getDoc(doc(db, 'users', prop.owner_id));
        if (ownerSnap.exists() && ownerSnap.data().email) {
          emailService.sendEmail({
            to: ownerSnap.data().email,
            subject: `Information concernant votre bien "${prop.title}"`,
            html: `<p>Bonjour,</p><p>Votre bien <strong>${prop.title}</strong> a été rejeté par l'administration de HomeCI.</p><p>Veuillez vérifier vos documents et soumettre à nouveau si nécessaire.</p>`
          }).catch(err => console.error('[HOMECI] Email notification error:', err));
        }
      }
    } catch (err) {
      console.error('[HOMECI] Reject property error:', err);
      showToast('Erreur lors du rejet', false);
    }
  };

  const handleConsumeToken = async (tokenInput: string) => {
    if (!tokenInput.trim() || !adminProfile) return;
    console.info(`[ADMIN_ACTION] Consuming token: ${tokenInput} by admin ${adminProfile.id}`);
    try {
      const result = await delegateService.consumeToken(tokenInput.trim(), adminProfile.id);
      showToast(result.message);
      return true;
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la consommation du jeton', false);
      return false;
    }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (filterRole) list = list.filter(u => u.role === filterRole);
    list.sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return filterDate === 'desc' ? -d : d;
    });
    return list;
  }, [users, filterRole, filterDate]);

  const filteredProperties = useMemo(() => {
    let list = [...properties];
    if (filterPropType) list = list.filter(p => p.property_type === filterPropType);
    if (filterPropStatus) list = list.filter(p => p.status === filterPropStatus);
    if (filterPropCity) list = list.filter(p => p.city?.toLowerCase().includes(filterPropCity.toLowerCase()));
    
    list.sort((a, b) => {
      if (sortProp === 'price_asc') return a.price - b.price;
      if (sortProp === 'price_desc') return b.price - a.price;
      if (sortProp === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [properties, filterPropType, filterPropStatus, filterPropCity, sortProp]);

  const pendingProperties = useMemo(() => properties.filter(p => p.status === 'pending'), [properties]);

  const filteredPendingProperties = useMemo(() => {
    let list = [...pendingProperties];
    if (filterModType) list = list.filter(p => p.property_type === filterModType);
    
    list.sort((a, b) => {
      if (sortMod === 'price_asc') return a.price - b.price;
      if (sortMod === 'price_desc') return b.price - a.price;
      if (sortMod === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [pendingProperties, filterModType, sortMod]);

  return {
    users,
    properties,
    stats,
    loading,
    toast,
    showToast,
    // Filter controls
    filterRole, setFilterRole,
    filterDate, setFilterDate,
    filterPropType, setFilterPropType,
    filterPropStatus, setFilterPropStatus,
    filterPropCity, setFilterPropCity,
    sortProp, setSortProp,
    filterModType, setFilterModType,
    sortMod, setSortMod,
    // Memoized lists
    filteredUsers,
    filteredProperties,
    pendingProperties,
    filteredPendingProperties,
    // Actions
    rejectProperty,
    handleConsumeToken,
  };
}
