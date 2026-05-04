"""
Scraper de la Biblia Latinoamericana desde sobicain.org/bibleapp.

URL:
    https://sobicain.org/bibleapp/?bid=1&bk=<libro>&cp=<capitulo>&vs=1

Estructura HTML relevante (verificada en la pagina real):
    - Versiculos: <span class="versetext" id="V_<bid>_<bk>_<cp>_<vs>"> texto </span>
      Un mismo versiculo puede tener varios <span> con el MISMO id
      (continuacion del texto). Se concatenan en orden de aparicion.
    - Fin del libro: cuando el HTML NO contiene el enlace
      <a class="next-chapter" href="..."> dejamos de avanzar capitulos.

Salida:
    output/biblia/<bk>_<slug>.json     -> un JSON por libro
    output/biblia/biblia_completa.json -> todo unificado

Uso:
    python scripts/scrape_biblia.py
    python scripts/scrape_biblia.py --start-bk 35 --end-bk 35   # solo Proverbios
    python scripts/scrape_biblia.py --delay 0.4 --workers 4
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://sobicain.org/bibleapp/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}

# id="V_<bid>_<bk>_<cp>_<vs>"
VERSE_ID_RE = re.compile(r"^V_(\d+)_(\d+)_(\d+)_(\d+)$")

# Mapeo OFICIAL extraido del <select> de libros del propio sitio (bid=1).
# IMPORTANTE: este orden NO es el de la Vulgata; es el que usa la API.
BOOK_NAMES: Dict[int, str] = {
    1:  "Genesis",
    2:  "Exodo",
    3:  "Levitico",
    4:  "Numeros",
    5:  "Deuteronomio",
    6:  "Josue",
    7:  "Jueces",
    8:  "1Samuel",
    9:  "2Samuel",
    10: "1Reyes",
    11: "2Reyes",
    12: "1Cronicas",
    13: "2Cronicas",
    14: "Esdras",
    15: "Nehemias",
    16: "1Macabeos",
    17: "2Macabeos",
    18: "Isaias",
    19: "Jeremias",
    20: "Ezequiel",
    21: "Oseas",
    22: "Joel",
    23: "Amos",
    24: "Abdias",
    25: "Jonas",
    26: "Miqueas",
    27: "Nahum",
    28: "Habacuq",
    29: "Sofonias",
    30: "Ageo",
    31: "Zacarias",
    32: "Malaquias",
    33: "Daniel",
    34: "Job",
    35: "Proverbios",
    36: "Qohelet",
    37: "Cantar_de_los_Cantares",
    38: "Rut",
    39: "Lamentaciones",
    40: "Ester",
    41: "Tobias",
    42: "Judit",
    43: "Baruc",
    44: "Sabiduria",
    45: "Siracides",
    46: "Salmos",
    47: "Mateo",
    48: "Marcos",
    49: "Lucas",
    50: "Juan",
    51: "Hechos",
    52: "Romanos",
    53: "1Corintios",
    54: "2Corintios",
    55: "Galatas",
    56: "Efesios",
    57: "Filipenses",
    58: "Colosenses",
    59: "Filemon",
    60: "1Tesalonicenses",
    61: "2Tesalonicenses",
    62: "1Timoteo",
    63: "2Timoteo",
    64: "Tito",
    65: "Hebreos",
    66: "Santiago",
    67: "1Pedro",
    68: "2Pedro",
    69: "Judas",
    70: "1Juan",
    71: "2Juan",
    72: "3Juan",
    73: "Apocalipsis",
}


def slugify(name: str) -> str:
    nfkd = unicodedata.normalize("NFKD", name)
    only_ascii = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"[^A-Za-z0-9]+", "_", only_ascii).strip("_")


def fetch_chapter_html(
    session: requests.Session, bid: int, bk: int, cp: int, retries: int = 3
) -> Optional[str]:
    """Descarga el HTML de un capitulo. None si falla definitivamente."""
    params = {"bid": bid, "bk": bk, "cp": cp, "vs": 1}
    last_err: Optional[Exception] = None
    for intento in range(1, retries + 1):
        try:
            r = session.get(BASE_URL, params=params, headers=HEADERS, timeout=25)
            if r.status_code == 200:
                # Forzamos utf-8 (el sitio a veces no manda charset)
                r.encoding = r.apparent_encoding or "utf-8"
                return r.text
            if r.status_code in (404, 410):
                return None
            last_err = RuntimeError(f"HTTP {r.status_code}")
        except requests.RequestException as e:
            last_err = e
        time.sleep(1.5 * intento)
    print(f"  [WARN] bk={bk} cp={cp} fallo: {last_err}", file=sys.stderr)
    return None


def parse_chapter(
    html: str, bid: int, bk: int, cp: int
) -> Tuple[Dict[int, str], bool]:
    """
    Devuelve (versos, hay_siguiente_capitulo).
    versos = {numero_versiculo: texto_concatenado}
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1) Versiculos -- aceptamos cualquier etiqueta con class versetext (no solo span)
    fragmentos: Dict[int, List[str]] = {}
    for el in soup.select(".versetext"):
        sid = el.get("id", "")
        m = VERSE_ID_RE.match(sid)
        if not m:
            continue
        s_bid, s_bk, s_cp, s_vs = map(int, m.groups())
        if (s_bid, s_bk, s_cp) != (bid, bk, cp):
            continue
        texto = el.get_text(separator=" ", strip=True)
        if texto:
            fragmentos.setdefault(s_vs, []).append(texto)

    versos = {
        n: re.sub(r"\s+", " ", " ".join(parts)).strip()
        for n, parts in fragmentos.items()
    }

    # 2) Hay capitulo siguiente?
    next_link = soup.select_one("a.next-chapter[href]")
    hay_siguiente = False
    if next_link:
        href = next_link.get("href", "")
        # Solo cuenta si el href apunta a un cp= mayor del MISMO libro
        m = re.search(r"[?&]bk=(\d+)", href)
        m2 = re.search(r"[?&]cp=(\d+)", href)
        if m and int(m.group(1)) == bk and m2 and int(m2.group(1)) > cp:
            hay_siguiente = True

    return versos, hay_siguiente


