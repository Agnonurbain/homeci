# Correctif Upload Vidéos > 50MB

## Problème Résolu

**Erreur rencontrée :** "The object exceeded the maximum allowed size" (Code 413 - Payload too large)

**Cause :** Supabase impose une limite de **50MB** pour les uploads standards via l'API HTTP. Au-delà, le protocole **TUS (Resumable Upload)** est obligatoire.

## Solution Implémentée

### 1. Installation de TUS Client

```bash
npm install tus-js-client
```

### 2. Réécriture du Système d'Upload

Le fichier `src/utils/chunkedUpload.ts` utilise maintenant le protocole TUS pour tous les fichiers volumineux :

- **Morceaux de 6MB** (taille optimale recommandée par Supabase)
- **Reprise automatique** en cas d'interruption
- **Progression en temps réel** avec détails précis
- **Retry automatique** avec délais exponentiels

### 3. Détection Automatique

Le système choisit automatiquement la méthode d'upload :

```typescript
const largeFile = file.size > 50 * 1024 * 1024; // 50MB

if (isVideo && largeFile) {
  // Utilise TUS Resumable Upload
  await uploadLargeFile(file, folder, fileName, { onProgress });
} else {
  // Utilise Standard Upload
  await supabase.storage.from('property-media').upload(fileName, file);
}
```

## Capacités Actuelles

| Taille du Fichier | Méthode Utilisée | Statut |
|-------------------|------------------|--------|
| < 50MB | Standard Upload | ✅ Fonctionne |
| 50MB - 200MB | TUS Resumable | ✅ Corrigé |
| 200MB - 5GB | TUS Resumable | ✅ Supporté |
| 5GB - 10GB | TUS Resumable | ✅ Supporté |
| > 10GB | Bloqué | ❌ Limite bucket |

## Test de Validation

Votre vidéo de **200MB** devrait maintenant s'uploader correctement :

1. Le système détecte que le fichier fait > 50MB
2. Active automatiquement le protocole TUS
3. Upload par morceaux de 6MB
4. Affiche la progression en temps réel
5. Peut reprendre en cas d'interruption

## Avantages du Protocole TUS

✅ **Fiabilité** : Reprise après interruption réseau
✅ **Performance** : Morceaux optimaux de 6MB
✅ **Progression** : Suivi précis en temps réel
✅ **Scalabilité** : Supporte jusqu'à 10GB
✅ **Retry** : Tentatives automatiques en cas d'échec

## Notes Techniques

- **Authentification requise** : TUS nécessite un token d'authentification valide
- **Fingerprint** : TUS utilise le fingerprint pour identifier les uploads en cours
- **Cache navigateur** : Les uploads interrompus peuvent être repris même après fermeture du navigateur
- **Headers personnalisés** : `x-upsert: false` pour éviter d'écraser les fichiers existants

## Documentation Complète

Voir `VIDEO_OPTIMIZATION.md` pour la documentation technique complète.
