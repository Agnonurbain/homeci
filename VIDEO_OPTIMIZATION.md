# Optimisation des Vidéos - Documentation Technique

## Vue d'ensemble

Le système HomeCi prend désormais en charge l'upload et le streaming de vidéos longues (jusqu'à 30 minutes) avec des optimisations avancées pour assurer des performances maximales.

## Fonctionnalités Implémentées

### 1. Upload par Chunks avec Protocole TUS

**Fichier:** `src/utils/chunkedUpload.ts`

- Utilise le protocole TUS (Resumable Upload) de Supabase
- Upload des fichiers volumineux en morceaux de 6MB (optimal)
- Reprise automatique en cas d'interruption réseau
- Progression en temps réel avec détails précis
- Supporte les vidéos jusqu'à 10GB
- **Activation automatique pour les fichiers > 50MB**

**Pourquoi TUS ?**
- Supabase limite les uploads standard à **50MB** maximum
- Au-delà, le protocole TUS est **obligatoire**
- TUS permet la reprise après interruption
- Meilleure fiabilité pour les gros fichiers

**Utilisation:**
```typescript
import { uploadLargeFile } from './utils/chunkedUpload';

const url = await uploadLargeFile(file, 'properties/123', file.name, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}% - ${progress.currentChunk}/${progress.totalChunks}`);
  }
});
```

### 2. Traitement Vidéo Côté Client

**Fichier:** `src/utils/videoProcessing.ts`

#### Génération de Thumbnails
- Extraction automatique d'une image à partir de la vidéo
- Format WebP pour une taille minimale
- Résolution optimisée (320px de largeur)
- Qualité ajustée (70%)

#### Métadonnées Vidéo
- Durée de la vidéo
- Résolution (largeur × hauteur)
- Estimation de la taille après compression
- Détection du bitrate optimal

### 3. Lecteur Vidéo Optimisé

**Fichier:** `src/components/OptimizedVideoPlayer.tsx`

Fonctionnalités:
- Chargement progressif (preload="metadata")
- Contrôles personnalisés
- Mode plein écran
- Gestion du son
- Indicateur de buffering
- Barre de progression interactive

### 4. Prévisualisation d'Upload

**Fichier:** `src/components/VideoUploadPreview.tsx`

Affiche:
- Thumbnail de la vidéo
- Durée formatée (HH:MM:SS)
- Taille du fichier
- Type de vidéo
- Progression de l'upload
- Statut (en attente, téléchargement, complété, erreur)

## Configuration du Stockage

### Limites de Stockage Supabase

**Migration:** `supabase/migrations/update_storage_limits_for_large_videos.sql`

- **Taille maximale par fichier:** 10GB (augmenté de 5GB)
- **Formats supportés:**
  - Images: JPEG, PNG, WebP, GIF, AVIF
  - Vidéos: MP4, WebM, QuickTime, AVI, Matroska

### Calculs de Capacité

**Vidéo 30 minutes:**
- Qualité Standard (720p, 2.5 Mbps): ~600MB
- Qualité HD (1080p, 4 Mbps): ~900MB
- Qualité 4K (2160p, 20 Mbps): ~4.5GB

## Limites de Taille et Méthodes d'Upload

Le système choisit automatiquement la meilleure méthode d'upload selon la taille du fichier :

| Taille du fichier | Méthode utilisée | Description |
|-------------------|------------------|-------------|
| < 50MB | Upload Standard | Rapide, upload direct en une seule requête |
| ≥ 50MB | TUS Resumable | Morceaux de 6MB, reprise possible, plus fiable |
| Max 10GB | TUS Resumable | Limite maximale du bucket |

**Important :** Les fichiers de 50MB ou plus utilisent automatiquement le protocole TUS pour éviter l'erreur "Payload too large" (413).

## Optimisations de Performance

### 1. Compression Automatique

Les images sont automatiquement converties en WebP avec:
- Résolution maximale: 1600×900px
- Qualité: 70% (ajustée selon la connexion)
- Réduction de taille: 60-80%

### 2. Upload Intelligent

- Détection automatique des fichiers volumineux (>50MB)
- Upload par chunks pour les vidéos
- Upload standard pour les petits fichiers
- Gestion des erreurs avec retry

### 3. Streaming Optimisé

- Preload="metadata" (charge uniquement les métadonnées)
- Chargement progressif du contenu
- Décodage asynchrone
- Cache des vidéos déjà visionnées

### 4. Adaptation à la Connexion

Le système détecte la qualité de connexion:
- **2G/Slow:** 1200×675px, qualité 50%
- **3G:** 1600×900px, qualité 65%
- **4G/Fast:** 1920×1080px, qualité 75%

## Intégration dans l'Application

### Hook useImageUpload

**Fichier:** `src/hooks/useImageUpload.ts`

Utilisation améliorée:
```typescript
const { uploadFile, generateVideoPreview, uploads } = useImageUpload();

