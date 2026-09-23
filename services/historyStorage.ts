export interface SavedLook {
  id: string;
  image: string;
  date: number;
  prompt?: string;
  storeName?: string;
}

const DB_NAME = 'virtual_tryon_db';
const DB_VERSION = 1;
const STORE_NAME = 'looks';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveLookToHistory = async (look: SavedLook): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(look);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao salvar no IndexedDB:', err);
  }
};

export const getLooksFromHistory = async (): Promise<SavedLook[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: SavedLook[] = req.result || [];
        // Ordenar do mais recente para o mais antigo
        results.sort((a, b) => b.date - a.date);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao buscar do IndexedDB:', err);
    return [];
  }
};

export const deleteLookFromHistory = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Erro ao excluir do IndexedDB:', err);
  }
};
