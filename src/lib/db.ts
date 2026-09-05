// ─── Types ───────────────────────────────────────────────────────────────────
export interface KalolsavamEvent {
  id: string;
  category: string;
  itemName: string;
  itemCode: string;
}

export interface SampoornaStudent {
  admissionNumber: string;
  fullName: string;
  classGrade: string;
  division: string;
}

export interface GroupMember {
  admissionNumber: string;
  fullName: string;
  classGrade: string;
  division: string;
}

export interface RegistrationEntry {
  id: string;
  admissionNumber?: string;
  fullName: string;
  classGrade: string;
  division: string;
  category: string;
  itemNames: string[];
  itemCodes: string[];
  date: string;
  registrationType?: 'individual' | 'group';
  groupMembers?: GroupMember[];
  groupName?: string;
}

export interface SystemSettings {
  registrationOpen: boolean;
  startDate: string;
  endDate: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  coverImage?: string;
  images: { id: string; url: string; caption?: string; storagePath?: string }[];
}

export interface HallOfFameEntry {
  id: string;
  studentName: string;
  itemWon: string;
  year: string;
  imageUrl: string;
  aiDescription?: string;
}

// ─── Firebase Imports ────────────────────────────────────────────────────────
import {
  collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, writeBatch, query, orderBy, serverTimestamp,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';

// ─── Simple In-Memory Cache ───────────────────────────────────────────────────
const TTL_MS = 60_000;
interface CacheEntry<T> { data: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<any>>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}
function cacheBust(...keys: string[]): void {
  keys.forEach(k => cache.delete(k));
}

// ─── Events ───────────────────────────────────────────────────────────────────
export const getEvents = async (): Promise<KalolsavamEvent[]> => {
  const cached = cacheGet<KalolsavamEvent[]>('events');
  if (cached) return cached;
  try {
    const snap = await getDocs(query(collection(db, 'events'), orderBy('category')));
    const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as KalolsavamEvent));
    cacheSet('events', data);
    return data;
  } catch (e) { console.error(e); return []; }
};

export const addEvent = async (event: Omit<KalolsavamEvent, 'id'>) => {
  const docRef = await addDoc(collection(db, 'events'), event);
  cacheBust('events');
  return { id: docRef.id, ...event };
};

export const updateEvent = async (id: string, updates: Partial<KalolsavamEvent>) => {
  await updateDoc(doc(db, 'events', id), updates);
  cacheBust('events');
};

export const deleteEvent = async (id: string) => {
  await deleteDoc(doc(db, 'events', id));
  cacheBust('events');
};

export const wipeAllEvents = async () => {
  const snap = await getDocs(collection(db, 'events'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  cacheBust('events');
};

// ─── Registrations ────────────────────────────────────────────────────────────
export const getRegistrations = async (): Promise<RegistrationEntry[]> => {
  const cached = cacheGet<RegistrationEntry[]>('registrations');
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'registrations'));
    const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as RegistrationEntry));
    cacheSet('registrations', data);
    return data;
  } catch (e) { console.error(e); return []; }
};

export const addRegistration = async (entry: Omit<RegistrationEntry, 'id' | 'date'>) => {
  const payload = { ...entry, date: new Date().toISOString(), createdAt: serverTimestamp() };
  const docRef = await addDoc(collection(db, 'registrations'), payload);
  cacheBust('registrations');
  return { id: docRef.id, ...payload };
};

export const addGroupRegistration = async (
  leader: { admissionNumber: string; fullName: string; classGrade: string; division: string; category: string },
  members: GroupMember[],
  itemNames: string[],
  itemCodes: string[],
  groupName: string
) => {
  const payload = {
    ...leader,
    itemNames,
    itemCodes,
    registrationType: 'group',
    groupMembers: members,
    groupName,
    date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'registrations'), payload);
  cacheBust('registrations');
  return { id: docRef.id, ...payload };
};

export const updateRegistration = async (id: string, updates: Partial<RegistrationEntry>) => {
  await updateDoc(doc(db, 'registrations', id), updates);
  cacheBust('registrations');
};

export const deleteRegistration = async (id: string) => {
  await deleteDoc(doc(db, 'registrations', id));
  cacheBust('registrations');
};

export const wipeAllRegistrations = async () => {
  const snap = await getDocs(collection(db, 'registrations'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  cacheBust('registrations');
};

// ─── Sampoorna Database ───────────────────────────────────────────────────────
export const getSampoornaStudents = async (): Promise<SampoornaStudent[]> => {
  const cached = cacheGet<SampoornaStudent[]>('sampoorna');
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'sampoorna'));
    const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data() } as SampoornaStudent));
    cacheSet('sampoorna', data);
    return data;
  } catch (e) { console.error(e); return []; }
};

export const addSampoornaStudents = async (students: SampoornaStudent[]) => {
  const batch = writeBatch(db);
  students.forEach(s => {
    const ref = doc(collection(db, 'sampoorna'));
    batch.set(ref, s);
  });
  await batch.commit();
  cacheBust('sampoorna');
};

