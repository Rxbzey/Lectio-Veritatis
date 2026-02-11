#!/usr/bin/env node

/**
 * Web Scraper — Biblia Latinoamericana
 * 
 * Source: sobicain.org (official publisher — Sociedad Bíblica Católica Internacional)
 * URL pattern: https://www.sobicain.org/biblewebapp/?bid=1&bk={bookId}&cp={chapter}
 * 
 * Usage:
 *   node scripts/scrape-biblia-latinoamericana.js
 * 
 * Output:
 *   data/biblia-latinoamericana.js
 *   data/biblia-latinoamericana.json
 * 
 * Requirements: Node 18+ (uses native fetch, zero external dependencies)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.sobicain.org/biblewebapp/';
const BIBLE_ID = 1; // Biblia Latinoamericana

// ── 73 books — IDs match sobicain.org's bk= parameter ──
const BOOKS = [
  // ── Antiguo Testamento (46 libros) ──
  { id: 1,  name: 'Génesis',                    testament: 'AT' },
  { id: 2,  name: 'Éxodo',                      testament: 'AT' },
  { id: 3,  name: 'Levítico',                   testament: 'AT' },
  { id: 4,  name: 'Números',                    testament: 'AT' },
  { id: 5,  name: 'Deuteronomio',               testament: 'AT' },
  { id: 6,  name: 'Josué',                      testament: 'AT' },
  { id: 7,  name: 'Jueces',                     testament: 'AT' },
  { id: 38, name: 'Rut',                        testament: 'AT' },
  { id: 8,  name: '1 Samuel',                   testament: 'AT' },
  { id: 9,  name: '2 Samuel',                   testament: 'AT' },
  { id: 10, name: '1 Reyes',                    testament: 'AT' },
  { id: 11, name: '2 Reyes',                    testament: 'AT' },
  { id: 12, name: '1 Crónicas',                 testament: 'AT' },
  { id: 13, name: '2 Crónicas',                 testament: 'AT' },
  { id: 14, name: 'Esdras',                     testament: 'AT' },
  { id: 15, name: 'Nehemías',                   testament: 'AT' },
  { id: 41, name: 'Tobías',                     testament: 'AT' },
  { id: 42, name: 'Judit',                      testament: 'AT' },
  { id: 40, name: 'Ester',                      testament: 'AT' },
  { id: 16, name: '1 Macabeos',                 testament: 'AT' },
  { id: 17, name: '2 Macabeos',                 testament: 'AT' },
  { id: 34, name: 'Job',                        testament: 'AT' },
  { id: 46, name: 'Salmos',                     testament: 'AT' },
  { id: 35, name: 'Proverbios',                 testament: 'AT' },
  { id: 36, name: 'Eclesiastés (Qohélet)',      testament: 'AT' },
  { id: 37, name: 'Cantar de los Cantares',     testament: 'AT' },
  { id: 44, name: 'Sabiduría',                  testament: 'AT' },
  { id: 45, name: 'Sirácides (Eclesiástico)',   testament: 'AT' },
  { id: 18, name: 'Isaías',                     testament: 'AT' },
  { id: 19, name: 'Jeremías',                   testament: 'AT' },
  { id: 39, name: 'Lamentaciones',              testament: 'AT' },
  { id: 43, name: 'Baruc',                      testament: 'AT' },
  { id: 20, name: 'Ezequiel',                   testament: 'AT' },
  { id: 33, name: 'Daniel',                     testament: 'AT' },
  { id: 21, name: 'Oseas',                      testament: 'AT' },
  { id: 22, name: 'Joel',                       testament: 'AT' },
  { id: 23, name: 'Amós',                       testament: 'AT' },
  { id: 24, name: 'Abdías',                     testament: 'AT' },
  { id: 25, name: 'Jonás',                      testament: 'AT' },
  { id: 26, name: 'Miqueas',                    testament: 'AT' },
  { id: 27, name: 'Nahúm',                      testament: 'AT' },
  { id: 28, name: 'Habacuc',                    testament: 'AT' },
  { id: 29, name: 'Sofonías',                   testament: 'AT' },
  { id: 30, name: 'Ageo',                       testament: 'AT' },
  { id: 31, name: 'Zacarías',                   testament: 'AT' },
  { id: 32, name: 'Malaquías',                  testament: 'AT' },

  // ── Nuevo Testamento (27 libros) ──
  { id: 47, name: 'Mateo',                      testament: 'NT' },
  { id: 48, name: 'Marcos',                     testament: 'NT' },
  { id: 49, name: 'Lucas',                      testament: 'NT' },
  { id: 50, name: 'Juan',                       testament: 'NT' },
  { id: 51, name: 'Hechos de los Apóstoles',    testament: 'NT' },
  { id: 52, name: 'Romanos',                    testament: 'NT' },
  { id: 53, name: '1 Corintios',                testament: 'NT' },
  { id: 54, name: '2 Corintios',                testament: 'NT' },
  { id: 55, name: 'Gálatas',                    testament: 'NT' },
  { id: 56, name: 'Efesios',                    testament: 'NT' },
  { id: 57, name: 'Filipenses',                 testament: 'NT' },
  { id: 58, name: 'Colosenses',                 testament: 'NT' },
  { id: 60, name: '1 Tesalonicenses',           testament: 'NT' },
  { id: 61, name: '2 Tesalonicenses',           testament: 'NT' },
  { id: 62, name: '1 Timoteo',                  testament: 'NT' },
  { id: 63, name: '2 Timoteo',                  testament: 'NT' },
  { id: 64, name: 'Tito',                       testament: 'NT' },
  { id: 59, name: 'Filemón',                    testament: 'NT' },
  { id: 65, name: 'Hebreos',                    testament: 'NT' },
  { id: 66, name: 'Santiago',                   testament: 'NT' },
  { id: 67, name: '1 Pedro',                    testament: 'NT' },
  { id: 68, name: '2 Pedro',                    testament: 'NT' },
  { id: 70, name: '1 Juan',                     testament: 'NT' },
  { id: 71, name: '2 Juan',                     testament: 'NT' },
  { id: 72, name: '3 Juan',                     testament: 'NT' },
  { id: 69, name: 'Judas',                      testament: 'NT' },
  { id: 73, name: 'Apocalipsis',                testament: 'NT' },
];

// ── Helpers ──

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

/**
 * Fetch a page from sobicain.org and return the raw HTML.
 */
