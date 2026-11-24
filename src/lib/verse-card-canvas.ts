// Draws a verse card (see verse-card.ts for the layout) on a canvas, in the browser, and gives it as a PNG. The browser's own
// text engine shapes the Arabic, with the fonts the page already has (Amiri, or the King Fahd Complex's font when the reader
// chose it); no library and no server work.

import { ARABIC_FONT_ATTR } from "./display";
import { layoutCard, type CardInput, type CardLayout, type CardTextKind } from "./verse-card";

const KFGQPC = '"KFGQPC HAFS Uthmanic Script"';
const SANS = '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif';

/** The font of a kind of text, at a size: the reader's Arabic font, the interface's sans for everything else. */
function font(kind: CardTextKind, size: number): string {
  if (kind === "arabic") {
    const kfgqpc = document.documentElement.getAttribute(ARABIC_FONT_ATTR) === "kfgqpc";
    return `${size}px ${kfgqpc ? `${KFGQPC}, ` : ""}"Amiri", "Scheherazade New", serif`;
  }
  return `${kind === "small" ? 500 : 400} ${size}px ${SANS}`;
}

// Cream and gold on the brand's deep teal; the same colours in both themes, so a card looks the same wherever it is shared.
const COLOURS = { from: "#0e4452", to: "#0a1f24", text: "#f5f2eb", muted: "rgba(245,242,235,0.72)", gold: "#e0b04f" };

/** Make sure the fonts the card needs are loaded, for the texts it will draw. */
async function loadFonts(input: CardInput): Promise<void> {
  const sizes = [68, 24];
  await Promise.all([
    document.fonts.load(font("arabic", sizes[0]), input.arabic),
    document.fonts.load(font("translation", sizes[1]), input.translation?.text ?? input.reference),
    document.fonts.load(font("small", sizes[1]), input.reference),
  ]).catch(() => {});
}

function draw(ctx: CanvasRenderingContext2D, layout: CardLayout, input: CardInput): void {
  const { width, height } = layout;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COLOURS.from);
  gradient.addColorStop(1, COLOURS.to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(224,176,79,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const centre = width / 2;

  ctx.direction = "ltr";
  ctx.fillStyle = COLOURS.gold;
  ctx.font = `600 ${layout.brand.size}px ${SANS}`;
  ctx.fillText("QuranWeb", centre, layout.brand.baseline);

  ctx.direction = "rtl";
  ctx.fillStyle = COLOURS.text;
  ctx.font = font("arabic", layout.arabic.size);
  layout.arabic.lines.forEach((line, i) => ctx.fillText(line, centre, layout.arabic.baseline[i]));

  ctx.direction = "ltr";
  ctx.fillStyle = COLOURS.gold;
  ctx.font = `600 ${layout.reference.size}px ${SANS}`;
  ctx.fillText(input.reference, centre, layout.reference.baseline);

  if (layout.translation) {
    ctx.direction = layout.translation.dir;
    ctx.fillStyle = COLOURS.text;
    ctx.font = font("translation", layout.translation.size);
    layout.translation.lines.forEach((line, i) => ctx.fillText(line, centre, layout.translation!.baseline[i]));
  }

  ctx.direction = input.translation?.dir ?? "ltr";
  ctx.fillStyle = COLOURS.muted;
  ctx.font = font("small", layout.credit.size);
  layout.credit.lines.forEach((line, i) => ctx.fillText(line, centre, layout.credit.baseline[i]));

  ctx.direction = "ltr";
  ctx.font = font("small", layout.site.size);
  ctx.fillText(input.site, centre, layout.site.baseline);
}

/** The card as a PNG, for the verse of `input`. */
export async function renderVerseCard(input: CardInput): Promise<Blob> {
  await loadFonts(input);
  const probe = document.createElement("canvas").getContext("2d")!;
  const layout = layoutCard(input, (text, kind, size) => {
    probe.font = font(kind, size);
    probe.direction = kind === "arabic" ? "rtl" : (input.translation?.dir ?? "ltr");
    return probe.measureText(text).width;
  });
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  draw(canvas.getContext("2d")!, layout, input);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card could not be drawn"))), "image/png"));
}
