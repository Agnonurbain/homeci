import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Envoie un email en créant un document dans la collection "mail".
 * Nécessite l'installation de l'extension Firebase "Trigger Email" depuis la console.
 */
export const emailService = {
  async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
    try {
      // Si on est en dev, on simule l'envoi pour éviter le spam ou on peut logs l'email.
      /*
      if (import.meta.env.DEV) {
        console.log('[Dev] Email simulé vers:', to);
        console.log('[Dev] Sujet:', subject);
        return;
      }
      */

      await addDoc(collection(db, 'mail'), {
        to: Array.isArray(to) ? to : [to],
        message: {
          subject,
          html,
        },
        createdAt: serverTimestamp(),
      });
      console.log('Email ajouté dans la file d\'attente (Firebase Extension).');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'email à Firestore:', error);
      throw error;
    }
  },

  // 📝 Fonctions prêtes à l'emploi (Templates) pour HomeCI

  async notifyVisitUpdate(tenantEmail: string, propertyTitle: string, status: 'approved' | 'rejected' | 'completed') {
    const statusText = status === 'approved' ? 'approuvée' : status === 'rejected' ? 'rejetée' : 'terminée';
    const color = status === 'approved' ? '#009E49' : status === 'rejected' ? '#D32F2F' : '#333333';
    
    await this.sendEmail({
      to: tenantEmail,
      subject: `Votre visite pour le bien "${propertyTitle}" est ${statusText}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: ${color};">Mise à jour de votre visite</h2>
          <p>Bonjour,</p>
          <p>Le statut de votre demande de visite pour le bien <strong>${propertyTitle}</strong> a changé.</p>
          <p>Nouveau statut : <strong style="color: ${color};">${statusText.toUpperCase()}</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.9em; color: #777;">L'équipe HomeCI</p>
        </div>
      `,
    });
  },

  async notifyPropertyApproval(ownerEmail: string, propertyTitle: string) {
    await this.sendEmail({
      to: ownerEmail,
      subject: `Félicitations ! Votre bien "${propertyTitle}" a été vérifié et approuvé`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #D4A017;">Bien validé ✅</h2>
          <p>Bonjour,</p>
          <p>Bonne nouvelle ! Votre bien <strong>${propertyTitle}</strong> a passé toutes les vérifications (Admin/Notaire) et est désormais publié sur HomeCI.</p>
          <p>Il est maintenant visible par tous les locataires potentiels.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.9em; color: #777;">L'équipe Notariale HomeCI</p>
        </div>
      `,
    });
  }
};
