/**
 * HOMECI — Two-Factor Authentication (TOTP) Service
 *
 * Uses otplib v13 for TOTP generation/verification.
 * Secret is stored in Firestore under users/{uid}/two_factor/config.
 * 2FA status is stored under users/{uid}.two_factor_enabled.
 */

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateSecret, generateURI, verifySync } from 'otplib';

// TOTP configuration: 30-second steps, 6-digit codes, 1 step window tolerance
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_EPOCH_TOLERANCE = 1; // Check 1 time step before/after for clock drift

function checkToken(token: string, secret: string): boolean {
  const result = verifySync({
    token,
    secret,
    period: TOTP_PERIOD,
    digits: TOTP_DIGITS,
    epochTolerance: TOTP_EPOCH_TOLERANCE,
  });
  return result.valid === true;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export const twoFactorService = {
  /**
   * Génère un nouveau secret TOTP et l'URL otpauth pour le QR code
   */
  async generateSecret(userId: string, email: string): Promise<TwoFactorSetup> {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: email, issuer: 'HOMECI' });

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

    const config = configSnap.data() as Record<string, unknown>;
    const isValid = checkToken(token, config.secret as string);

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

    const config = configSnap.data() as Record<string, unknown>;
    if (!config.enabled) {
      throw new Error('Le 2FA n\'est pas activé pour ce compte.');
    }

    return checkToken(token, config.secret as string);
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
    return (configSnap.data() as Record<string, unknown>).enabled as boolean || false;
  },
};
