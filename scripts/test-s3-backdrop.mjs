/**
 * Quick S3 backdrop upload smoke test. Run:
 *   node --env-file=.env.local scripts/test-s3-backdrop.mjs
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

function trim(name) {
  const v = process.env[name]?.trim().replace(/^"|"$/g, '');
  return v || undefined;
}

const bucket = trim('S3_STAGE_BACKDROP_BUCKET') ?? trim('AWS_S3_BUCKET_NAME');
const region = trim('AWS_REGION');
const accessKeyId = trim('AWS_ACCESS_KEY_ID');
const secretAccessKey = trim('AWS_SECRET_ACCESS_KEY');

if (!bucket || !region) {
  console.error('Missing S3_STAGE_BACKDROP_BUCKET (or AWS_S3_BUCKET_NAME) and AWS_REGION');
  process.exit(1);
}

const prefix = (trim('S3_STAGE_BACKDROP_PREFIX') ?? 'stages/').replace(/\/?$/, '/');
const key = `${prefix}s3-smoke-test.jpg`;
const samplePath = join(process.cwd(), 'public/images/city/city-skyline.jpg');
const body = readFileSync(samplePath);

const client = new S3Client({
  region,
  credentials: accessKeyId && secretAccessKey
    ? { accessKeyId, secretAccessKey }
    : undefined,
});

const cdnBase = trim('S3_STAGE_BACKDROP_PUBLIC_URL');
const host = region === 'us-east-1'
  ? `${bucket}.s3.amazonaws.com`
  : `${bucket}.s3.${region}.amazonaws.com`;
const publicUrl = cdnBase
  ? `${cdnBase.replace(/\/$/, '')}/${key}`
  : `https://${host}/${key}`;

console.log('Bucket:', bucket);
console.log('Region:', region);
console.log('Key:', key);

try {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  console.log('PutObject: OK');
} catch (err) {
  console.error('PutObject FAILED:', err.message || err);
  process.exit(1);
}

try {
  const res = await fetch(publicUrl, { method: 'HEAD' });
  console.log('Public URL:', publicUrl);
  console.log('HEAD status:', res.status, res.ok ? '(readable)' : '(not public — check bucket policy or CloudFront)');
} catch (err) {
  console.error('HEAD failed:', err.message || err);
}
