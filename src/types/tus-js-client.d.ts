declare module 'tus-js-client' {
  export interface UploadOptions {
    endpoint: string;
    headers?: Record<string, string>;
    metadata?: Record<string, string>;
    chunkSize?: number;
    retryDelays?: number[];
    removeFingerprintOnSuccess?: boolean;
    uploadDataDuringCreation?: boolean;
    onError?: (error: Error | DetailedError) => void;
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
    onSuccess?: () => void;
  }

  export interface DetailedError extends Error {
    originalRequest?: XMLHttpRequest;
    originalResponse?: XMLHttpRequest;
  }

  export interface PreviousUpload {
    size: number | null;
    metadata: Record<string, string>;
    creationTime: string;
  }

  export class Upload {
    constructor(file: File | Blob, options: UploadOptions);
    file: File | Blob;
    url: string | null;
    start(): void;
    abort(shouldTerminate?: boolean): Promise<void>;
    findPreviousUploads(): Promise<PreviousUpload[]>;
    resumeFromPreviousUpload(previousUpload: PreviousUpload): void;
  }
}
