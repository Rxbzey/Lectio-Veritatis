import { bibliaLatinoamericana } from '../data/biblia-latinoamericana';

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

export interface SearchResponse {
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

const localBooks = bibliaLatinoamericana.books as LocalBook[];

// Map slug → local book for fast lookups
const slugToBook = new Map<string, LocalBook>();
const bookSlugs: string[] = [];

for (const book of localBooks) {
  const slug = slugify(book.name);
  slugToBook.set(slug, book);
  bookSlugs.push(slug);
}

function testamentGroup(testament: string): { group: string; author: string } {
  return testament === 'AT'
    ? { group: 'Antiguo Testamento', author: '' }
    : { group: 'Nuevo Testamento', author: '' };
}

// ── Public API (same signatures, zero network calls) ────────────────

export async function getBooks(): Promise<Book[]> {
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

export async function getChapter(abbrev: string, chapter: number): Promise<ChapterResponse> {
  const book = slugToBook.get(abbrev);
  if (!book) throw new Error(`Libro no encontrado: ${abbrev}`);

  const ch = book.chapters.find((c) => c.number === chapter);
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
      verses: book.chapters.length, // total chapters (used by getNextChapter)
    },
    verses: ch.verses.map((v) => ({ number: v.number, text: v.text })),
  };
}

export async function searchVerses(query: string): Promise<SearchResponse> {
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

export const BOOK_ORDER = bookSlugs;

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
