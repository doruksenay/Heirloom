/**
 * The share card: a 4:5 picture of a life (or of the whole family) that a player can post.
 * Drawn on a canvas in the Heirloom Dusk palette, with no stock art. The module knows no language: the caller
 * passes every string already translated (see chronicle.ts), so the same code draws EN and TR cards.
 */

export interface ShareCardData {
  /** Small line on top, e.g. "WHITAKER FAMILY · GEN 3". */
  eyebrow: string;
  name: string;
  /** Two letters in the badge. */
  initials: string;
  /** "1952 – 2031 · Boston". */
  years: string;
  /** The big number and what it counts: 79, "years lived". */
  big: { value: string; caption: string };
  /** Final words, shown in quotes. */
  quote?: string;
  ribbon?: { name: string; desc: string };
  /** Up to 4 short lines (career, family, one line per life for the family card). */
  facts: string[];
  /** One dot per generation, in order; the life the card is about is `current`. */
  generations: { label: string; current?: boolean }[];
  legacy: string;
  footer: string;
}

export const CARD_W = 1080;
export const CARD_H = 1350;

const NIGHT = '#1B1446';
const DEEP = '#0C0B26';
const CORAL = '#FF6B8B';
const AMBER = '#FFB347';
const TEAL = '#00E5D1';
const CREAM = '#FFF4EC';
const MUTED = 'rgba(255, 244, 236, 0.62)';
const DISPLAY = '"Bricolage Grotesque Variable", "Bricolage Grotesque", "Figtree", system-ui, sans-serif';
const BODY = '"Figtree", system-ui, -apple-system, sans-serif';

/** The part of CanvasRenderingContext2D the card uses, so a test can draw on a recording stand-in. */
export type Ctx2D = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'globalAlpha'
  | 'fillRect'
  | 'fillText'
  | 'beginPath'
  | 'arc'
  | 'moveTo'
  | 'lineTo'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'measureText'
  | 'createLinearGradient'
  | 'createRadialGradient'
  | 'save'
  | 'restore'
  | 'quadraticCurveTo'
>;

