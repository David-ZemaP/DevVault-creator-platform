import { randomUUID } from 'node:crypto';
import { commerceDb, checked, HttpError } from './marketplace-db';
export const SOURCE_TTL_SECONDS = 600;
export const SOURCE_BUCKET = 'source-artifacts';
export interface PrivateArtifactStorage {
  upload(projectId: string, file: File): Promise<void>;
  download(projectId: string): Promise<{ url: string; expiresIn: number }>;
}
async function privateBucket() {
  const db = commerceDb();
  const bucket = checked(await db.storage.getBucket(SOURCE_BUCKET));
  if (!bucket || bucket.public) throw new HttpError(503, 'Source bucket must be private');
  return db;
}
export const sourceStorage: PrivateArtifactStorage = {
  async upload(projectId, file) {
    if (file.size <= 0 || file.size > 20 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.zip')) throw new HttpError(400, 'Upload a ZIP archive up to 20 MiB');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || ![3, 5, 7].includes(bytes[2])) throw new HttpError(400, 'Invalid ZIP archive');
    const db = await privateBucket();
    const key = `${projectId}/${randomUUID()}.zip`;
    checked(await db.storage.from(SOURCE_BUCKET).upload(key, bytes, { contentType: 'application/zip', upsert: false }));
    // Immutable association avoids replacement races with publication and existing purchases.
    const result = await db.from('source_artifacts').insert({ project_id: projectId, object_key: key });
    if (result.error) {
      await db.storage.from(SOURCE_BUCKET).remove([key]);
      throw new HttpError(409, 'Source already uploaded. Create a new project for a different archive.');
    }
  },
  async download(projectId) {
    const db = await privateBucket();
    const artifact = checked(await db.from('source_artifacts').select('object_key').eq('project_id', projectId).maybeSingle());
    if (!artifact) throw new HttpError(404, 'Source archive is unavailable');
    const signed = checked(await db.storage.from(SOURCE_BUCKET).createSignedUrl(artifact.object_key, SOURCE_TTL_SECONDS, { download: true }));
    if (!signed) throw new HttpError(503, 'Unable to sign source download');
    return { url: signed.signedUrl, expiresIn: SOURCE_TTL_SECONDS };
  },
};
