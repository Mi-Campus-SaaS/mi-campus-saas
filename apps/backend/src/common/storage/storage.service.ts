import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, type S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, unlinkSync } from 'fs';
import { join } from 'path';

export interface UploadTarget {
  readonly key: string;
  readonly url: string;
}

@Injectable()
export class StorageService {
  private readonly mode: 'local' | 's3';
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly localDir: string;

  constructor() {
    this.mode = (process.env.STORAGE_MODE as 'local' | 's3') || 'local';
    this.localDir = process.env.UPLOAD_DIR || 'uploads';
    if (this.mode === 's3') {
      this.bucket = process.env.S3_BUCKET || '';
      const config: S3ClientConfig = {
        region: process.env.S3_REGION || 'us-east-1',
      };
      if (process.env.S3_ENDPOINT) config.endpoint = process.env.S3_ENDPOINT;
      if (process.env.S3_FORCE_PATH_STYLE === 'true') config.forcePathStyle = true;
      if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
        config.credentials = {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        };
      }
      this.s3 = new S3Client(config);
    }
  }

  async uploadFromLocalTemp(tempPath: string, destKey: string, contentType?: string): Promise<UploadTarget> {
    if (this.mode === 's3' && this.s3 && this.bucket) {
      const key = destKey;
      const body = createReadStream(tempPath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      try {
        unlinkSync(tempPath);
      } catch {
        // ignore temp cleanup errors
      }
      return { key, url: `s3://${this.bucket}/${key}` };
    }
    // local mode: file already placed in UPLOAD_DIR by Multer, return path
    return { key: destKey, url: join(this.localDir, destKey) };
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    if (this.mode === 's3' && this.s3 && this.bucket) {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
    }
    // local: return a relative URL under /files (served by ServeStaticModule)
    const base = process.env.PUBLIC_BASE_URL || '';
    const cleanedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanedBase}/files/${key}`;
  }
}