/** Breaks `text` into at most `maxLines` lines no wider than `maxW`; the last line ends in an ellipsis if text is left. */
export function wrapText(measure: (s: string) => number, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  let i = 0;
  for (; i < words.length; i++) {
    const next = cur ? `${cur} ${words[i]}` : words[i];
    if (measure(next) <= maxW || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = words[i];
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  const used = lines.join(' ').split(/\s+/).length;
  if (lines.length === maxLines && used < words.length) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && measure(`${last}…`) > maxW) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  // a single word wider than the line (a long name in one piece) is cut so it never leaves the card
  return lines.map((l) => {
    if (measure(l) <= maxW) return l;
    let t = l;
    while (t.length > 1 && measure(`${t}…`) > maxW) t = t.slice(0, -1);
    return `${t}…`;
  });
}

function roundRect(g: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

function stars(g: Ctx2D, w: number, h: number) {
  let x = 7919;
  g.fillStyle = CREAM;
  for (let i = 0; i < 70; i++) {
    x = (x * 16807) % 2147483647;
    const px = x % w;
    x = (x * 16807) % 2147483647;
    const py = x % Math.round(h * 0.55);
    g.globalAlpha = 0.18 + (i % 5) * 0.07;
    g.beginPath();
    g.arc(px, py, i % 7 === 0 ? 2.6 : 1.5, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Draws the whole card. Returns nothing; `g` must be CARD_W × CARD_H. */
export function drawShareCard(g: Ctx2D, d: ShareCardData): void {
  const W = CARD_W;
  const H = CARD_H;
  const PAD = 80;
  const fit = (font: string) => (s: string) => {
    g.font = font;
    return g.measureText(s).width;
  };

  // background: night sky, a warm glow in the corner, stars
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, NIGHT);
  bg.addColorStop(1, DEEP);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.85, 120, 10, W * 0.85, 120, 620);
  glow.addColorStop(0, 'rgba(255, 107, 139, 0.34)');
  glow.addColorStop(1, 'rgba(255, 107, 139, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  stars(g, W, H);

  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';

  // eyebrow
  g.font = `700 28px ${BODY}`;
  g.fillStyle = CORAL;
  const eyebrow = wrapText(fit(`700 28px ${BODY}`), d.eyebrow.toUpperCase(), W - PAD * 2, 1)[0] ?? '';
  g.fillText(eyebrow, PAD, 110);

  // badge with the initials
  const bx = PAD + 78;
  const by = 270;
  const badge = g.createLinearGradient(bx - 78, by - 78, bx + 78, by + 78);
  badge.addColorStop(0, CORAL);
  badge.addColorStop(1, AMBER);
  g.fillStyle = badge;
  g.beginPath();
  g.arc(bx, by, 78, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = DEEP;
  g.font = `800 64px ${DISPLAY}`;
  g.textAlign = 'center';
  g.fillText(d.initials.slice(0, 2).toUpperCase(), bx, by + 22);
  g.textAlign = 'left';

  // name and years, to the right of the badge
  const tx = PAD + 190;
  const tw = W - tx - PAD;
  const nameFont = `800 64px ${DISPLAY}`;
  const nameLines = wrapText(fit(nameFont), d.name, tw, 2);
  g.font = nameFont;
  g.fillStyle = CREAM;
  nameLines.forEach((l, i) => g.fillText(l, tx, 250 + i * 70 - (nameLines.length > 1 ? 30 : 0)));
  g.font = `500 32px ${BODY}`;
  g.fillStyle = MUTED;
  const yearsLine = wrapText(fit(`500 32px ${BODY}`), d.years, tw, 1)[0] ?? '';
  g.fillText(yearsLine, tx, 250 + (nameLines.length > 1 ? 110 : 54));

  // the big number
  g.font = `800 190px ${DISPLAY}`;
  g.fillStyle = AMBER;
  g.fillText(d.big.value, PAD, 528);
  const numW = fit(`800 190px ${DISPLAY}`)(d.big.value);
  g.font = `600 36px ${BODY}`;
  g.fillStyle = MUTED;
  g.fillText(d.big.caption, PAD + numW + 28, 528);

  // the final words
  let y = 596;
  if (d.quote) {
    const qFont = `600 44px ${BODY}`;
    const lines = wrapText(fit(qFont), `“${d.quote}”`, W - PAD * 2 - 40, 4);
    const boxH = lines.length * 58 + 44;
    g.fillStyle = 'rgba(255, 255, 255, 0.06)';
    roundRect(g, PAD, y, W - PAD * 2, boxH, 28);
    g.fill();
    g.fillStyle = TEAL;
    g.fillRect(PAD, y + 22, 6, boxH - 44);
    g.font = qFont;
    g.fillStyle = CREAM;
    lines.forEach((l, i) => g.fillText(l, PAD + 40, y + 62 + i * 58));
    y += boxH + 34;
  }

  // the ribbon
  if (d.ribbon) {
    const rFont = `700 30px ${BODY}`;
    const label = wrapText(fit(rFont), d.ribbon.name, W - PAD * 2 - 80, 1)[0] ?? '';
    const w = fit(rFont)(label) + 64;
    g.fillStyle = 'rgba(0, 229, 209, 0.16)';
    roundRect(g, PAD, y, w, 62, 31);
    g.fill();
    g.font = rFont;
    g.fillStyle = TEAL;
    g.fillText(label, PAD + 32, y + 41);
    y += 62;
    g.font = `500 28px ${BODY}`;
    g.fillStyle = MUTED;
    const desc = wrapText(fit(`500 28px ${BODY}`), d.ribbon.desc, W - PAD * 2, 1)[0] ?? '';
    g.fillText(desc, PAD, y + 44);
    y += 76;
  }

  // facts
  g.font = `500 32px ${BODY}`;
  g.fillStyle = CREAM;
  // the family line (below) starts at ty; a fact that would run into it is dropped
  const ty = H - 215;
  for (const f of d.facts.slice(0, 4)) {
    if (y + 40 > ty - 56) break;
    const line = wrapText(fit(`500 32px ${BODY}`), f, W - PAD * 2, 1)[0] ?? '';
    g.fillText(line, PAD, y + 40);
    y += 50;
  }

  // the family line: one dot per generation
  const n = Math.max(1, d.generations.length);
  const left = PAD + 30;
  const right = W - PAD - 30;
  const step = n > 1 ? Math.min(150, (right - left) / (n - 1)) : 0;
  const x0 = W / 2 - (step * (n - 1)) / 2;
  g.strokeStyle = 'rgba(255, 244, 236, 0.28)';
  g.lineWidth = 3;
  if (n > 1) {
    g.beginPath();
    g.moveTo(x0, ty);
    g.lineTo(x0 + step * (n - 1), ty);
    g.stroke();
  }
  d.generations.slice(0, 8).forEach((gen, i) => {
    const cx = x0 + step * i;
    g.fillStyle = gen.current ? CORAL : 'rgba(255, 244, 236, 0.55)';
    g.beginPath();
    g.arc(cx, ty, gen.current ? 17 : 11, 0, Math.PI * 2);
    g.fill();
    g.font = `700 22px ${BODY}`;
    g.textAlign = 'center';
    g.fillStyle = gen.current ? CORAL : MUTED;
    g.fillText(gen.label, cx, ty + 52);
  });
  g.textAlign = 'left';
  g.font = `700 30px ${BODY}`;
  g.fillStyle = AMBER;
  g.fillText(d.legacy, PAD, ty + 112);

  // footer
  g.font = `800 40px ${DISPLAY}`;
  g.fillStyle = CREAM;
  g.textAlign = 'right';
  g.fillText('Heirloom', W - PAD, H - 56);
  g.font = `500 26px ${BODY}`;
  g.fillStyle = MUTED;
  g.textAlign = 'left';
  g.fillText(d.footer, PAD, H - 56);
}

/** Renders the card to a PNG. Resolves null where there is no canvas (an old WebView, a test). */
export async function renderShareCard(d: ShareCardData): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    // the fonts are bundled, but a canvas does not wait for them
    await Promise.all([document.fonts?.load(`800 64px ${DISPLAY}`), document.fonts?.load(`500 32px ${BODY}`)]);
  } catch {
    /* draw with the fallback fonts */
  }
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const g = canvas.getContext('2d');
  if (!g) return null;
  drawShareCard(g, d);
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}
