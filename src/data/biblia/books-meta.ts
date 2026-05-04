// Metadata de los 73 libros de la Biblia Latinoamericana.
// Orden canonico Vulgata (igual al que tenia el dataset monolitico previo),
// para no romper slugs ni el orden en la UI.
// `file` apunta al nombre del JSON generado por el scraper
// (scripts/scrape_biblia.py) y copiado a src/data/biblia/*.json.

export type Testament = 'AT' | 'NT';

export interface BookMeta {
  id: number;              // posicion canonica (1..73)
  name: string;            // nombre con acentos para mostrar
  testament: Testament;
  chapters: number;        // total de capitulos (para no tener que cargar el JSON)
  file: string;            // nombre de archivo JSON dentro de src/data/biblia/
}

export const BOOKS_META: BookMeta[] = [
  // ── Antiguo Testamento ────────────────────────────────────────────
  { id: 1,  name: 'Génesis',                   testament: 'AT', chapters: 50,  file: '01_Genesis.json' },
  { id: 2,  name: 'Éxodo',                     testament: 'AT', chapters: 40,  file: '02_Exodo.json' },
  { id: 3,  name: 'Levítico',                  testament: 'AT', chapters: 27,  file: '03_Levitico.json' },
  { id: 4,  name: 'Números',                   testament: 'AT', chapters: 36,  file: '04_Numeros.json' },
  { id: 5,  name: 'Deuteronomio',              testament: 'AT', chapters: 34,  file: '05_Deuteronomio.json' },
  { id: 6,  name: 'Josué',                     testament: 'AT', chapters: 24,  file: '06_Josue.json' },
  { id: 7,  name: 'Jueces',                    testament: 'AT', chapters: 21,  file: '07_Jueces.json' },
  { id: 8,  name: 'Rut',                       testament: 'AT', chapters: 4,   file: '38_Rut.json' },
  { id: 9,  name: '1 Samuel',                  testament: 'AT', chapters: 31,  file: '08_1Samuel.json' },
  { id: 10, name: '2 Samuel',                  testament: 'AT', chapters: 24,  file: '09_2Samuel.json' },
  { id: 11, name: '1 Reyes',                   testament: 'AT', chapters: 22,  file: '10_1Reyes.json' },
  { id: 12, name: '2 Reyes',                   testament: 'AT', chapters: 25,  file: '11_2Reyes.json' },
  { id: 13, name: '1 Crónicas',                testament: 'AT', chapters: 29,  file: '12_1Cronicas.json' },
  { id: 14, name: '2 Crónicas',                testament: 'AT', chapters: 36,  file: '13_2Cronicas.json' },
  { id: 15, name: 'Esdras',                    testament: 'AT', chapters: 10,  file: '14_Esdras.json' },
  { id: 16, name: 'Nehemías',                  testament: 'AT', chapters: 13,  file: '15_Nehemias.json' },
  { id: 17, name: 'Tobías',                    testament: 'AT', chapters: 14,  file: '41_Tobias.json' },
  { id: 18, name: 'Judit',                     testament: 'AT', chapters: 16,  file: '42_Judit.json' },
  { id: 19, name: 'Ester',                     testament: 'AT', chapters: 16,  file: '40_Ester.json' },
  { id: 20, name: '1 Macabeos',                testament: 'AT', chapters: 16,  file: '16_1Macabeos.json' },
  { id: 21, name: '2 Macabeos',                testament: 'AT', chapters: 15,  file: '17_2Macabeos.json' },
  { id: 22, name: 'Job',                       testament: 'AT', chapters: 41,  file: '34_Job.json' },
  { id: 23, name: 'Salmos',                    testament: 'AT', chapters: 150, file: '46_Salmos.json' },
  { id: 24, name: 'Proverbios',                testament: 'AT', chapters: 31,  file: '35_Proverbios.json' },
  { id: 25, name: 'Eclesiastés (Qohélet)',     testament: 'AT', chapters: 12,  file: '36_Qohelet.json' },
  { id: 26, name: 'Cantar de los Cantares',    testament: 'AT', chapters: 8,   file: '37_Cantar_de_los_Cantares.json' },
  { id: 27, name: 'Sabiduría',                 testament: 'AT', chapters: 18,  file: '44_Sabiduria.json' },
  { id: 28, name: 'Sirácides (Eclesiástico)',  testament: 'AT', chapters: 51,  file: '45_Siracides.json' },
  { id: 29, name: 'Isaías',                    testament: 'AT', chapters: 66,  file: '18_Isaias.json' },
  { id: 30, name: 'Jeremías',                  testament: 'AT', chapters: 52,  file: '19_Jeremias.json' },
  { id: 31, name: 'Lamentaciones',             testament: 'AT', chapters: 5,   file: '39_Lamentaciones.json' },
  { id: 32, name: 'Baruc',                     testament: 'AT', chapters: 6,   file: '43_Baruc.json' },
  { id: 33, name: 'Ezequiel',                  testament: 'AT', chapters: 48,  file: '20_Ezequiel.json' },
  { id: 34, name: 'Daniel',                    testament: 'AT', chapters: 14,  file: '33_Daniel.json' },
  { id: 35, name: 'Oseas',                     testament: 'AT', chapters: 14,  file: '21_Oseas.json' },
  { id: 36, name: 'Joel',                      testament: 'AT', chapters: 4,   file: '22_Joel.json' },
  { id: 37, name: 'Amós',                      testament: 'AT', chapters: 9,   file: '23_Amos.json' },
  { id: 38, name: 'Abdías',                    testament: 'AT', chapters: 1,   file: '24_Abdias.json' },
  { id: 39, name: 'Jonás',                     testament: 'AT', chapters: 4,   file: '25_Jonas.json' },
  { id: 40, name: 'Miqueas',                   testament: 'AT', chapters: 7,   file: '26_Miqueas.json' },
  { id: 41, name: 'Nahúm',                     testament: 'AT', chapters: 3,   file: '27_Nahum.json' },
  { id: 42, name: 'Habacuc',                   testament: 'AT', chapters: 3,   file: '28_Habacuq.json' },
  { id: 43, name: 'Sofonías',                  testament: 'AT', chapters: 3,   file: '29_Sofonias.json' },
  { id: 44, name: 'Ageo',                      testament: 'AT', chapters: 2,   file: '30_Ageo.json' },
  { id: 45, name: 'Zacarías',                  testament: 'AT', chapters: 14,  file: '31_Zacarias.json' },
  { id: 46, name: 'Malaquías',                 testament: 'AT', chapters: 3,   file: '32_Malaquias.json' },
  // ── Nuevo Testamento ──────────────────────────────────────────────
  { id: 47, name: 'Mateo',                     testament: 'NT', chapters: 28,  file: '47_Mateo.json' },
  { id: 48, name: 'Marcos',                    testament: 'NT', chapters: 16,  file: '48_Marcos.json' },
  { id: 49, name: 'Lucas',                     testament: 'NT', chapters: 24,  file: '49_Lucas.json' },
  { id: 50, name: 'Juan',                      testament: 'NT', chapters: 21,  file: '50_Juan.json' },
  { id: 51, name: 'Hechos de los Apóstoles',   testament: 'NT', chapters: 28,  file: '51_Hechos.json' },
  { id: 52, name: 'Romanos',                   testament: 'NT', chapters: 16,  file: '52_Romanos.json' },
  { id: 53, name: '1 Corintios',               testament: 'NT', chapters: 16,  file: '53_1Corintios.json' },
  { id: 54, name: '2 Corintios',               testament: 'NT', chapters: 13,  file: '54_2Corintios.json' },
  { id: 55, name: 'Gálatas',                   testament: 'NT', chapters: 6,   file: '55_Galatas.json' },
  { id: 56, name: 'Efesios',                   testament: 'NT', chapters: 6,   file: '56_Efesios.json' },
  { id: 57, name: 'Filipenses',                testament: 'NT', chapters: 4,   file: '57_Filipenses.json' },
  { id: 58, name: 'Colosenses',                testament: 'NT', chapters: 4,   file: '58_Colosenses.json' },
  { id: 59, name: '1 Tesalonicenses',          testament: 'NT', chapters: 5,   file: '60_1Tesalonicenses.json' },
  { id: 60, name: '2 Tesalonicenses',          testament: 'NT', chapters: 3,   file: '61_2Tesalonicenses.json' },
  { id: 61, name: '1 Timoteo',                 testament: 'NT', chapters: 6,   file: '62_1Timoteo.json' },
  { id: 62, name: '2 Timoteo',                 testament: 'NT', chapters: 4,   file: '63_2Timoteo.json' },
  { id: 63, name: 'Tito',                      testament: 'NT', chapters: 3,   file: '64_Tito.json' },
  { id: 64, name: 'Filemón',                   testament: 'NT', chapters: 1,   file: '59_Filemon.json' },
  { id: 65, name: 'Hebreos',                   testament: 'NT', chapters: 13,  file: '65_Hebreos.json' },
  { id: 66, name: 'Santiago',                  testament: 'NT', chapters: 5,   file: '66_Santiago.json' },
  { id: 67, name: '1 Pedro',                   testament: 'NT', chapters: 5,   file: '67_1Pedro.json' },
  { id: 68, name: '2 Pedro',                   testament: 'NT', chapters: 3,   file: '68_2Pedro.json' },
  { id: 69, name: '1 Juan',                    testament: 'NT', chapters: 5,   file: '70_1Juan.json' },
  { id: 70, name: '2 Juan',                    testament: 'NT', chapters: 1,   file: '71_2Juan.json' },
  { id: 71, name: '3 Juan',                    testament: 'NT', chapters: 1,   file: '72_3Juan.json' },
  { id: 72, name: 'Judas',                     testament: 'NT', chapters: 1,   file: '69_Judas.json' },
  { id: 73, name: 'Apocalipsis',               testament: 'NT', chapters: 22,  file: '73_Apocalipsis.json' },
];

export function slugifyBookName(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
