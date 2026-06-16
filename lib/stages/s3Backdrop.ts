import 'server-only';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

function trimEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

function backdropBucket(): string | undefined {
  return trimEnv('S3_STAGE_BACKDROP_BUCKET') ?? trimEnv('AWS_S3_BUCKET_NAME');
}

/** True when bucket + region are set (credentials via env or IAM role). */
export function isS3BackdropConfigured(): boolean {
  return Boolean(backdropBucket() && trimEnv('AWS_REGION'));
}

function s3Client(): S3Client {
  const region = trimEnv('AWS_REGION')!;
  const accessKeyId = trimEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = trimEnv('AWS_SECRET_ACCESS_KEY');
  const sessionToken = trimEnv('AWS_SESSION_TOKEN');

  return new S3Client({
    region,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) } }
      : {}),
  });
}

/** S3 object key, e.g. `stages/my-slug.jpg`. */
export function stageBackdropObjectKey(slug: string, ext: string): string {
  const raw = trimEnv('S3_STAGE_BACKDROP_PREFIX') ?? 'stages/';
  const prefix = raw.endsWith('/') ? raw : `${raw}/`;
  return `${prefix}${slug}${ext}`;
}

/** Public HTTPS URL for a stored object key. */
export function publicUrlForS3Key(key: string): string {
  const cdnBase = trimEnv('S3_STAGE_BACKDROP_PUBLIC_URL');
  if (cdnBase) {
    return `${cdnBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  const bucket = backdropBucket()!;
  const region = trimEnv('AWS_REGION')!;
  const host = region === 'us-east-1'
    ? `${bucket}.s3.amazonaws.com`
    : `${bucket}.s3.${region}.amazonaws.com`;
  return `https://${host}/${key}`;
}

export async function putStageBackdropToS3(
  slug: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const bucket = backdropBucket()!;
  const key = stageBackdropObjectKey(slug, ext);
  await s3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return publicUrlForS3Key(key);
}
