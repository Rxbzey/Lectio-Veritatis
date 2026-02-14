import type { Book, ChapterResponse } from '@/lib/api';

const DB_NAME = 'living-scripture-offline';
const DB_VERSION = 1;

const BOOKS_STORE = 'books';
const CHAPTERS_STORE = 'chapters';
const PROGRESS_QUEUE_STORE = 'progressQueue';

interface CachedBooksRecord {
  id: 'books';
  data: Book[];
  updatedAt: number;
}

interface CachedChapterRecord {
  id: string;
  abbrev: string;
  chapter: number;
  data: ChapterResponse;
  updatedAt: number;
}

export interface ProgressSyncEvent {
  id?: number;
  type: 'chapter-completed';
  payload: {
    book: string;
    chapter: number;
    lastVerse?: number;
  };
  createdAt: number;
}

function isIndexedDbAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function openOfflineDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(CHAPTERS_STORE)) {
        db.createObjectStore(CHAPTERS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(PROGRESS_QUEUE_STORE)) {
        db.createObjectStore(PROGRESS_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open offline database'));
  });
}

function chapterCacheId(abbrev: string, chapter: number) {
  return `${abbrev}:${chapter}`;
}

export async function readCachedBooks(): Promise<Book[] | null> {
  const db = await openOfflineDb();
  if (!db) return null;

  try {
    const tx = db.transaction(BOOKS_STORE, 'readonly');
    const store = tx.objectStore(BOOKS_STORE);
    const record = await requestToPromise(store.get('books')) as CachedBooksRecord | undefined;
    await transactionDone(tx);
    return record?.data ?? null;
  } catch (error) {
    console.warn('Failed reading cached books', error);
    return null;
  } finally {
    db.close();
  }
}

export async function cacheBooks(books: Book[]): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;

  try {
    const tx = db.transaction(BOOKS_STORE, 'readwrite');
    const store = tx.objectStore(BOOKS_STORE);
    const record: CachedBooksRecord = {
      id: 'books',
      data: books,
      updatedAt: Date.now(),
    };
    store.put(record);
    await transactionDone(tx);
  } catch (error) {
    console.warn('Failed caching books', error);
  } finally {
    db.close();
  }
}

export async function readCachedChapter(abbrev: string, chapter: number): Promise<ChapterResponse | null> {
  const db = await openOfflineDb();
  if (!db) return null;

  try {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly');
    const store = tx.objectStore(CHAPTERS_STORE);
    const record = await requestToPromise(store.get(chapterCacheId(abbrev, chapter))) as CachedChapterRecord | undefined;
    await transactionDone(tx);
    return record?.data ?? null;
  } catch (error) {
    console.warn('Failed reading cached chapter', error);
    return null;
  } finally {
    db.close();
  }
}

export async function cacheChapter(abbrev: string, chapter: number, data: ChapterResponse): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;

  try {
    const tx = db.transaction(CHAPTERS_STORE, 'readwrite');
    const store = tx.objectStore(CHAPTERS_STORE);
    const record: CachedChapterRecord = {
      id: chapterCacheId(abbrev, chapter),
      abbrev,
      chapter,
      data,
      updatedAt: Date.now(),
    };
    store.put(record);
    await transactionDone(tx);
  } catch (error) {
    console.warn('Failed caching chapter', error);
  } finally {
    db.close();
  }
}

export async function enqueueProgressSyncEvent(event: Omit<ProgressSyncEvent, 'id'>): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;

  try {
    const tx = db.transaction(PROGRESS_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(PROGRESS_QUEUE_STORE);
    store.add(event);
    await transactionDone(tx);
  } catch (error) {
    console.warn('Failed queueing progress event', error);
  } finally {
    db.close();
  }
}

async function getAllProgressSyncEvents(): Promise<ProgressSyncEvent[]> {
  const db = await openOfflineDb();
  if (!db) return [];

  try {
    const tx = db.transaction(PROGRESS_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(PROGRESS_QUEUE_STORE);
    const events = await requestToPromise(store.getAll()) as ProgressSyncEvent[];
    await transactionDone(tx);
    return events;
  } catch (error) {
    console.warn('Failed reading progress queue', error);
    return [];
  } finally {
    db.close();
  }
}

async function removeProgressSyncEvent(id: number): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;

  try {
    const tx = db.transaction(PROGRESS_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(PROGRESS_QUEUE_STORE);
    store.delete(id);
    await transactionDone(tx);
  } catch (error) {
    console.warn('Failed removing progress event from queue', error);
  } finally {
    db.close();
  }
}

export async function drainProgressSyncQueue(
  processor: (event: ProgressSyncEvent) => Promise<boolean>
): Promise<number> {
  const events = await getAllProgressSyncEvents();
  let processed = 0;

  for (const event of events) {
    const synced = await processor(event);
    if (!synced || event.id == null) continue;
    await removeProgressSyncEvent(event.id);
    processed += 1;
  }

  return processed;
}
