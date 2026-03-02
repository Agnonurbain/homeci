# Configuration de l'Administrateur Principal

## Création de l'Administrateur Principal

Pour créer l'administrateur principal avec les identifiants spécifiés :

### Étape 1 : Créer le compte via Supabase Auth

Vous devez créer le compte admin principal avec ces identifiants :
- **Email** : `ned12@gmail.com`
- **Mot de passe** : `dad333`

#### Option A : Via l'interface Supabase Dashboard
1. Allez dans votre projet Supabase
2. Naviguez vers `Authentication` > `Users`
3. Cliquez sur `Add user` > `Create new user`
4. Entrez l'email : `ned12@gmail.com`
5. Entrez le mot de passe : `dad333`
6. Cliquez sur `Create user`

#### Option B : Via SQL
Exécutez cette requête SQL dans l'éditeur SQL de Supabase :

```sql
-- Note: Remplacez 'dad333' par le hash bcrypt si nécessaire
-- Cette méthode nécessite que vous utilisiez l'API Supabase Auth
```

### Étape 2 : Mettre à jour le profil

Après la création du compte, exécutez cette requête SQL pour définir le rôle admin :

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Administrateur Principal'
WHERE email = 'ned12@gmail.com';
```

## Accès au Portail Administrateur

### Code d'accès
Le code de validation pour accéder au portail administrateur est : **9573517c**

### URLs d'accès
- `/portail-securise`
- `/admin`

## Fonctionnalités Administrateur

### 1. Code d'Accès de Sécurité
- Première couche de sécurité avant la page de connexion
- Code requis : `9573517c` (7 chiffres + 1 lettre)

### 2. Connexion Sécurisée
- Email et mot de passe requis
- Affichage/masquage du mot de passe
- Protection contre les attaques par force brute
- Verrouillage après 5 tentatives échouées (15 minutes)
- Bouton retour à l'accueil

### 3. Gestion des Administrateurs (Onglet "Gestion Admins")

#### Pour l'Administrateur Principal
L'administrateur principal (`ned12@gmail.com`) dispose de privilèges étendus :

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

- Le code d'accès (`9573517c`) est en dur dans le code. Pour une sécurité accrue en production, envisagez de le stocker dans les variables d'environnement.
- L'admin principal est identifié par son email (`ned12@gmail.com`). Ne supprimez pas cet utilisateur.
- Toutes les tentatives de connexion sont enregistrées dans la table `admin_login_attempts`.
- Les sessions administrateur expirent automatiquement après 30 minutes d'inactivité (configurable).
