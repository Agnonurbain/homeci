/**
 * HOMECI — Two-Factor Authentication (TOTP) Service
 *
 * Uses otplib for TOTP generation/verification.
 * Secret is stored in Firestore under users/{uid}.two_factor_secret.
 * 2FA status is stored under users/{uid}.two_factor_enabled.
 */

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authenticator } from 'otplib';

// TOTP configuration
authenticator.options = {
  window: 1, // Allow 1 step before/after for clock drift
  step: 30,  // 30-second steps (standard)
  digits: 6, // 6-digit codes
  algorithm: 'sha1',
};

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export const twoFactorService = {
  /**
   * Génère un nouveau secret TOTP et l'URL otpauth pour le QR code
   */
  async generateSecret(userId: string, email: string): Promise<TwoFactorSetup> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'HOMECI', secret);

    // Store the secret (not yet enabled)
    await setDoc(doc(db, 'users', userId, 'two_factor', 'config'), {
      secret,
      created_at: new Date().toISOString(),
      enabled: false,
    }, { merge: true });

    return { secret, otpauthUrl };
  },

  /**
   * Vérifie un code TOTP pour activer le 2FA
   */
  async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    const configRef = doc(db, 'users', userId, 'two_factor', 'config');
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      throw new Error('Configuration 2FA introuvable. Générez d\'abord un secret.');
    }

    const config = configSnap.data();
    const isValid = authenticator.check(token, config.secret);

    if (isValid) {
      // Enable 2FA
      await updateDoc(configRef, {
        enabled: true,
        enabled_at: new Date().toISOString(),
      });

      // Also update the user document
      await updateDoc(doc(db, 'users', userId), {
        two_factor_enabled: true,
      });

      return true;
    }

    return false;
  },

  /**
   * Vérifie un code TOTP lors de la connexion
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const configRef = doc(db, 'users', userId, 'two_factor', 'config');
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      throw new Error('Configuration 2FA introuvable.');
    }

    const config = configSnap.data();
    if (!config.enabled) {
      throw new Error('Le 2FA n\'est pas activé pour ce compte.');
    }

    return authenticator.check(token, config.secret);
  },

  /**
   * Désactive le 2FA pour un utilisateur
   */
  async disable(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'two_factor', 'config'), {
      enabled: false,
      disabled_at: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'users', userId), {
      two_factor_enabled: false,
    });
  },

  /**
   * Vérifie si le 2FA est activé pour un utilisateur
   */
  async isEnabled(userId: string): Promise<boolean> {
    const configRef = doc(db, 'users', userId, 'two_factor', 'config');
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) return false;
    return configSnap.data().enabled || false;
  },
};
