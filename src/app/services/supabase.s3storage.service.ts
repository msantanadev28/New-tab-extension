import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const DEFAULT_IMAGE_BUCKET = 'new-tab-bucket';

@Injectable({
  providedIn: 'root'
})
export class SupabaseS3StorageService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  private generateFileName(originalName?: string): string {
    const safeName = (originalName || 'image')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image';

    return `${Date.now()}_${safeName}`;
  }

  private blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, {
      type: blob.type || 'application/octet-stream'
    });
  }

  private getExtensionFromContentType(contentType: string | null): string {
    const normalizedContentType = (contentType || '').toLowerCase();

    if (normalizedContentType.includes('png')) return '.png';
    if (normalizedContentType.includes('jpeg') || normalizedContentType.includes('jpg')) return '.jpg';
    if (normalizedContentType.includes('webp')) return '.webp';
    if (normalizedContentType.includes('gif')) return '.gif';
    if (normalizedContentType.includes('svg')) return '.svg';
    if (normalizedContentType.includes('bmp')) return '.bmp';
    if (normalizedContentType.includes('avif')) return '.avif';

    return '';
  }

  private getSafeImageNameFromUrl(url: string, contentType: string | null): string {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.split('/').filter(Boolean).pop() || 'image';
      const hasExtension = /\.[a-z0-9]{2,5}$/i.test(pathname);

      if (hasExtension) {
        return pathname;
      }

      return `${pathname}${this.getExtensionFromContentType(contentType)}` || `image${this.getExtensionFromContentType(contentType)}`;
    } catch {
      return `image${this.getExtensionFromContentType(contentType)}`;
    }
  }

  private async uploadBlobAsFile(blob: Blob, fileName: string, bucket: string): Promise<string> {
    const file = this.blobToFile(blob, this.generateFileName(fileName));
    const path = file.name;
    const result = await this.uploadFile(bucket, path, file);

    if (result.error) {
      throw new Error(result.error.message || 'Supabase upload failed.');
    }

    return this.getPublicUrl(bucket, path).data.publicUrl;
  }

  async uploadFromUrl(url: string, bucket = DEFAULT_IMAGE_BUCKET): Promise<string> {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid image URL.');
    }

    if (!/^https?:$/.test(parsedUrl.protocol)) {
      throw new Error('Only http and https URLs are supported.');
    }

    const response = await fetch(parsedUrl.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL (${response.status}).`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`The provided URL does not point to an image (content-type: ${contentType}).`);
    }

    const blob = await response.blob();

    if (blob.type && !blob.type.toLowerCase().startsWith('image/')) {
      throw new Error(`The provided URL did not return an image blob (type: ${blob.type}).`);
    }

    const fileName = this.getSafeImageNameFromUrl(parsedUrl.toString(), contentType || blob.type);
    return await this.uploadBlobAsFile(blob, fileName, bucket);
  }

  async uploadFromFile(file: File | Blob, bucket = DEFAULT_IMAGE_BUCKET): Promise<string> {
    const sourceFile = file instanceof File
      ? file
      : this.blobToFile(file, `image${this.getExtensionFromContentType(file.type)}`);

    const fileName = this.generateFileName(sourceFile.name || `image${this.getExtensionFromContentType(sourceFile.type)}`);
    const result = await this.uploadFile(bucket, fileName, sourceFile);

    if (result.error) {
      throw new Error(result.error.message || 'Supabase upload failed.');
    }

    return this.getPublicUrl(bucket, fileName).data.publicUrl;
  }

  async uploadFile(bucket: string, path: string, file: File) {
    const res = await this.client.storage.from(bucket).upload(path, file, { upsert: true });

    if (res.error) {
      // Improve guidance for common RLS / unauthorized mistakes from client-side uploads
      const msg = String(res.error.message || res.error);

      if (res.error.status === 403 || msg.includes('row-level security') || msg.includes('violates row-level security')) {
        res.error.message = msg + ' — Upload denied. Make the bucket public in the Supabase dashboard or authenticate the client (RLS prevents anonymous inserts).';
      }
    }

    return res;
  }

  async listFiles(bucket: string, prefix?: string) {
    const res = await this.client.storage.from(bucket).list(prefix ?? '');

    if (res.error) {
      const msg = String(res.error.message || res.error);

      if (res.error.status === 403 || msg.includes('row-level security') || msg.includes('violates row-level security')) {
        res.error.message = msg + ' — Listing denied. Make the bucket public or authenticate the client to list objects.';
      }
    }

    return res;
  }

  getPublicUrl(bucket: string, path: string) {
    return this.client.storage.from(bucket).getPublicUrl(path);
  }

  async downloadFile(bucket: string, path: string) {
    const res = await this.client.storage.from(bucket).download(path);

    if (res.error) {
      const msg = String(res.error.message || res.error);

      if (res.error.status === 403 || msg.includes('row-level security') || msg.includes('violates row-level security')) {
        res.error.message = msg + ' — Download denied. Make the bucket public or authenticate the client to download objects.';
      }
    }

    return res;
  }

  async deleteFile(bucket: string, path: string) {
    const res = await this.client.storage.from(bucket).remove([path]);

    if (res.error) {
      const msg = String(res.error.message || res.error);

      if (res.error.status === 403 || msg.includes('row-level security') || msg.includes('violates row-level security')) {
        res.error.message = msg + ' — Delete denied. Make the bucket public or authenticate the client to remove objects.';
      }
    }

    return res;
  }

  getS3Credentials() {
    const runtimeEnvironment = environment as Record<string, string | undefined>;

    return {
      endpoint: runtimeEnvironment['s3Endpoint'],
      accessKeyId: runtimeEnvironment['s3AccessKeyId'],
      secretAccessKey: runtimeEnvironment['s3SecretAccessKey']
    };
  }
}
