# Configuration de l'Administrateur Principal

## Création de l'Administrateur Principal

### Étape 1 : Créer le compte via Firebase Auth

1. Allez dans la console Firebase > Authentication > Users
2. Créez un utilisateur avec l'email et mot de passe souhaités
3. **Ne jamais documenter les credentials dans le code source ou la documentation**

### Étape 2 : Mettre à jour le profil

Après la création du compte, définissez le rôle admin dans Firestore :
- Collection `users`, document = UID de l'utilisateur
- Champ `role` = `"admin"`
- Champ `full_name` = `"Administrateur Principal"`

## Accès au Portail Administrateur

### Code d'accès
Le code de session est généré dynamiquement à chaque connexion (valide 5 minutes).

### URLs d'accès
- `/portail-securise`
- `/admin`

## Fonctionnalités Administrateur

### 1. Code d'Accès de Sécurité
- Première couche de sécurité avant la page de connexion
- Code généré dynamiquement par session (8 caractères alphanumériques, valide 5 minutes)

### 2. Connexion Sécurisée
- Email et mot de passe requis
- Affichage/masquage du mot de passe
- Protection contre les attaques par force brute
- Verrouillage après 5 tentatives échouées (15 minutes)
- Bouton retour à l'accueil

### 3. Gestion des Administrateurs (Onglet "Gestion Admins")

#### Pour l'Administrateur Principal
L'administrateur principal (défini dans Firebase) dispose de privilèges étendus :

**Modifier ses propres identifiants :**
- Changer son email
- Changer son mot de passe
- Les modifications sont appliquées immédiatement (pas besoin d'approbation)

**Créer de nouveaux administrateurs :**
- Remplir le formulaire avec nom, email et mot de passe
- Le nouvel administrateur est créé instantanément
- Le nouvel admin peut se connecter immédiatement

**Gérer les demandes de modification :**
- Voir toutes les demandes de changement d'identifiants des autres admins
- Approuver ou rejeter les demandes
- Les demandes incluent : changement d'email, changement de mot de passe, ou les deux

#### Pour les Autres Administrateurs
Les administrateurs non-principaux peuvent :

**Demander des modifications d'identifiants :**
- Changer leur email
- Changer leur mot de passe
- Changer les deux simultanément
- Toutes les demandes nécessitent l'approbation de l'administrateur principal

## Sécurité

### Protections mises en place
1. **Code d'accès** : Première barrière avant même la page de connexion
2. **Authentification** : Email et mot de passe requis
3. **Anti-force brute** : Verrouillage automatique après 5 tentatives
4. **Logs d'accès** : Toutes les tentatives de connexion sont enregistrées
5. **Session timeout** : Expiration automatique de session après inactivité
6. **RLS (Row Level Security)** : Politiques strictes sur toutes les tables
7. **Approbation des modifications** : L'admin principal doit approuver les changements d'autres admins

### Tables de Base de Données

#### `admin_credential_requests`
Stocke les demandes de modification d'identifiants des administrateurs :
- `id` : Identifiant unique
- `admin_id` : ID de l'administrateur demandeur
- `new_email` : Nouvel email (si applicable)
- `request_type` : Type de modification (email_change, password_change, both)
- `status` : Statut (pending, approved, rejected)
- `requested_at` : Date de la demande
- `reviewed_at` : Date de révision
- `reviewed_by` : ID de l'admin qui a révisé
- `notes` : Notes de révision

## Processus de Modification d'Identifiants

### Pour l'Admin Principal
1. Aller dans l'onglet "Gestion Admins"
2. Remplir le formulaire de modification
3. Cliquer sur "Mettre à jour"
4. Les modifications sont appliquées immédiatement

### Pour les Autres Admins
1. Aller dans l'onglet "Gestion Admins"
2. Remplir le formulaire de modification
3. Cliquer sur "Soumettre la demande"
4. Attendre l'approbation de l'admin principal
5. Une fois approuvée, la modification est appliquée

## Notes Importantes

- Le code d'accès est généré dynamiquement par session (pas de code en dur).
- L'admin principal est identifié par son email dans Firebase Auth. Ne supprimez pas cet utilisateur.
- Toutes les tentatives de connexion sont enregistrées dans la table `admin_login_attempts`.
- Les sessions administrateur expirent automatiquement après 30 minutes d'inactivité (configurable).
