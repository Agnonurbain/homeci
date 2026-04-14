/**
 * HOMECI — Shared Firebase Admin imports
 * Centralized to avoid duplicate initialization across modules.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";

initializeApp();

export { getFirestore, FieldValue, getMessaging, getAuth, getStorage, logger };
