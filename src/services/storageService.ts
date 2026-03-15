import { storage } from '../lib/firebase';
import {
  ref,
  uploadBytesResumable,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { compressImage, COMPRESS_PRESETS } from '../utils/compressImage';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export const storageService = {
  /**
   * Upload d'une image de propriété (compressée automatiquement).
   * Stockée dans : images/{path}/{timestamp}.jpg
   */
  async uploadImage(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Compresser l'image avant upload
    const compressed = await compressImage(file, COMPRESS_PRESETS.property);

    const ext = compressed.name.split('.').pop() || 'jpg';
    const storagePath = `images/${path}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storageRef = ref(storage, storagePath);

    if (onProgress) {
      // Upload avec progression
      return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, compressed);
        task.on(
          'state_changed',
          (snapshot) => {
            onProgress({
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          }
        );
      });
    }

    // Upload simple (sans progression)
    await uploadBytes(storageRef, compressed);
    return getDownloadURL(storageRef);
  },

  /**
   * Supprime un fichier par URL Firebase Storage.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('[HOMECI] Suppression fichier échouée:', err);
    }
  },

  /**
   * Upload de document légal (PDF, images) — PAS de compression pour les PDFs.
   * Stocké dans : documents/{propertyId}/{docType}_{timestamp}.{ext}
   */
  async uploadDocument(
    file: File,
    propertyId: string,
    documentType: string
  ): Promise<string> {
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file, COMPRESS_PRESETS.property);
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `documents/${propertyId}/${documentType}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, fileToUpload);
    return getDownloadURL(storageRef);
  },

  /**
   * Upload de modèle 3D (.glb, .gltf).
   * Stocké dans : models3d/{propertyId}/{timestamp}.{ext}
   */
  async uploadModel3D(
    file: File,
    propertyId: string
  ): Promise<string> {
    const ext = file.name.split('.').pop() || 'glb';
    const path = `models3d/${propertyId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  /**
   * Upload vidéo avec progression.
   * Stockée dans : videos/{path}/{timestamp}.{ext}
   */
  uploadVideo(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const ext = file.name.split('.').pop() || 'mp4';
    const storagePath = `videos/${path}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            onProgress({
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          }
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  },

  /**
   * Upload multiple images (compressées) avec progression par fichier.
   */
  async uploadMultipleImages(
    files: File[],
    path: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await this.uploadImage(files[i], path, (p) => {
        if (onProgress) onProgress(i, p);
      });
      urls.push(url);
    }
    return urls;
  },
};
