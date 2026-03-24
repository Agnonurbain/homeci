import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';
export type PaymentContext = 'property_publish' | 'notaire_verification' | 'rent' | 'caution';

export interface PaymentTransaction {
  id?: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string; // 'orange', 'mtn', 'wave', etc.
  phone: string;
  status: PaymentStatus;
  context: PaymentContext;
  propertyId?: string; // S'il s'agit d'un paiement lié à un bien
  reference: string;   // Réf interne (ex: HMCI-...)
  movapayReference?: string; // Réf externe fournie par Movapay
  createdAt: string;
  updatedAt: string;
}

const COLLECTION_NAME = 'transactions';

class PaymentService {
  /**
   * Crée une nouvelle trace de transaction avec le statut 'pending'
   */
  async createTransaction(data: Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transactionRef = doc(collection(db, COLLECTION_NAME));
    const newTransaction: PaymentTransaction = {
      ...data,
      id: transactionRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(transactionRef, newTransaction);
    return transactionRef.id;
  }

  /**
   * Met à jour le statut d'une transaction existante
   */
  async updateTransactionStatus(transactionId: string, status: PaymentStatus, movapayRef?: string): Promise<void> {
    const transactionRef = doc(db, COLLECTION_NAME, transactionId);
    const updates: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (movapayRef) {
      updates.movapayReference = movapayRef;
    }
    await updateDoc(transactionRef, updates);
  }

  /**
   * Récupère une transaction par son ID
   */
  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    const transactionRef = doc(db, COLLECTION_NAME, transactionId);
    const snap = await getDoc(transactionRef);
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as PaymentTransaction;
  }

  /**
   * Liste les transactions d'un utilisateur spécifique
   */
  async getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentTransaction));
  }
}

export const paymentService = new PaymentService();
