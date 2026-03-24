/**
 * Service Movapay (Mock)
 * 
 * En attendant les clés API de production, ce service simule les appels
 * réseau vers l'API Movapay tout en conservant la structure exacte attendue.
 * Lors du passage en production, seul le contenu des méthodes changera.
 */

export interface MovapayInitiateRequest {
  amount: number;
  currency: string;
  provider: string; // 'orange', 'mtn', 'wave', 'flooz', 'djamo'
  phone: string;
  reference: string; // La réf interne fournie par PaymentService
  description: string;
  callbackUrl?: string; // Webhook pour réception de succès
}

export interface MovapayInitiateResponse {
  success: boolean;
  movapayReference?: string;
  checkoutUrl?: string;
  message?: string;
}

export interface MovapayVerifyResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed';
  movapayReference: string;
  amount: number;
}

class MovapayService {
  /**
   * Simule la demande d'initiation d'un paiement au serveur Movapay
   */
  async initiateTransaction(payload: MovapayInitiateRequest): Promise<MovapayInitiateResponse> {
    console.log('[Mock Movapay] Initiating transaction...', payload);
    
    // Simuler un temps de latence réseau de l'API (1 seconde)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulation d'une erreur si le numéro est très court
    if (payload.phone.length < 8) {
      return { 
        success: false, 
        message: 'Invalid phone number format provided to gateway.' 
      };
    }

    // Succès simulé
    return {
      success: true,
      movapayReference: `MVA-SIM-${Date.now().toString(36).toUpperCase()}`,
      message: 'Transaction successfully initiated. Awaiting user OTP.'
    };
  }

  /**
   * Simule la vérification du statut du paiement (polling)
   */
  async verifyTransaction(movapayRef: string): Promise<MovapayVerifyResponse> {
    console.log('[Mock Movapay] Verifying transaction...', movapayRef);
    
    // Latence réseau (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Dans un cas réel, cette méthode appellerait l'endpoint GET /v1/transaction/{ref} de Movapay.
    // Ici on retourne toujours un succès pour débloquer le tunnel MVP.
    return {
      success: true,
      status: 'success',
      movapayReference: movapayRef,
      amount: 0 // Le montant réel retournerait d'ici
    };
  }
}

export const movapayService = new MovapayService();
