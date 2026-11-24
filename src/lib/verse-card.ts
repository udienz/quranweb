// A verse as a picture to share (issue #48): the Arabic, the first translation the reader chose, the citation, the credit of
// the translation and the site's address, on one card. This file is the layout only: where each line goes, from a function that
// measures text. It is pure, so it can be tested without a canvas. `verse-card-canvas.ts` draws the result in the browser.

export const CARD_WIDTH = 1080;
/** A short verse is centred on a square card; a long one makes it taller, up to this. */
export const CARD_MIN_HEIGHT = 1080;
export const CARD_MAX_HEIGHT = 2160;
const PADDING = 96;
const TEXT_WIDTH = CARD_WIDTH - 2 * PADDING;

/** The kinds of text on the card, each drawn with its own font. */
export type CardTextKind = "arabic" | "translation" | "small";
/** The width of a text drawn at a size, in pixels: the canvas's measureText in the browser, a stand-in in tests. */
export type Measure = (text: string, kind: CardTextKind, size: number) => number;

export interface CardInput {
  arabic: string;
  /** The first translation the reader chose; the card has none when no translation is chosen. */
  translation?: { text: string; credit: string; dir: "ltr" | "rtl" };
  /** How the verse is cited ("QS. Al-Baqarah: 255"). */
  reference: string;
  /** The site's address, drawn at the foot. */
  site: string;
}

export interface CardLayout {
  width: number;
  height: number;
  arabic: { size: number; lines: string[]; baseline: number[] };
  reference: { size: number; baseline: number };
  translation: { size: number; lines: string[]; baseline: number[]; dir: "ltr" | "rtl" } | null;
  brand: { size: number; baseline: number };
  credit: { size: number; lines: string[]; baseline: number[] };
  site: { size: number; baseline: number };
  /** True when the translation had to be cut to fit (it ends with "…"). */
  trimmed: boolean;
}

/** Break a text into lines no wider than `maxWidth`, at spaces; a single word wider than the line is kept whole. */
export function wrapLines(text: string, maxWidth: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

const ARABIC_SIZES = [68, 62, 56, 50, 46, 42, 38];
const TRANSLATION_RATIO = 0.56;

interface Fit {
  layout: CardLayout;
  tooTall: boolean;
}

function attempt(input: CardInput, measure: Measure, arabicSize: number, translationText: string | null): Fit {
  const translationSize = Math.max(24, Math.round(arabicSize * TRANSLATION_RATIO));
  const arabicLines = wrapLines(input.arabic, TEXT_WIDTH, (l) => measure(l, "arabic", arabicSize));
  const translationLines = translationText ? wrapLines(translationText, TEXT_WIDTH, (l) => measure(l, "translation", translationSize)) : [];
  const creditSize = 26;
  const creditLines = input.translation ? wrapLines(input.translation.credit, TEXT_WIDTH, (l) => measure(l, "small", creditSize)) : [];

  const arabicLine = Math.round(arabicSize * 1.95);
  const translationLine = Math.round(translationSize * 1.5);
  const brandSize = 30;
  const referenceSize = Math.round(arabicSize * 0.5);

  // From the top: the brand, the Arabic, the citation, the translation, then the credit and the address at the foot.
  const top = 112;
  let y = top + brandSize + 56;
  const arabicBaseline = arabicLines.map((_, i) => y + arabicSize + i * arabicLine);
  y += arabicLines.length * arabicLine + 36;
  const referenceBaseline = y + referenceSize;
  y += referenceSize + 56;
  const translationBaseline = translationLines.map((_, i) => y + translationSize + i * translationLine);
  y += translationLines.length * translationLine;
  const footHeight = creditLines.length * 36 + 40 + 30 + 64;
  const contentBottom = y + (translationLines.length ? 64 : 0);
  const height = Math.min(CARD_MAX_HEIGHT, Math.max(CARD_MIN_HEIGHT, contentBottom + footHeight));
  const tooTall = contentBottom + footHeight > CARD_MAX_HEIGHT;

  // The foot sits at the bottom edge of the card, whatever its height.
  const siteBaseline = height - 64;
  const creditBaseline = creditLines.map((_, i) => siteBaseline - 30 - 40 - (creditLines.length - 1 - i) * 36);

  // A short verse on the square card: the block is centred between the brand and the foot instead of sticking to the top.
  const free = height - footHeight - contentBottom;
  const shift = free > 0 ? Math.round(free / 2) : 0;
  const move = (n: number) => n + shift;

  return {
    tooTall,
    layout: {
      width: CARD_WIDTH,
      height,
      arabic: { size: arabicSize, lines: arabicLines, baseline: arabicBaseline.map(move) },
      reference: { size: referenceSize, baseline: move(referenceBaseline) },
      translation: input.translation ? { size: translationSize, lines: translationLines, baseline: translationBaseline.map(move), dir: input.translation.dir } : null,
      brand: { size: brandSize, baseline: top + brandSize },
      credit: { size: creditSize, lines: creditLines, baseline: creditBaseline },
      site: { size: 26, baseline: siteBaseline },
      trimmed: false,
    },
  };
}

/**
 * Where everything goes. The Arabic is as large as fits: the size steps down until the card is no taller than CARD_MAX_HEIGHT.
 * If the verse is so long that even the smallest size does not fit (a few verses of Al-Baqarah), the translation is cut at a
 * word and ends with "…": the Arabic is never cut.
 */
export function layoutCard(input: CardInput, measure: Measure): CardLayout {
  for (const size of ARABIC_SIZES) {
    const fit = attempt(input, measure, size, input.translation?.text ?? null);
    if (!fit.tooTall) return fit.layout;
  }
  const size = ARABIC_SIZES[ARABIC_SIZES.length - 1];
  let words = (input.translation?.text ?? "").split(/\s+/).filter(Boolean);
  let fit = attempt(input, measure, size, words.join(" "));
  while (fit.tooTall && words.length > 0) {
    words = words.slice(0, Math.max(0, Math.floor(words.length * 0.9) - 1));
    fit = attempt(input, measure, size, words.length ? `${words.join(" ")} …` : null);
  }
  return { ...fit.layout, trimmed: words.length < (input.translation?.text ?? "").split(/\s+/).filter(Boolean).length };
}