async function fetchPage(bookId, chapter, retries = 3) {
  const url = `${BASE_URL}?bid=${BIBLE_ID}&bk=${bookId}&cp=${chapter}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-MX,es;q=0.9',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000 * attempt);
    }
  }
}

/**
 * Get the number of chapters for a book by reading the chapter <select>.
 */
function getChapterCount(html, bookId) {
  const chapSelect = html.match(/<select class="bwa-chapter-select">([\s\S]*?)<\/select>/i);
  if (!chapSelect) return 0;
  const chapters = [...chapSelect[1].matchAll(new RegExp(`value="C_${BIBLE_ID}_${bookId}_(\\d+)"`, 'g'))];
  // Also count CI_ entries (intro chapters count as chapter)
  const introChapters = [...chapSelect[1].matchAll(new RegExp(`value="CI_${BIBLE_ID}_${bookId}"`, 'g'))];
  return chapters.length + introChapters.length;
}

/**
 * Parse verses from the HTML.
 * 
 * Structure:
 *   <span class="versetext" id="V_{bid}_{bk}_{cp}_{verse}">
 *     <span class="versenumber"><sup>N</sup></span> Verse text...
 *   </span>
 */
function parseVerses(html) {
  const verses = [];
  const seen = new Set();

  // Match each versetext span
  const verseSpans = [...html.matchAll(/<span[^>]*class="versetext"[^>]*id="V_\d+_\d+_\d+_(\d+)"[^>]*>([\s\S]*?)(?=<span[^>]*class="versetext"|<\/p>|<p>|<h4|$)/gi)];

  for (const match of verseSpans) {
    const num = parseInt(match[1], 10);
    if (num < 1 || num > 200 || seen.has(num)) continue;

    // Strip HTML tags, keeping text content
    let text = match[2]
      .replace(/<span class="versenumber">.*?<\/span>/gi, '') // remove verse number
      .replace(/<span class="lexs"[^>]*>.*?<\/span>/gi, '')   // remove lexicon refs
      .replace(/<span class="notes"[^>]*>.*?<\/span>/gi, '')   // remove note refs
      .replace(/<span class="refs"[^>]*>.*?<\/span>/gi, '')    // remove cross refs
      .replace(/<[^>]+>/g, '')                                  // strip remaining tags
      .replace(/\s+/g, ' ')
      .trim();

    text = decodeEntities(text);
    if (text.length < 1) continue;

    seen.add(num);
    verses.push({ number: num, text });
  }

  verses.sort((a, b) => a.number - b.number);
  return verses;
}

// ── Main ──

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Biblia Latinoamericana — Web Scraper                 ║');
  console.log('║  Fuente: sobicain.org (editor oficial)                ║');
  console.log('║  73 libros · Zero dependencias · Node 18+            ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log();

  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const progressPath = path.join(outDir, 'biblia-latinoamericana-progress.json');
  let bible;
  let startBookIdx = 0;

  // Resume from progress if available
  if (fs.existsSync(progressPath)) {
    try {
      bible = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      startBookIdx = bible.books.length;
      if (startBookIdx < BOOKS.length) {
        console.log(`🔄 Reanudando desde libro ${startBookIdx + 1} (${BOOKS[startBookIdx]?.name})`);
        console.log();
      }
    } catch {
      bible = null;
    }
  }

  if (!bible) {
    bible = {
      version: 'Biblia Latinoamericana',
      language: 'es',
      source: 'sobicain.org',
      scrapedAt: new Date().toISOString(),
      books: [],
    };
  }

  let totalChaptersDone = bible.books.reduce((sum, b) => sum + b.chapters.length, 0);

  for (let bookIdx = startBookIdx; bookIdx < BOOKS.length; bookIdx++) {
    const bookDef = BOOKS[bookIdx];

    // Fetch first chapter to discover total chapter count
    let firstHtml;
    try {
      firstHtml = await fetchPage(bookDef.id, 1);
    } catch (err) {
      console.error(`  ✗ Could not load ${bookDef.name}: ${err.message}`);
      continue;
    }

    const totalChapters = getChapterCount(firstHtml, bookDef.id) || 1;

    const bookData = {
      id: bookDef.id,
      name: bookDef.name,
      testament: bookDef.testament,
      chapters: [],
    };

    console.log(`📗 [${bookIdx + 1}/${BOOKS.length}] ${bookDef.name} (${totalChapters} capítulos)`);

    for (let ch = 1; ch <= totalChapters; ch++) {
      let html;
      if (ch === 1) {
        html = firstHtml; // reuse already fetched
      } else {
        try {
          html = await fetchPage(bookDef.id, ch);
        } catch (err) {
          console.error(`  ✗ Cap. ${ch}: ${err.message}`);
          bookData.chapters.push({ number: ch, verses: [] });
          continue;
        }
      }

      const verses = parseVerses(html);
      totalChaptersDone++;

      bookData.chapters.push({ number: ch, verses });

      process.stdout.write(`  Cap. ${ch}/${totalChapters} — ${verses.length} versículos\r`);

      // Rate limit: ~1s between requests
      if (ch < totalChapters) await sleep(700 + Math.random() * 300);
    }

    const totalBookVerses = bookData.chapters.reduce((s, c) => s + c.verses.length, 0);
    console.log(`  ✓ ${bookDef.name} — ${totalChapters} cap., ${totalBookVerses} versículos          `);

    bible.books.push(bookData);

    // Save progress after each book
    fs.writeFileSync(progressPath, JSON.stringify(bible, null, 2), 'utf-8');

    // Small pause between books
    await sleep(500);
  }

  // ── Write final files ──
  const totalVerses = bible.books.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0), 0
  );
  const totalChaps = bible.books.reduce((sum, b) => sum + b.chapters.length, 0);

  const jsContent = `// Biblia Latinoamericana — Scraped ${new Date().toISOString()}
// Fuente: sobicain.org (Sociedad Bíblica Católica Internacional)
// ${bible.books.length} libros, ${totalChaps} capítulos, ${totalVerses} versículos
// Auto-generated — do not edit manually

export const bibliaLatinoamericana = ${JSON.stringify(bible, null, 2)};

export default bibliaLatinoamericana;
`;

  const outPath = path.join(outDir, 'biblia-latinoamericana.js');
  fs.writeFileSync(outPath, jsContent, 'utf-8');

  const jsonPath = path.join(outDir, 'biblia-latinoamericana.json');
  fs.writeFileSync(jsonPath, JSON.stringify(bible, null, 2), 'utf-8');

  // Clean up progress file
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);

  console.log();
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ ¡Completado!`);
  console.log(`   📄 JS:   ${outPath}`);
  console.log(`   📄 JSON: ${jsonPath}`);
  console.log(`   📖 ${bible.books.length} libros`);
  console.log(`   📑 ${totalChaps} capítulos`);
  console.log(`   ✏️  ${totalVerses} versículos`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