def scrape_book(
    session: requests.Session, bid: int, bk: int, delay: float, max_chapters: int = 200
) -> Dict[int, Dict[int, str]]:
    capitulos: Dict[int, Dict[int, str]] = {}
    cp = 1
    while cp <= max_chapters:
        html = fetch_chapter_html(session, bid, bk, cp)
        if html is None:
            print(f"  bk={bk} cp={cp} -> sin contenido, corto", file=sys.stderr)
            break
        versos, hay_sig = parse_chapter(html, bid, bk, cp)
        if versos:
            capitulos[cp] = versos
            print(f"  bk={bk:02d} cp={cp:03d} -> {len(versos)} versiculos")
        else:
            print(f"  bk={bk:02d} cp={cp:03d} -> 0 versiculos (revisar)", file=sys.stderr)
        if not hay_sig:
            break
        cp += 1
        if delay > 0:
            time.sleep(delay)
    return capitulos


def main() -> int:
    parser = argparse.ArgumentParser(description="Scraper Biblia Latinoamericana (sobicain.org)")
    parser.add_argument("--bid", type=int, default=1)
    parser.add_argument("--start-bk", type=int, default=1)
    parser.add_argument("--end-bk", type=int, default=73)
    parser.add_argument("--delay", type=float, default=0.3)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--out", type=str, default="output/biblia")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    libros = [bk for bk in range(args.start_bk, args.end_bk + 1) if bk in BOOK_NAMES]

    def worker(bk: int) -> Tuple[int, Dict[int, Dict[int, str]]]:
        session = requests.Session()
        nombre = BOOK_NAMES[bk]
        slug = slugify(nombre)
        print(f"[INICIO] {bk:02d} {nombre}")
        data = scrape_book(session, args.bid, bk, args.delay)
        archivo = out_dir / f"{bk:02d}_{slug}.json"
        with archivo.open("w", encoding="utf-8") as f:
            json.dump(
                {"bid": args.bid, "bk": bk, "nombre": nombre, "capitulos": data},
                f,
                ensure_ascii=False,
                indent=2,
            )
        total_v = sum(len(v) for v in data.values())
        print(f"[OK]    {bk:02d} {nombre} -> {len(data)} cap / {total_v} vers -> {archivo}")
        return bk, data

    biblia: Dict[str, Dict] = {}
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futures = {ex.submit(worker, bk): bk for bk in libros}
        for fut in as_completed(futures):
            bk, data = fut.result()
            biblia[str(bk)] = {"nombre": BOOK_NAMES[bk], "capitulos": data}

    completo = out_dir / "biblia_completa.json"
    with completo.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "bid": args.bid,
                "fuente": "https://sobicain.org/bibleapp/",
                "libros": dict(sorted(biblia.items(), key=lambda kv: int(kv[0]))),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"\n[FIN] Biblia completa -> {completo}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
