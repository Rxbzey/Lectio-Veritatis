import { useEffect, useState } from 'react';
import { getBooks, type Book } from '@/lib/api';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooks().then(setBooks).catch(console.error);
  }, []);

  return books;
}