// Upload d'une vidéo
const url = await uploadFile(videoFile, 'properties/123');

// Génération de preview
const thumbnailUrl = await generateVideoPreview(videoFile);

// Suivi de la progression
uploads.forEach(upload => {
  console.log(`${upload.fileName}: ${upload.progress}%`);
});
```

### Composants à Utiliser

1. **OptimizedVideoPlayer** - Pour lire les vidéos
2. **VideoUploadPreview** - Pour afficher les vidéos avant/pendant upload
3. **OptimizedImage** - Pour les images (déjà implémenté)

## Meilleures Pratiques

### Pour les Développeurs

1. **Toujours utiliser le hook useImageUpload**
   - Gestion automatique de la compression
   - Suivi de progression intégré
   - Gestion d'erreurs incluse

2. **Générer des thumbnails pour les vidéos**
   ```typescript
   const thumbnail = await generateVideoPreview(videoFile);
   ```

3. **Afficher la durée et la taille**
   ```typescript
   import { getVideoDuration, formatDuration } from './utils/videoProcessing';
   const duration = await getVideoDuration(file);
   console.log(formatDuration(duration)); // "12:34"
   ```

4. **Utiliser OptimizedVideoPlayer**
   ```tsx
   <OptimizedVideoPlayer
     src={videoUrl}
     poster={thumbnailUrl}
     autoPlay={false}
   />
   ```

### Pour les Utilisateurs

1. **Formats recommandés:**
   - MP4 (H.264) - Meilleure compatibilité
   - WebM (VP9) - Meilleure compression
   - MOV (QuickTime) - Pour les utilisateurs Apple

2. **Qualité d'enregistrement:**
   - 1080p recommandé (bon compromis taille/qualité)
   - 30 FPS suffisant
   - Bitrate vidéo: 4-6 Mbps

3. **Durée maximale:**
   - Jusqu'à 30 minutes supporté
   - Taille maximale: 10GB
   - Upload automatique par morceaux pour les gros fichiers

## Surveillance et Debugging

### Console Logs

Le système affiche des logs pour:
- Progression de l'upload
- Erreurs de compression
- Temps de traitement
- Taille avant/après compression

### Métriques à Surveiller

1. **Temps d'upload moyen**
   - Cible: <2 minutes pour 500MB

2. **Taux de réussite**
   - Cible: >95% d'uploads réussis

3. **Taille moyenne après compression**
   - Images: 200-400KB
   - Vidéos: réduction 10-20%

## Améliorations Futures (Optionnel)

1. **Transcodage côté serveur**
   - Conversion automatique en formats optimisés
   - Génération de plusieurs résolutions (360p, 720p, 1080p)
   - Utilisation de FFmpeg via Edge Function

2. **Streaming adaptatif (HLS/DASH)**
   - Adaptation automatique à la bande passante
   - Lecture plus fluide
   - Meilleure expérience utilisateur

3. **CDN Integration**
   - Distribution mondiale
   - Latence réduite
   - Coûts de bande passante optimisés

4. **Intelligence artificielle**
   - Détection automatique des scènes importantes
   - Génération de highlights
   - Compression intelligente selon le contenu

## Support Technique

### Erreurs Communes

#### Erreur "Payload too large" (413)
**Cause :** Fichier > 50MB utilisant la méthode d'upload standard

**Solution :** Le système utilise maintenant automatiquement TUS pour les fichiers ≥ 50MB. Si vous voyez cette erreur, assurez-vous que :
- Vous êtes connecté (TUS nécessite l'authentification)
- Le fichier est bien détecté comme vidéo
- La librairie `tus-js-client` est installée

#### Erreur "Maximum size exceeded"
**Cause :** Fichier > 10GB (limite du bucket)

**Solution :** Compresser la vidéo avant upload ou utiliser une résolution inférieure.

#### Upload bloqué à 0%
**Cause :** Problème de réseau ou session expirée

**Solution :**
1. Vérifier votre connexion internet
2. Se déconnecter puis se reconnecter
3. Rafraîchir la page
4. TUS reprendra automatiquement où il s'était arrêté

### Diagnostic

En cas de problème:
1. Ouvrir la console navigateur (F12)
2. Vérifier les erreurs JavaScript
3. Vérifier la taille du fichier (<10GB)
4. Vérifier le format du fichier (voir liste supportée)
5. Vérifier la connexion internet
6. Vérifier que vous êtes bien authentifié

## Conclusion

Le système HomeCi est maintenant optimisé pour gérer efficacement les vidéos longues tout en maintenant d'excellentes performances. Les uploads sont fiables, rapides, et l'expérience utilisateur est fluide même pour les connexions modestes.
