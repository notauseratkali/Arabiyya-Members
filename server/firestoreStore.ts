import { adminDb } from './firebaseAdmin';

export function firestoreReady(): boolean {
  return Boolean(adminDb);
}

function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  if (obj instanceof Date) return obj.toISOString();

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned;
}

export async function saveDoc(collectionName: string, id: string, data: any, merge = true): Promise<void> {
  if (!adminDb || !id) return;
  const ref = adminDb.collection(collectionName).doc(String(id));
  const payload = cleanFirestoreData(data);
  if (merge) {
    await ref.set(payload, { merge: true });
  } else {
    await ref.set(payload);
  }
}

export async function removeDoc(collectionName: string, id: string): Promise<void> {
  if (!adminDb || !id) return;
  await adminDb.collection(collectionName).doc(String(id)).delete();
}

export interface StoredDoc {
  id: string;
  exists: () => boolean;
  data: () => any;
}

export async function loadAll(collectionName: string): Promise<StoredDoc[]> {
  if (!adminDb) return [];
  const snap = await adminDb.collection(collectionName).get();
  return snap.docs.map((d) => ({
    id: d.id,
    exists: () => true,
    data: () => d.data()
  }));
}

export async function loadOne(collectionName: string, id: string): Promise<StoredDoc> {
  if (!adminDb || !id) {
    return { id: id || '', exists: () => false, data: () => undefined };
  }
  const snap = await adminDb.collection(collectionName).doc(String(id)).get();
  return {
    id: snap.id,
    exists: () => snap.exists,
    data: () => snap.data()
  };
}
