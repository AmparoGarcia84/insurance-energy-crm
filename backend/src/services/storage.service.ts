/**
 * services/storage.service.ts — Cloudflare R2 (S3-compatible) file storage
 *
 * Abstracts all file storage operations. When R2 env vars are present, files
 * are uploaded to the configured R2 bucket and a public URL is returned.
 * When R2 is not configured (local development without credentials), the
 * service signals that it is unconfigured so callers can fall back to local
 * disk storage — preserving the existing dev workflow.
 *
 * Required environment variables (all mandatory when using R2):
 *   R2_ACCOUNT_ID         — Cloudflare account ID
 *   R2_ACCESS_KEY_ID      — R2 API token access key
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET_NAME        — Bucket name (e.g. "crm-files")
 *   R2_PUBLIC_URL         — Public base URL for the bucket
 *                           (e.g. "https://pub-xxx.r2.dev" or a custom domain)
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Builds a fresh S3Client from the current environment variables.
 * Returns null when any required credential is missing.
 * A new instance is created per call — cheap for infrequent uploads.
 */
function getClient(): S3Client | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true when all required R2 env vars are present and the storage
 * client can be used. When false, callers should fall back to disk storage.
 */
export function isConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

/**
 * Uploads a file buffer to R2 and returns its public URL.
 *
 * @param buffer      Raw file bytes (from multer memoryStorage)
 * @param key         Object key within the bucket, e.g. "avatars/user-123.jpg"
 * @param contentType MIME type, e.g. "image/jpeg"
 * @returns           Full public URL to the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const client = getClient()
  if (!client) throw new Error('R2 storage is not configured')

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return `${process.env.R2_PUBLIC_URL}/${key}`
}

/**
 * Deletes a file from R2 by its public URL or its object key.
 * Silently ignores calls when R2 is not configured or the value is null/empty.
 *
 * @param urlOrKey  Full public R2 URL or bare object key (e.g. "avatars/u.jpg")
 */
export async function deleteFile(urlOrKey: string | null | undefined): Promise<void> {
  if (!urlOrKey) return
  const client = getClient()
  if (!client) return

  const key = urlOrKey.startsWith('http')
    ? urlOrKey.replace(`${process.env.R2_PUBLIC_URL}/`, '')
    : urlOrKey

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  )
}
