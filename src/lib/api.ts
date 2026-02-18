import {
  cacheBooks,
  cacheChapter,
  readCachedBooks,
  readCachedChapter,
} from '@/storage/offlineBibleCache';

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

// ── Helpers: generate stable slug from book name ────────────────────

function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Build lookup structures from local data ─────────────────────────

interface LocalBook {
  id: number;
  name: string;
  testament: string;
  chapters: { number: number; verses: { number: number; text: string }[] }[];
}

interface BibleDataset {
  localBooks: LocalBook[];
  slugToBook: Map<string, LocalBook>;
  bookSlugs: string[];
}

let datasetPromise: Promise<BibleDataset> | null = null;
const BOOK_ORDER: string[] = [];

function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function getBibleDataset(): Promise<BibleDataset> {
  if (!datasetPromise) {
    datasetPromise = (async () => {
      const { bibliaLatinoamericana } = await import('../data/biblia-latinoamericana');
      const localBooks = bibliaLatinoamericana.books as LocalBook[];

      const slugToBook = new Map<string, LocalBook>();
      const bookSlugs: string[] = [];

      for (const book of localBooks) {
        const slug = slugify(book.name);
        slugToBook.set(slug, book);
        bookSlugs.push(slug);
      }

      if (BOOK_ORDER.length === 0) {
        BOOK_ORDER.push(...bookSlugs);
      }

      return {
        localBooks,
        slugToBook,
        bookSlugs,
      };
    })();
  }

  return datasetPromise;
}

function testamentGroup(testament: string): { group: string; author: string } {
  return testament === 'AT'
    ? { group: 'Antiguo Testamento', author: '' }
    : { group: 'Nuevo Testamento', author: '' };
}

// ── Public API (same signatures, zero network calls) ────────────────

function buildBooksFromLocalData(localBooks: LocalBook[]): Book[] {
  return localBooks.map((b) => {
    const slug = slugify(b.name);
    const { group } = testamentGroup(b.testament);
    return {
      abbrev: { pt: slug, en: slug },
      author: '',
      chapters: b.chapters.length,
      group,
      name: b.name,
      testament: b.testament === 'AT' ? 'VT' : 'NT',
    };
  });
}

function buildChapterFromLocalData(
  slugToBook: Map<string, LocalBook>,
  abbrev: string,
  chapter: number
): ChapterResponse {
  const book = slugToBook.get(abbrev);
  if (!book) throw new Error(`Libro no encontrado: ${abbrev}`);

  const ch = book.chapters.find((currentChapter) => currentChapter.number === chapter);
  if (!ch) throw new Error(`Capítulo ${chapter} no encontrado en ${book.name}`);

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
      verses: book.chapters.length,
    },
    verses: ch.verses.map((verse) => ({ number: verse.number, text: verse.text })),
  };
}

export async function getBooks(): Promise<Book[]> {
  const cachedBooks = await readCachedBooks();
  if (cachedBooks && cachedBooks.length > 0) {
    return cachedBooks;
  }

  const { localBooks } = await getBibleDataset();
  const books = buildBooksFromLocalData(localBooks);
  void cacheBooks(books);
  return books;
}

export async function getChapter(abbrev: string, chapter: number): Promise<ChapterResponse> {
  const cachedChapter = await readCachedChapter(abbrev, chapter);
  if (cachedChapter) {
    return cachedChapter;
  }

  const { slugToBook } = await getBibleDataset();
  const chapterData = buildChapterFromLocalData(slugToBook, abbrev, chapter);
  void cacheChapter(abbrev, chapter, chapterData);
  return chapterData;
}

export async function warmOfflineBooksCache(): Promise<void> {
  const { localBooks } = await getBibleDataset();
  const books = buildBooksFromLocalData(localBooks);
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
  const { slugToBook } = await getBibleDataset();
  const entries = Array.from(slugToBook.entries());
  const totalChapters = entries.reduce((sum, [, book]) => sum + book.chapters.length, 0);
  const batchSize = Math.max(1, options?.batchSize ?? 8);
  let processedChapters = 0;

  for (const [slug, book] of entries) {
    if (options?.signal?.aborted) return;

    for (const chapterInfo of book.chapters) {
      if (options?.signal?.aborted) return;

      const cachedChapter = await readCachedChapter(slug, chapterInfo.number);
      if (!cachedChapter) {
        const chapterData = buildChapterFromLocalData(slugToBook, slug, chapterInfo.number);
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
  const { localBooks } = await getBibleDataset();
  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const book of localBooks) {
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
          if (results.length >= 80) break;
        }
      }
      if (results.length >= 80) break;
    }
    if (results.length >= 80) break;
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