export const clearSampoornaDatabase = async () => {
  const snap = await getDocs(collection(db, 'sampoorna'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  cacheBust('sampoorna');
};
export const wipeSampoornaDb = clearSampoornaDatabase;

export const getSampoornaStudentByAdmission = async (admissionNumber: string): Promise<SampoornaStudent | undefined> => {
  const students = await getSampoornaStudents();
  return students.find(s => s.admissionNumber.toString() === admissionNumber.toString());
};

// ─── System Settings ──────────────────────────────────────────────────────────
const SETTINGS_DOC = 'main';

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const cached = cacheGet<SystemSettings>('settings');
  if (cached) return cached;
  try {
    const snap = await getDoc(doc(db, 'settings', SETTINGS_DOC));
    if (snap.exists()) {
      const data = snap.data() as SystemSettings;
      cacheSet('settings', data);
      return data;
    }
    return { registrationOpen: true, startDate: '', endDate: '2027-10-20' };
  } catch (e) {
    console.error(e);
    return { registrationOpen: true, startDate: '', endDate: '2027-10-20' };
  }
};

export const updateSettings = async (updates: Partial<SystemSettings>) => {
  await setDoc(doc(db, 'settings', SETTINGS_DOC), updates, { merge: true });
  cacheBust('settings');
};

// ─── Gallery ──────────────────────────────────────────────────────────────────
export const getGallery = async (): Promise<GalleryAlbum[]> => {
  const cached = cacheGet<GalleryAlbum[]>('gallery');
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'gallery'));
    const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as GalleryAlbum));
    cacheSet('gallery', data);
    return data;
  } catch (e) { console.error(e); return []; }
};

export const getGalleryPreview = async (maxImages = 3): Promise<string[]> => {
  try {
    const albums = await getGallery();
    const urls: string[] = [];
    for (const album of albums) {
      for (const img of album.images ?? []) {
        urls.push(img.url);
        if (urls.length >= maxImages) return urls;
      }
    }
    return urls;
  } catch (e) { return []; }
};

export const createGalleryAlbum = async (title: string) => {
  const docRef = await addDoc(collection(db, 'gallery'), { title, images: [] });
  cacheBust('gallery');
  return { id: docRef.id, title, images: [] };
};

// Upload image file to Firebase Storage then save URL to Firestore album
export const uploadGalleryImage = async (albumId: string, file: File, caption?: string): Promise<void> => {
  const path = `gallery/${albumId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);

  const albumRef = doc(db, 'gallery', albumId);
  const snap = await getDoc(albumRef);
  if (!snap.exists()) throw new Error('Album not found');
  const album = snap.data() as GalleryAlbum;
  const newImage = { id: `${Date.now()}`, url, caption: caption ?? '', storagePath: path };
  await updateDoc(albumRef, { images: [...(album.images ?? []), newImage] });
  cacheBust('gallery');
};

// Legacy base64 helper — kept for backward compat
export const addGalleryImage = async (albumId: string, base64Url: string, caption?: string) => {
  const albumRef = doc(db, 'gallery', albumId);
  const snap = await getDoc(albumRef);
  if (!snap.exists()) throw new Error('Album not found');
  const album = snap.data() as GalleryAlbum;
  const newImage = { id: `${Date.now()}`, url: base64Url, caption: caption ?? '' };
  await updateDoc(albumRef, { images: [...(album.images ?? []), newImage] });
  cacheBust('gallery');
};

export const deleteGalleryImage = async (albumId: string, imageId: string) => {
  const albumRef = doc(db, 'gallery', albumId);
  const snap = await getDoc(albumRef);
  if (!snap.exists()) return;
  const album = snap.data() as GalleryAlbum;
  const img = (album.images ?? []).find((i: any) => i.id === imageId);
  // Delete from Storage if we have the path
  if (img?.storagePath) {
    try { await deleteObject(storageRef(storage, img.storagePath)); } catch (_) {}
  }
  await updateDoc(albumRef, { images: (album.images ?? []).filter((i: any) => i.id !== imageId) });
  cacheBust('gallery');
};

export const deleteGalleryAlbum = async (albumId: string) => {
  await deleteDoc(doc(db, 'gallery', albumId));
  cacheBust('gallery');
};

// ─── Hall of Fame ─────────────────────────────────────────────────────────────
export const getHallOfFame = async (): Promise<HallOfFameEntry[]> => {
  const cached = cacheGet<HallOfFameEntry[]>('halloffame');
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'hallOfFame'));
    const data = snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as HallOfFameEntry));
    cacheSet('halloffame', data);
    return data;
  } catch (e) { console.error(e); return []; }
};

export const addHallOfFameEntry = async (entry: Omit<HallOfFameEntry, 'id'>) => {
  const docRef = await addDoc(collection(db, 'hallOfFame'), entry);
  cacheBust('halloffame');
  return { id: docRef.id, ...entry };
};

export const updateHallOfFameEntry = async (id: string, updates: Partial<HallOfFameEntry>) => {
  await updateDoc(doc(db, 'hallOfFame', id), updates);
  cacheBust('halloffame');
};

export const deleteHallOfFameEntry = async (id: string) => {
  await deleteDoc(doc(db, 'hallOfFame', id));
  cacheBust('halloffame');
};

// ─── Firebase Storage Image Upload Helper (for admin pages) ──────────────────
export const uploadImageToStorage = async (file: File, folder = 'uploads'): Promise<string> => {
  const path = `${folder}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return getDownloadURL(ref);
};
