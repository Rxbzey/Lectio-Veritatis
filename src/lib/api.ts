import {
  cacheBooks,
  cacheChapter,
  readCachedBooks,
  readCachedChapter,
} from '@/storage/offlineBibleCache';
import { BOOKS_META, slugifyBookName, type BookMeta } from '@/data/biblia/books-meta';
import {
  loadBookBySlug,
  loadAllBooks,
  type LocalBook,
} from '@/data/biblia/loader';

// ── Types (kept compatible with previous API shape) ─────────────────

export interface Book {
  abbrev: { pt: string; en: string };
  author: string;
  chapters: number;
  group: string;
  name: string;
  testament: string;
}

export interface VerseData {
  number: number;
  text: string;
}

export interface ChapterResponse {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: VerseData[];
}

export interface SearchResult {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
  };
  chapter: number;
  number: number;
  text: string;
}

interface SearchResponse {
  occurrence: number;
  version: string;
  verses: SearchResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function slugify(name: string): string {
  return slugifyBookName(name);
}

function testamentGroup(testament: string): { group: string; author: string } {
  return testament === 'AT'
    ? { group: 'Antiguo Testamento', author: '' }
    : { group: 'Nuevo Testamento', author: '' };
}

function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Orden canonico de slugs (para navegacion siguiente-libro).
const BOOK_ORDER: string[] = BOOKS_META.map((m) => slugifyBookName(m.name));

// ── Construccion de respuestas ──────────────────────────────────────

function buildBookFromMeta(meta: BookMeta): Book {
  const slug = slugifyBookName(meta.name);
  const { group } = testamentGroup(meta.testament);
  return {
    abbrev: { pt: slug, en: slug },
    author: '',
    chapters: meta.chapters,
    group,
    name: meta.name,
    testament: meta.testament === 'AT' ? 'VT' : 'NT',
  };
}

function buildChapterFromLocalBook(
  book: LocalBook,
  abbrev: string,
  chapterNumber: number
): ChapterResponse {
  const ch = book.chapters.find((c) => c.number === chapterNumber);
  if (!ch) throw new Error(`Capítulo ${chapterNumber} no encontrado en ${book.name}`);

  const { group, author } = testamentGroup(book.testament);

  return {
    book: {
      abbrev: { pt: abbrev, en: abbrev },
      name: book.name,
      author,
      group,
      version: 'Biblia Latinoamericana',
    },
    chapter: {
      number: ch.number,
      // Preservamos el comportamiento previo (total de capitulos del libro).
      verses: book.chapters.length,
    },
    verses: ch.verses.map((v) => ({ number: v.number, text: v.text })),
  };
}

// ── Public API ──────────────────────────────────────────────────────

export async function getBooks(): Promise<Book[]> {
  const cachedBooks = await readCachedBooks();
  if (cachedBooks && cachedBooks.length > 0) {
    return cachedBooks;
  }

  const books = BOOKS_META.map(buildBookFromMeta);
  void cacheBooks(books);
  return books;
}

export async function getChapter(abbrev: string, chapter: number): Promise<ChapterResponse> {
  const cachedChapter = await readCachedChapter(abbrev, chapter);
  if (cachedChapter) {
    return cachedChapter;
  }

  const book = await loadBookBySlug(abbrev);
  const chapterData = buildChapterFromLocalBook(book, abbrev, chapter);
  void cacheChapter(abbrev, chapter, chapterData);
  return chapterData;
}

export async function warmOfflineBooksCache(): Promise<void> {
  const books = BOOKS_META.map(buildBookFromMeta);
  await cacheBooks(books);
}

interface WarmOfflineChaptersOptions {
  signal?: AbortSignal;
  batchSize?: number;
  onProgress?: (payload: {
    processedChapters: number;
    totalChapters: number;
    bookSlug: string;
    chapterNumber: number;
  }) => void;
}

export async function warmOfflineChaptersCache(options?: WarmOfflineChaptersOptions): Promise<void> {
  const totalChapters = BOOKS_META.reduce((sum, m) => sum + m.chapters, 0);
  const batchSize = Math.max(1, options?.batchSize ?? 8);
  let processedChapters = 0;

  for (const meta of BOOKS_META) {
    if (options?.signal?.aborted) return;

    const slug = slugifyBookName(meta.name);
    // Cargamos el libro UNA vez (chunk lazy) y cacheamos cada capitulo en IDB.
    const book = await loadBookBySlug(slug);

    for (const chapterInfo of book.chapters) {
      if (options?.signal?.aborted) return;

      const cachedChapter = await readCachedChapter(slug, chapterInfo.number);
      if (!cachedChapter) {
        const chapterData = buildChapterFromLocalBook(book, slug, chapterInfo.number);
        await cacheChapter(slug, chapterInfo.number, chapterData);
      }

      processedChapters += 1;
      options?.onProgress?.({
        processedChapters,
        totalChapters,
        bookSlug: slug,
        chapterNumber: chapterInfo.number,
      });

      if (processedChapters % batchSize === 0) {
        await waitForNextTick();
      }
    }
  }
}

export async function searchVerses(query: string): Promise<SearchResponse> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return { occurrence: 0, version: 'Biblia Latinoamericana', verses: [] };
  }

  // searchVerses obliga a tener todos los libros en memoria. Los cargamos
  // bajo demanda (la primera busqueda dispara las 73 descargas lazy).
  const allBooks = await loadAllBooks();
  const results: SearchResult[] = [];

  outer: for (const book of allBooks) {
    const slug = slugify(book.name);
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(normalizedQuery)) {
          results.push({
            book: { abbrev: { pt: slug, en: slug }, name: book.name },
            chapter: ch.number,
            number: v.number,
            text: v.text,
          });
          if (results.length >= 80) break outer;
        }
      }
    }
  }

  return {
    occurrence: results.length,
    version: 'Biblia Latinoamericana',
    verses: results,
  };
}

export function getNextChapter(abbrev: string, chapter: number, totalChapters: number): { abbrev: string; chapter: number } | null {
  if (chapter < totalChapters) {
    return { abbrev, chapter: chapter + 1 };
  }
  const idx = BOOK_ORDER.indexOf(abbrev);
  if (idx >= 0 && idx < BOOK_ORDER.length - 1) {
    return { abbrev: BOOK_ORDER[idx + 1], chapter: 1 };
  }
  return null;
}
