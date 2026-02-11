const API_BASE = 'https://www.abibliadigital.com.br/api';
const API_TOKEN = import.meta.env.VITE_BIBLIA_TOKEN || '';

// ── In-memory + localStorage cache ──────────────────────────────────
const memoryCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const STORAGE_PREFIX = 'biblia_cache_';

function cacheGet<T>(key: string): T | null {
  // 1. Memory (fastest)
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.ts < CACHE_TTL) return mem.data as T;

  // 2. localStorage (persists across reloads)
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as { data: T; ts: number };
      if (Date.now() - parsed.ts < CACHE_TTL) {
        memoryCache.set(key, parsed); // promote to memory
        return parsed.data;
      }
      localStorage.removeItem(STORAGE_PREFIX + key); // expired
    }
  } catch { /* ignore parse errors */ }

  return null;
}

function cacheSet<T>(key: string, data: T): void {
  const entry = { data, ts: Date.now() };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch { /* quota exceeded — memory cache still works */ }
}

// ── API fetch with automatic caching ────────────────────────────────
interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

async function cachedFetch<T>(cacheKey: string, endpoint: string, options: RequestOptions = {}): Promise<T> {
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<T>(endpoint, options);
  cacheSet(cacheKey, data);
  return data;
}

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

export async function getBooks(): Promise<Book[]> {
  return cachedFetch<Book[]>('books', '/books');
}

export async function getChapter(abbrev: string, chapter: number): Promise<ChapterResponse> {
  return cachedFetch<ChapterResponse>(`chapter:${abbrev}:${chapter}`, `/verses/rvr/${abbrev}/${chapter}`);
}

export async function searchVerses(query: string): Promise<SearchResponse> {
  const normalizedQuery = query.toLowerCase().trim();
  return cachedFetch<SearchResponse>(`search:${normalizedQuery}`, '/verses/search', {
    method: 'POST',
    body: {
      version: 'rvr',
      search: normalizedQuery,
    },
  });
}

export const BOOK_ORDER = [
  'gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr',
  'ed','ne','et','jó','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl',
  'am','ob','jn','mq','na','hc','sf','ag','zc','ml',
  'mt','mc','lc','jo','at','rm','1co','2co','gl','ef','fp','cl','1ts','2ts',
  '1tm','2tm','tt','fm','hb','tg','1pe','2pe','1jo','2jo','3jo','jd','ap'
];

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
