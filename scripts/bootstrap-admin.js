#!/usr/bin/env node
/**
 * HOMECI — Bootstrap du premier compte admin
 *
 * Usage :
 *   node scripts/bootstrap-admin.js <email> <password> <fullName>
 *
 * Exemple :
 *   node scripts/bootstrap-admin.js admin@homeci.ci MonMotDePasse123! "Aymeric Admin"
 *
 * Prérequis :
 *   - firebase login (déjà connecté)
 *   - GOOGLE_APPLICATION_CREDENTIALS ou gcloud auth application-default login
 */
const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const [,, email, password, fullName] = process.argv;

if (!email || !password || !fullName) {
  console.error('Usage: node scripts/bootstrap-admin.js <email> <password> <fullName>');
  console.error('Exemple: node scripts/bootstrap-admin.js admin@homeci.ci MotDePasse123! "Aymeric Admin"');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Erreur : le mot de passe doit contenir au moins 6 caractères.');
  process.exit(1);
}

(async () => {
  try {
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'homeci-prod-72e4b',
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    // 1. Vérifier qu'aucun admin n'existe déjà
    const existingAdmins = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    if (!existingAdmins.empty) {
      const existing = existingAdmins.docs[0].data();
      console.error(`Un admin existe déjà : ${existing.email || existing.full_name}`);
      console.error('Utilisez la fonction createAdmin depuis le dashboard admin pour créer d\'autres admins.');
      process.exit(1);
    }

    // 2. Créer l'utilisateur Firebase Auth
    console.log(`Création du compte admin : ${email}...`);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // 3. Créer le profil Firestore avec le rôle admin
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      full_name: fullName,
      role: 'admin',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      created_by: 'bootstrap-script',
    });

    // 4. Log d'audit
    await db.collection('admin_logs').add({
      action: 'create_admin',
      target_uid: userRecord.uid,
      target_email: email,
      performed_by: userRecord.uid,
      created_at: FieldValue.serverTimestamp(),
      details: 'Premier admin créé via bootstrap script',
    });

    console.log('Admin créé avec succès !');
    console.log(`  UID:   ${userRecord.uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Nom:   ${fullName}`);
    console.log('\nConnectez-vous sur homeci.vercel.app avec ces identifiants.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    if (err.code === 'auth/email-already-exists') {
      console.error('Cet email est déjà utilisé dans Firebase Auth.');
    }
    process.exit(1);
  }
})();
