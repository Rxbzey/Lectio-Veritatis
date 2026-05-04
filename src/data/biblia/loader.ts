// Loader perezoso de libros. Cada JSON vive en src/data/biblia/*.json.
// Vite usa import.meta.glob para crear un chunk lazy POR cada archivo,
// por lo que el bundle inicial no incluye ningun versiculo.
//
// Forma del JSON crudo (tal como lo genera scripts/scrape_biblia.py):
//   { bid, bk, nombre, capitulos: { "<cp>": { "<vs>": "texto" } } }
//
// Normalizamos a:
//   { id, name, testament, chapters: [{ number, verses: [{ number, text }] }] }
//
// Tambien limpiamos un artefacto del scraper: algunos versiculos tienen
// el numero como prefijo dentro del texto (ej. "1 En el principio..."),
// lo removemos cuando coincide con el numero del versiculo.

import { BOOKS_META, slugifyBookName, type BookMeta } from './books-meta';

export interface LocalChapter {
  number: number;
  verses: { number: number; text: string }[];
}

export interface LocalBook {
  id: number;
  name: string;
  testament: 'AT' | 'NT';
  chapters: LocalChapter[];
}

interface RawBookJson {
  bid: number;
  bk: number;
  nombre: string;
  capitulos: Record<string, Record<string, string>>;
}

// Glob perezoso (eager: false). Los keys son las rutas relativas.
const bookLoaders = import.meta.glob<{ default: RawBookJson }>('./*.json');

// Indice por slug → BookMeta y por filename → loader.
const metaBySlug = new Map<string, BookMeta>();
const metaById = new Map<number, BookMeta>();
for (const meta of BOOKS_META) {
  metaBySlug.set(slugifyBookName(meta.name), meta);
  metaById.set(meta.id, meta);
}

const cache = new Map<string, Promise<LocalBook>>();

function resolveLoader(file: string): () => Promise<{ default: RawBookJson }> {
  const key = `./${file}`;
  const loader = bookLoaders[key];
  if (!loader) {
    throw new Error(`Archivo de libro no encontrado por import.meta.glob: ${key}`);
  }
  return loader;
}

function stripLeadingVerseNumber(raw: string, verseNumber: number): string {
  // Ej: "1 En el principio..." con verseNumber=1 → "En el principio..."
  const prefix = new RegExp(`^\\s*${verseNumber}\\s+`);
  return raw.replace(prefix, '').replace(/\s+/g, ' ').trim();
}

function normalize(meta: BookMeta, raw: RawBookJson): LocalBook {
  const chapters: LocalChapter[] = Object.keys(raw.capitulos)
    .map((cp) => Number(cp))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
    .map((cpNum) => {
      const versesObj = raw.capitulos[String(cpNum)] || {};
      const verses = Object.keys(versesObj)
        .map((vs) => Number(vs))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
        .map((vsNum) => ({
          number: vsNum,
          text: stripLeadingVerseNumber(versesObj[String(vsNum)] ?? '', vsNum),
        }));
      return { number: cpNum, verses };
    });

  return {
    id: meta.id,
    name: meta.name,
    testament: meta.testament,
    chapters,
  };
}

export function listBooks(): BookMeta[] {
  return BOOKS_META;
}

export function getBookMetaBySlug(slug: string): BookMeta | undefined {
  return metaBySlug.get(slug);
}

export function getBookMetaById(id: number): BookMeta | undefined {
  return metaById.get(id);
}

export function loadBookBySlug(slug: string): Promise<LocalBook> {
  const meta = metaBySlug.get(slug);
  if (!meta) throw new Error(`Libro no encontrado: ${slug}`);
  return loadBookByMeta(meta);
}

export function loadBookByMeta(meta: BookMeta): Promise<LocalBook> {
  const key = meta.file;
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = resolveLoader(meta.file)().then((mod) => normalize(meta, mod.default));
  cache.set(key, promise);
  return promise;
}

export async function loadAllBooks(): Promise<LocalBook[]> {
  return Promise.all(BOOKS_META.map((m) => loadBookByMeta(m)));
}
