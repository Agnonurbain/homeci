export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

const CLOUD_NAME = 'daip1z5ej';
const UPLOAD_PRESET = 'homeci_properties';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const storageService = {
  uploadImage(
    file: File,
    _path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'homeci');

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            progress: (e.loaded / e.total) * 100,
            bytesTransferred: e.loaded,
            totalBytes: e.total,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload échoué (${xhr.status}): ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error("Erreur réseau lors de l'upload")));
      xhr.addEventListener('abort', () => reject(new Error('Upload annulé')));

      xhr.open('POST', UPLOAD_URL);
      xhr.send(formData);
    });
  },

  async deleteFile(_fileUrl: string): Promise<void> {
    console.info('Suppression Cloudinary non implémentée côté client');
  },

  // Upload de document (PDF, images de documents)
  uploadDocument(
    file: File,
    propertyId: string,
    documentType: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `homeci/documents/${propertyId}`);
      formData.append('public_id', `${documentType}_${Date.now()}`);
      // Permettre PDF et images
      formData.append('resource_type', 'auto');

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload document échoué (${xhr.status})`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error("Erreur réseau")));
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  },

  // Upload fichier 3D (.glb, .gltf)
  uploadModel3D(
    file: File,
    propertyId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `homeci/models3d/${propertyId}`);
      formData.append('resource_type', 'raw');

      const xhr = new XMLHttpRequest();
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload 3D échoué (${xhr.status})`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error("Erreur réseau")));
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  },

  // Cloudinary détecte automatiquement les vidéos — même endpoint que les images
  uploadVideo(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return this.uploadImage(file, path, onProgress);
  },

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

