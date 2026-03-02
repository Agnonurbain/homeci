# Portail Administrateur Sécurisé HOMECI

## Accès au Portail

Le portail administrateur est accessible via une URL dédiée et sécurisée :

- **URL principale** : `/portail-securise`
- **URL alternative** : `/admin`

## Caractéristiques de Sécurité

### 1. Connexion Sécurisée

Le système d'authentification administrateur intègre plusieurs couches de sécurité :

#### Protection contre les attaques par force brute
- **Limitation des tentatives** : Maximum 5 tentatives de connexion échouées
- **Verrouillage automatique** : Le compte est verrouillé pendant 15 minutes après 5 échecs
- **Compteur de tentatives** : L'utilisateur est informé du nombre de tentatives restantes

#### Chiffrement et sécurité des données
- **HTTPS/SSL** : Toutes les communications sont chiffrées
- **Hachage des mots de passe** : Les mots de passe ne sont jamais stockés en clair
- **Session sécurisée** : Utilisation de tokens JWT pour l'authentification

### 2. Gestion de Session

#### Expiration automatique
- **Timeout admin** : 30 minutes d'inactivité (configurable)
- **Timeout autres utilisateurs** : 120 minutes d'inactivité
- **Avertissement** : L'utilisateur est prévenu 60 secondes avant l'expiration
- **Prolongation** : Possibilité d'étendre la session avant expiration

#### Détection d'inactivité
Le système surveille les activités suivantes pour réinitialiser le timer :
- Mouvements de souris
- Frappes au clavier
- Défilement de page
- Événements tactiles
- Clics

### 3. Audit et Traçabilité

#### Historique des connexions
Toutes les tentatives de connexion sont enregistrées avec :
- **Email** de l'utilisateur
- **Date et heure** exacte
- **Statut** (réussie ou échouée)
- **Adresse IP** (si disponible)
- **Navigateur** utilisé (User Agent)

#### Consultation des logs
- Accessible depuis l'onglet "Sécurité" du dashboard admin
- Filtrage par statut (toutes/réussies/échouées)
- Historique des 50 dernières tentatives

### 4. Accès Restreint

- Seuls les utilisateurs avec le rôle `admin` peuvent accéder au portail
- Vérification du rôle après authentification
- Déconnexion automatique si l'utilisateur n'est pas admin

## Utilisation du Portail

### Première Connexion

1. Accédez à l'URL : `https://votresite.com/portail-securise`
2. Saisissez votre email administrateur
3. Entrez votre mot de passe sécurisé
4. Cliquez sur "Connexion Sécurisée"

### En cas d'échec de connexion

- **Moins de 5 tentatives** : Réessayez avec les bons identifiants
- **Après 5 tentatives** : Le compte est verrouillé pendant 15 minutes
- **Compte verrouillé** : Attendez l'expiration du délai (un compteur est affiché)

### Fonctionnalités du Dashboard Admin

Une fois connecté, vous avez accès aux sections suivantes :

#### 1. Vue d'ensemble
- Statistiques générales de la plateforme
- Nombre total d'utilisateurs
- Nombre de biens immobiliers
- Biens en attente de modération
- Biens vérifiés

#### 2. Utilisateurs
- Liste complète des utilisateurs inscrits
- Informations détaillées (nom, email, rôle, statut)
- Date d'inscription
- Gestion des utilisateurs

#### 3. Biens immobiliers
- Vue d'ensemble des propriétés
- Gestion avancée (en développement)

#### 4. Modération
- Liste des biens en attente d'approbation
- Actions : Approuver ou Rejeter
- Détails complets de chaque bien

#### 5. Sécurité
- Historique des tentatives de connexion
- Surveillance des accès
- Détection d'activités suspectes

## Configuration de Sécurité

### Base de données

Les fonctionnalités de sécurité suivantes sont automatiquement configurées :

- Table `login_attempts` pour l'audit
- Colonnes de sécurité dans `profiles` :
  - `failed_login_attempts` : Compteur d'échecs
  - `locked_until` : Date de fin de verrouillage
  - `last_login` : Dernière connexion réussie
  - `require_2fa` : Activation de la double authentification (prêt pour implémentation future)
  - `session_timeout_minutes` : Durée de timeout personnalisée

### Fonctions PostgreSQL

Trois fonctions sont disponibles pour la gestion de la sécurité :

1. **is_account_locked(email)** : Vérifie si un compte est verrouillé
2. **record_failed_login(email, ip, user_agent)** : Enregistre un échec de connexion
3. **record_successful_login(email, ip, user_agent)** : Enregistre une connexion réussie

## Bonnes Pratiques

### Pour les Administrateurs

1. **Mot de passe fort** :
   - Minimum 12 caractères
   - Majuscules et minuscules
   - Chiffres et caractères spéciaux
   - Ne pas réutiliser d'anciens mots de passe

2. **Sécurité physique** :
   - Ne pas laisser la session ouverte sans surveillance
   - Toujours se déconnecter après utilisation
   - Utiliser un ordinateur sécurisé

3. **Surveillance** :
   - Consulter régulièrement l'historique des connexions
   - Signaler toute activité suspecte
   - Vérifier les tentatives de connexion échouées

### Pour le Déploiement

1. **HTTPS obligatoire** : Assurez-vous que le site utilise SSL/TLS
2. **Sauvegardes régulières** : Programmez des backups automatiques de la base de données
3. **Monitoring** : Mettez en place des alertes pour les tentatives d'intrusion
4. **URL personnalisée** : Envisagez de changer l'URL du portail admin pour plus de sécurité

## Extension Future

Le système est prêt pour accueillir :

- **Authentification à deux facteurs (2FA)** : Champ `require_2fa` déjà en place
- **Restriction par IP** : Infrastructure disponible pour limiter les accès
- **Notifications d'accès** : Alertes par email lors de connexions suspectes
- **Gestion des sessions actives** : Vue de toutes les sessions en cours

## Support

En cas de problème d'accès ou de sécurité, contactez l'équipe technique avec :
- Votre email administrateur
- Heure approximative de la tentative
- Description du problème rencontré

---

**Note de sécurité** : Ne partagez jamais vos identifiants administrateur. Tous les accès sont enregistrés et tracés.
