import { bibliaLatinoamericana } from '@/data/biblia-latinoamericana';

interface BibleVerse {
  text: string;
  reference: string;
}

const versePool: BibleVerse[] = [];

for (const book of bibliaLatinoamericana.books) {
  for (const chapter of book.chapters) {
    for (const verse of chapter.verses) {
      versePool.push({
        text: verse.text.trim(),
        reference: `${book.name} ${chapter.number},${verse.number}`,
      });
    }
  }
}

export function getRandomVerse(): BibleVerse {
  const index = Math.floor(Math.random() * versePool.length);
  return versePool[index];
}
