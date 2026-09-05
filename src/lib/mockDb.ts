// Mock Database using LocalStorage for Development

export interface KalolsavamEvent {
  id: string;
  category: string; // LP, UP, HS, HSS
  itemName: string;
  itemCode: string;
}

export interface SampoornaStudent {
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
}

export interface SystemSettings {
  registrationOpen: boolean;
  startDate: string;
  endDate: string;
}

const DEFAULT_EVENTS: KalolsavamEvent[] = [];

// Generic helper to get/set localstorage
function getStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function setStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Events API
export const getEvents = () => {
  const data = getStorage<KalolsavamEvent[]>('kal_events', DEFAULT_EVENTS);
  return Array.isArray(data) ? data : [];
};
export const addEvent = (event: Omit<KalolsavamEvent, 'id'>) => {
  const events = getEvents();
  const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
  setStorage('kal_events', [...events, newEvent]);
  return newEvent;
};
export const deleteEvent = (id: string) => {
  setStorage('kal_events', getEvents().filter(e => e.id !== id));
};
export const updateEvent = (id: string, updates: Partial<KalolsavamEvent>) => {
  const events = getEvents();
  const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
  setStorage('kal_events', updated);
};
export const wipeAllEvents = () => {
  localStorage.removeItem('kal_events');
};

// Registrations API
export const getRegistrations = () => getStorage<RegistrationEntry[]>('kal_registrations', []);
export const addRegistration = (entry: Omit<RegistrationEntry, 'id' | 'date'>) => {
  const regs = getRegistrations();
  const newReg = { 
    ...entry, 
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString()
  };
  setStorage('kal_registrations', [...regs, newReg]);
  return newReg;
};
export const updateRegistration = (id: string, updates: Partial<RegistrationEntry>) => {
  const regs = getRegistrations();
  const updated = regs.map(r => r.id === id ? { ...r, ...updates } : r);
  setStorage('kal_registrations', updated);
};
export const deleteRegistration = (id: string) => {
  setStorage('kal_registrations', getRegistrations().filter(r => r.id !== id));
};

// Sampoorna API
export const getSampoornaStudents = () => {
  const students = getStorage<SampoornaStudent[]>('kal_sampoorna', []);
  const hasDemo = students.some(s => s.admissionNumber === '12345678');
  if (!hasDemo) {
    students.push({
      admissionNumber: '12345678',
      fullName: 'Vyshnav',
      classGrade: '10',
      division: 'F'
    });
  }
  return students;
};
export const saveSampoornaStudents = (students: SampoornaStudent[]) => setStorage('kal_sampoorna', students);
export const getSampoornaStudentByAdmission = (admNo: string) => {
  const students = getSampoornaStudents();
  return students.find(s => s.admissionNumber.toString() === admNo.toString()) || null;
};
export const wipeSampoornaDb = () => setStorage('kal_sampoorna', []);

export const wipeAllRegistrations = () => setStorage('kal_registrations', []);

// Settings API
export const getSettings = () => getStorage<SystemSettings>('kal_settings', {
  registrationOpen: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
});
export const updateSettings = (settings: SystemSettings) => {
  setStorage('kal_settings', settings);
};

// IndexedDB Setup for Gallery (to bypass localStorage 5MB limit)
const DB_NAME = 'KalolsavamGalleryDB';
const STORE_NAME = 'albums';

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Gallery API (Albums) - Now using IndexedDB asynchronously
export interface GalleryAlbum {
  id: string;
  title: string;
  images: string[];
}

export const getGallery = async (): Promise<GalleryAlbum[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        let albums = request.result as GalleryAlbum[];
        
        // Migrate from LocalStorage if IndexedDB is empty
        if (albums.length === 0) {
          const oldData = localStorage.getItem('kal_gallery');
          if (oldData) {
            try {
              const parsed = JSON.parse(oldData);
              if (parsed.length > 0 && typeof parsed[0] === 'string') {
                 albums = [{ id: 'default', title: 'Kalolsavam 2026', images: parsed }];
              } else {
                 albums = parsed as GalleryAlbum[];
              }
              albums.forEach(a => store.put(a));
              localStorage.removeItem('kal_gallery'); // Free up localStorage space
            } catch (e) {}
          }
        }
        resolve(albums);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
};

export const addGalleryImage = async (albumId: string, base64: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(albumId);
    
    getReq.onsuccess = () => {
      const album = getReq.result as GalleryAlbum;
      if (album) {
        album.images.push(base64);
        const putReq = store.put(album);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const createGalleryAlbum = async (title: string): Promise<void> => {
  const db = await initDB();
  const newAlbum: GalleryAlbum = { id: Date.now().toString(), title, images: [] };
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(newAlbum);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteGalleryImage = async (albumId: string, imageIndex: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(albumId);
    
    getReq.onsuccess = () => {
      const album = getReq.result as GalleryAlbum;
      if (album) {
        album.images.splice(imageIndex, 1);
        const putReq = store.put(album);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deleteGalleryAlbum = async (albumId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(albumId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
