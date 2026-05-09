import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { propertyService } from './propertyService';

export interface DelegationToken {
  id?: string;
  token: string;
  notary_id: string;
  property_id: string;
  property_title: string;
  action: 'certify' | 'reject';
  rejection_reason?: string;
  status: 'pending' | 'used' | 'expired';
  created_at: any;
  used_at?: any;
}

export const delegateService = {
  /** Génère un jeton à usage unique */
  async createToken(data: {
    notary_id: string;
    property_id: string;
    property_title: string;
    action: 'certify' | 'reject';
    rejection_reason?: string;
  }): Promise<string> {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const tokenStr = 'HC-' + hex;
    
    await addDoc(collection(db, 'delegation_tokens'), {
      token: tokenStr,
      ...data,
      status: 'pending',
      created_at: serverTimestamp(),
    });

    return tokenStr;
  },

  /** Récupère un jeton par son code */
  async getTokenByCode(tokenStr: string): Promise<DelegationToken | null> {
    const q = query(
      collection(db, 'delegation_tokens'),
      where('token', '==', tokenStr.trim().toUpperCase()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as DelegationToken;
  },

  /** Consomme un jeton et exécute l'action associée */
  async consumeToken(tokenStr: string, adminId: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getTokenByCode(tokenStr);
    
    if (!token || !token.id) {
      throw new Error('Jeton invalide, expiré ou déjà utilisé');
    }

    const tokenRef = doc(db, 'delegation_tokens', token.id);

    // 1. Exécuter l'action sur le bien
    if (token.action === 'certify') {
      await propertyService.updateProperty(token.property_id, {
        status: 'published',
        verified_notaire: true,
        verification_date: new Date().toISOString(),
      });
    } else {
      await propertyService.updateProperty(token.property_id, {
        status: 'rejected',
        rejection_reason: token.rejection_reason || 'Rejeté via délégation Notaire',
      });
    }

    // 2. Marquer le jeton comme utilisé
    await updateDoc(tokenRef, {
      status: 'used',
      used_at: serverTimestamp(),
      used_by: adminId,
    });

    return { 
      success: true, 
      message: `Action "${token.action === 'certify' ? 'Certification' : 'Rejet'}" effectuée sur le bien "${token.property_title}".` 
    };
  }
};
