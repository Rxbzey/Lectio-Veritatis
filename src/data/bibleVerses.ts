import { BOOKS_META } from '@/data/biblia/books-meta';
import { loadBookByMeta } from '@/data/biblia/loader';

export interface BibleVerse {
  text: string;
  reference: string;
}

// Elige un libro al azar, carga SOLO ese JSON (chunk perezoso) y
// devuelve un versiculo aleatorio. No toca los otros 72 libros.
export async function getRandomVerse(): Promise<BibleVerse> {
  const meta = BOOKS_META[Math.floor(Math.random() * BOOKS_META.length)];
  const book = await loadBookByMeta(meta);

  const chaptersWithVerses = book.chapters.filter((c) => c.verses.length > 0);
  const chapter = chaptersWithVerses[Math.floor(Math.random() * chaptersWithVerses.length)];
  const verse = chapter.verses[Math.floor(Math.random() * chapter.verses.length)];

  return {
    text: verse.text.trim(),
    reference: `${book.name} ${chapter.number},${verse.number}`,
  };
}
