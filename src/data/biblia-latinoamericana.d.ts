export declare const bibliaLatinoamericana: {
  version: string;
  language: string;
  source: string;
  scrapedAt: string;
  books: {
    id: number;
    name: string;
    testament: string;
    chapters: {
      number: number;
      verses: {
        number: number;
        text: string;
      }[];
    }[];
  }[];
};

export default bibliaLatinoamericana;
