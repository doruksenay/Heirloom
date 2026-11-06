import type { JSX } from 'preact';

/**
 * Ribbon badges: one shared rosette (scalloped medal with two tails) in the accent of the ribbon's theme family,
 * and a glyph drawn on a 20x20 grid (-10..10, origin at the medal's centre) in night ink on top.
 * Adding a ribbon later = one line in RIBBON_ART: `my_id: r('work', <path d="..." />)`.
 * Glyph conventions: the wrapping group strokes with currentColor (width 2, round caps, no fill);
 * solid shapes say fill="currentColor" stroke="none". Unknown ids get a plain star.
 */

export type RibbonFamily = 'family' | 'work' | 'wealth' | 'life' | 'fame' | 'shade';

/** [light, dark] ends of the medal gradient, per family. */
const TONES: Record<RibbonFamily, [string, string]> = {
  family: ['#FF9DB2', '#E2476F'], // coral: love, children, kin
  work: ['#FFD27D', '#F29A2E'], // amber: careers, study, craft
  wealth: ['#7BF5E8', '#00B3A4'], // teal: money, business
  life: ['#FFF4EC', '#E0BFA6'], // cream: age, health, the shape of a whole life
  fame: ['#D2C4FF', '#8A6FE8'], // violet: the spotlight
  shade: ['#C4BEE6', '#7C73B8'], // slate: crime and misfortune
};
const INK = '#1B1446';

/** Five-point star path centred on (cx, cy). */
const starPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}z`;
};
/** A small heart centred on (cx, cy), `s` = half-width. */
const heartPath = (cx: number, cy: number, s: number) => {
  const k = s / 6;
  const f = (x: number, y: number) => `${(cx + x * k).toFixed(2)} ${(cy + y * k).toFixed(2)}`;
  return `M${f(0, 5)}C${f(-7, 0.5)} ${f(-6, -5)} ${f(-3, -5)}C${f(-1.5, -5)} ${f(0, -4)} ${f(0, -2.5)}C${f(0, -4)} ${f(1.5, -5)} ${f(3, -5)}C${f(6, -5)} ${f(7, 0.5)} ${f(0, 5)}z`;
};
/** Gear teeth as short spokes around the origin. */
const teeth = (n: number, r1: number, r2: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    return `M${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)}L${(r2 * Math.cos(a)).toFixed(2)} ${(r2 * Math.sin(a)).toFixed(2)}`;
  }).join('');

interface Entry {
  family: RibbonFamily;
  glyph: JSX.Element;
}
const r = (family: RibbonFamily, glyph: JSX.Element): Entry => ({ family, glyph });
const solid = { fill: 'currentColor', stroke: 'none' } as const;

export const RIBBON_ART: Record<string, Entry> = {
  // ---------------------------------------------------------------- family (coral)
  soulmates: r('family', <><circle cx="-3.6" cy="0" r="5.6" /><circle cx="3.6" cy="0" r="5.6" /></>),
  heartbreaker: r('family', <><path d={heartPath(0, 0.5, 8.6)} /><path d="M0-3.6l-2.6 3.4 3 1.8-2.4 3.6" /></>),
  serial_romantic: r('family', <><path d={heartPath(-4.8, -3.2, 4.4)} {...solid} /><path d={heartPath(4.8, -3.2, 4.4)} {...solid} /><path d={heartPath(0, 4.4, 5.4)} {...solid} /></>),
  big_family: r('family', <><circle cx="0" cy="0" r="3.4" /><circle cx="0" cy="-8" r="1.9" {...solid} /><circle cx="0" cy="8" r="1.9" {...solid} /><circle cx="-8" cy="0" r="1.9" {...solid} /><circle cx="8" cy="0" r="1.9" {...solid} /></>),
  three_generations: r('family', <><circle cx="-6" cy="3" r="2.1" {...solid} /><circle cx="0" cy="-1" r="2.7" {...solid} /><circle cx="6" cy="-5" r="3.3" {...solid} /><path d="M-9.4 9.4h18.8" /></>),
  grandparent_six: r('family', <>{[-6, 0, 6].map((y) => [-3.6, 3.6].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" {...solid} />))}</>),
  line_founder: r('family', <><circle cx="0" cy="-7" r="2" {...solid} /><path d="M0-5v3M-6 1v-3h12v3M-6 1v0" /><circle cx="-6" cy="1.6" r="1.8" {...solid} /><circle cx="6" cy="1.6" r="1.8" {...solid} /><path d="M-6 3.4v2M-9 5.4h6M6 3.4v2M3 5.4h6M-9 5.4v1.6M-3 5.4v1.6M3 5.4v1.6M9 5.4v1.6" /><circle cx="-9" cy="8.6" r="1.4" {...solid} /><circle cx="-3" cy="8.6" r="1.4" {...solid} /><circle cx="3" cy="8.6" r="1.4" {...solid} /><circle cx="9" cy="8.6" r="1.4" {...solid} /></>),
  pet_whisperer: r('family', <><ellipse cx="0" cy="4" rx="4.8" ry="3.8" {...solid} /><circle cx="-6.4" cy="-1" r="2" {...solid} /><circle cx="-2.4" cy="-5.6" r="2" {...solid} /><circle cx="2.4" cy="-5.6" r="2" {...solid} /><circle cx="6.4" cy="-1" r="2" {...solid} /></>),
  rich_other_ways: r('family', <><circle cx="0" cy="0" r="4.4" /><path d="M-9-8v5.5a2 2 0 0 0 4 0V-8M-7-8v17M9-8c-2.6 2-3 6-2 9.5h2V9" /></>),
  homecomer: r('family', <><path d="M-9.4 0L0-8.4 9.4 0M-6.4-2v10.6h12.8V-2" /><path d={heartPath(0, 2.6, 3.4)} {...solid} /></>),
  far_from_home: r('family', <><path d="M0 9.4c-5-5-7.4-8-7.4-11.4a7.4 7.4 0 0 1 14.8 0C7.4 1.4 5 4.4 0 9.4z" /><circle cx="0" cy="-2" r="2.5" {...solid} /></>),
  successor: r('family', <><circle cx="-4.4" cy="-4.4" r="4.2" /><path d="M-1.4-1.4L8.4 8.4M5 5l2.6-2.6M8 8l2-2" /></>),

  // ---------------------------------------------------------------- work (amber)
  top_ladder: r('work', <><path d={starPath(0, -6.6, 3.6)} {...solid} /><path d="M-4.4 9.6L-3-0.4M4.4 9.6L3-0.4M-3.9 6.2h7.8M-3.4 2.8h6.8" /></>),
  workhorse: r('work', <><circle r="4.8" /><circle r="1.6" {...solid} /><path d={teeth(8, 6.6, 9)} stroke-width="2.8" stroke-linecap="butt" /></>),
  never_clocked_out: r('work', <><circle cx="0" cy="1.4" r="6.4" /><path d="M0 1.4V-2.2M0 1.4l3 2M-6-6.6l-2.4 2.2M6-6.6l2.4 2.2M-4 8.6l-2 1.4M4 8.6l2 1.4" /></>),
  chalk_dust: r('work', <><path d="M0-3c-3-3-8.4-1-8.4 4.4S-3.6 9 -2 9s2-.8 2-.8.4.8 2 .8 6-2.4 6-6.6S3-6 0-3z" /><path d="M0-3c0-3 1.2-5.4 4.4-6.4" /></>),
  night_shift: r('work', <path d="M-3-8.6h6v5.6h5.6v6H3v5.6h-6V3h-5.6v-6H-3z" />),
  kitchen_legend: r('work', <><path d="M-5.6 9V3.6C-10.4 3.6-10.6-3.6-5.2-3.8-4.6-9 3.8-9.4 5.2-4c5.2-.4 6.2 7.6.4 7.6V9z" /><path d="M-5.6 6h11.2" /></>),
  frequent_flyer: r('work', <path d="M0-9.4c1.2 0 1.8 1.2 1.8 2.4v3.6l7.6 4.8v2.4L1.8 1.4v4.4l2 1.6V9.4L0 8.4l-3.8 1V7.4l2-1.6V1.4L-9.4 3.8V1.4l7.6-4.8V-7c0-1.2.6-2.4 1.8-2.4z" {...solid} />),
  word_person: r('work', <><circle cx="-4.2" cy="-2.2" r="2.8" {...solid} /><circle cx="4.8" cy="-2.2" r="2.8" {...solid} /><path d="M-1.6-1.6C-1.6 2-2.6 4.4-5.6 6M7.4-1.6C7.4 2 6.4 4.4 3.4 6" /></>),
  on_the_road: r('work', <><circle cx="0" cy="0" r="8.4" /><circle cx="0" cy="0" r="2.2" {...solid} /><path d="M-8.2-1.2H-2.4M2.4-1.2H8.2M0 2.4V8.4" /></>),
  good_with_hands: r('work', <path d="M6.6-8.6a4.8 4.8 0 0 0-5.8 6.2L-7.4 5.4a2.2 2.2 0 0 0 3.2 3.2l7.8-7.6a4.8 4.8 0 0 0 5.8-5.8L6.4-1.4 3.6-2.2l-.8-2.8z" />),
  valedictorian: r('work', <><path d="M0-6.4L10-1.6 0 3.2-10-1.6z" /><path d="M-5.2 1.4v5c3 2.6 7.4 2.6 10.4 0v-5M10-1.6v6" /></>),
  eternal_student: r('work', <><rect x="-7" y="-8.6" width="14" height="4.4" rx="1" /><rect x="-8.6" y="-2.2" width="14" height="4.4" rx="1" /><rect x="-5.4" y="4.2" width="14" height="4.4" rx="1" /></>),
  scholar: r('work', <path d="M0-5C-3-7.2-6.4-7.4-9.4-6.2v13c3-1.2 6.4-1 9.4 1.2 3-2.2 6.4-2.4 9.4-1.2v-13C6.4-7.4 3-7.2 0-5zM0-5V8" />),
  with_honors: r('work', <><path d="M-2.4 9C-8 6.6-10.2 1-8-5.4M2.4 9C8 6.6 10.2 1 8-5.4" /><circle cx="-8.8" cy="-1.4" r="1.7" {...solid} /><circle cx="-6.8" cy="3.4" r="1.7" {...solid} /><circle cx="8.8" cy="-1.4" r="1.7" {...solid} /><circle cx="6.8" cy="3.4" r="1.7" {...solid} /><path d={starPath(0, -0.6, 4.6)} {...solid} /></>),
  twice_graduated: r('work', <><rect x="-9" y="-4.6" width="18" height="8.4" rx="4.2" /><path d="M3.2-4.6v8.4M3.2 3.8l-1.8 5.4M3.2 3.8l2.4 5" /></>),
  overachiever: r('work', <><path d="M-9-6l2 2 3.4-3.6M-9 0l2 2 3.4-3.6M-9 6l2 2 3.4-3.6" /><path d="M0-5.6h9M0 .4h9M0 6.4h9" /></>),
  memoirist: r('work', <><path d="M9.4-9.4C-2-9.2-8-3-8 4.4L-9.4 9.4l5-1.6C3.4 7.8 9.6 2 9.4-9.4z" /><path d="M-8 7.6L3-3.4" /></>),
  marathoner: r('work', <><circle cx="3.4" cy="-7" r="1.9" {...solid} /><path d="M2.6-3.4L-0.4 2l4.2 3 .8 4.4M2.6-3.4l5.2 2.6M2.6-3.4l-5 1.6M-0.4 2L-5 6" /></>),
  mahalle_muhtari: r('work', <><rect x="-3" y="-9" width="6" height="7" rx="2.4" /><path d="M-7-2h14v5H-7zM-8.4 9h16.8" /></>),
  local_celeb: r('work', <><path d="M-9 8V1.4C-11.6-1.6-9-8.4-3-8.4h6c6 0 8.6 6.8 6 9.8V8z" /><path d="M-4-5l1.6 3.4M0-5.4l1.6 3.4M4-5l1.6 3.4" stroke-width="1.6" /></>),

  // ---------------------------------------------------------------- wealth (teal)
  tycoon: r('wealth', <><path d="M-9.4 7.4h18.8M-5.4 7.4V-7.6h10.8v15" /><rect x="-5.4" y="1.8" width="10.8" height="3.4" {...solid} /></>),
  unicorn: r('wealth', <><path d="M-3.4 9.4L0-9.4l3.4 18.8z" /><path d="M-2.2 3.6h4.4M-1.2-1.6h2.4" /><path d={starPath(7.2, -6.2, 2.6)} {...solid} /></>),
  self_made: r('wealth', <><path d="M-9 1.4L1.4-9H9v7.6L-1.4 9z" /><circle cx="4.8" cy="-4.8" r="1.5" {...solid} /></>),
  dynasty_business: r('wealth', <><path d="M-9.4-2.4L-7.4-8.4h14.8l2 6c0 2.6-2.2 3-3.4 3S2.6 1.4 2.6 -.4c0 1.8-.6 3-2.6 3s-2.6-1.2-2.6-3c0 1.6-2.2 3-3.4 3s-3.4-.4-3.4-3z" /><path d="M-6.8 3v6.4h13.6V3M-1.6 9.4V5h3.2v4.4" /></>),
  went_bust: r('wealth', <><path d="M-9.4-6.4l6 6.8 3-3L7.6 5.4" /><path d="M7.8-.2v5.8H2" /></>),
  bootstrapper: r('wealth', <><path d="M-3.4-9.4h6.8v8.2c0 2 2.2 2.4 4.4 3.6 1.6.9 2.2 2 2.2 3.6V9.4h-14z" /><path d="M-3.4-9.4v-1M3.4-9.4v-1M-9.4 6h7" /></>),
  old_money: r('wealth', <><ellipse cx="0" cy="6" rx="7" ry="2.8" /><path d="M-7 6V1.8M7 6V1.8" /><ellipse cx="0" cy="1.8" rx="7" ry="2.8" /><path d="M-7 1.8v-4.2M7 1.8v-4.2" /><ellipse cx="0" cy="-2.4" rx="7" ry="2.8" /></>),
  frugal_saint: r('wealth', <><ellipse cx="0" cy="-7.4" rx="5" ry="1.8" /><circle cx="0" cy="3" r="6" /><circle cx="0" cy="3" r="2.4" {...solid} /></>),
  mortgage_marathon: r('wealth', <><path d="M-9.4-1L0-9.4 9.4-1M-6.6-2.2v11.4h13.2V-2.2" /><rect x="-4" y="3" width="8" height="3.4" rx="1" /><rect x="-4" y="3" width="4.8" height="3.4" rx="1" {...solid} /></>),
  altin_bilezik: r('wealth', <><ellipse cx="0" cy="1.6" rx="8.6" ry="6.4" /><ellipse cx="0" cy="1.6" rx="4.6" ry="3" /><path d="M0-8.6l2.2 2.2L0-4.2l-2.2-2.2z" {...solid} /></>),
  keeper: r('wealth', <><path d="M-9.4-3.4L-6-8.6h12l3.4 5.2L0 9.4z" /><path d="M-9.4-3.4h18.8M-3.6-3.4L0 9.4l3.6-12.8L1.8-8.6M-3.6-3.4L-1.8-8.6" /></>),
  broke: r('wealth', <><circle cx="0" cy="0" r="8.2" /><path d="M-4 0h8" stroke-width="2.6" /></>),

  // ---------------------------------------------------------------- life (cream)
  centenarian: r('life', <><path d="M-8.6-2.4l2.6-1.8V4.6" stroke-width="1.9" /><ellipse cx="0.2" cy="0.2" rx="2.4" ry="4.4" stroke-width="1.9" /><ellipse cx="6.6" cy="0.2" rx="2.4" ry="4.4" stroke-width="1.9" /></>),
  gone_soon: r('life', <><path d="M-9.4 9.4l8-8M-9.4 4.4l4-4M-4.4 9.4l4-4" /><path d="M4-9l1.4 4 4 1.4-4 1.4L4 2 2.6-2.2-1.4-3.6l4-1.4z" {...solid} /></>),
  content: r('life', <><circle cx="0" cy="0" r="8.6" /><circle cx="-3.2" cy="-2.6" r="1.1" {...solid} /><circle cx="3.2" cy="-2.6" r="1.1" {...solid} /><path d="M-4.4 2c2.2 3.4 6.6 3.4 8.8 0" /></>),
  ordinary: r('life', <><path d="M-8-2h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM5 .2h1.8a3 3 0 0 1 0 6H4.4M-4-9.4v4M0-9.4v4" /></>),
  everyday_hero: r('life', <><path d="M0-9.4l8.2 3v6.2c0 4.8-3.6 7.8-8.2 9.8-4.6-2-8.2-5-8.2-9.8v-6.2z" /><path d="M-3.4.4l2.6 2.8 4.4-5.6" /></>),
  hale_hearty: r('life', <><path d={heartPath(0, 0.4, 9.4)} /><path d="M-5.6 0.4h2.8l1.6-3.4 2.4 6.4 1.6-3H5.6" stroke-width="1.8" /></>),
  long_goodbye: r('life', <><path d="M-6-9.4h12M-6 9.4h12M-5-9.4c0 6 5 6 5 9.4 0 3.4-5 3.4-5 9.4M5-9.4c0 6-5 6-5 9.4 0 3.4 5 3.4 5 9.4" /><path d="M-3 8.4h6l-3-3.6z" {...solid} /></>),
  mind_the_step: r('life', <><path d="M-9.4 8.4h5v-4.2h5V0h5v-4.2h4.8" /><path d="M-6.4-3.4l1.8 1.8M-9.2-7.4l.2 2.6M-3-7.4l-1 2.4" /></>),
  quiet_exit: r('life', <><path d="M3.4-9C-3-7.6-7-2.6-7 2.6A7.2 7.2 0 0 0 9 4.2C3 3.6 1.4-3.4 3.4-9z" {...solid} /><path d={starPath(6.6, -5, 2.6)} {...solid} /></>),
  head_turner: r('life', <><circle cx="-1.6" cy="-2.6" r="6.4" /><path d="M2.8 2.2l5.8 6.8M-5.4-3.4a4 4 0 0 1 2.6-2.8" /><path d={starPath(1.8, -2, 1.6)} {...solid} /></>),
  quiet_genius: r('life', <><path d="M0-9.4A6 6 0 0 0-3.6 1.4c.8.6 1.2 1.6 1.2 2.8h4.8c0-1.2.4-2.2 1.2-2.8A6 6 0 0 0 0-9.4z" /><path d="M-2.4 7.2h4.8M-1.4 9.6h2.8" /></>),
  one_slip: r('life', <><g transform="rotate(-38 0 0)"><rect x="-6" y="-9" width="12" height="5.4" rx="1.4" /><path d="M0-3.6v13" /></g><path d="M-9.4 9.4h8" /></>),
  lone_wolf: r('life', <><path d="M-8.4-9.4l4 4h8.8l4-4v10.4c0 4-3.4 7.4-8.4 9-5-1.6-8.4-5-8.4-9z" /><circle cx="-3" cy="-0.8" r="1.1" {...solid} /><circle cx="3" cy="-0.8" r="1.1" {...solid} /><path d="M-1.6 5h3.2l-1.6 1.8z" {...solid} /></>),
  black_sheep: r('life', <><ellipse cx="-2" cy="-0.4" rx="6.8" ry="5" {...solid} /><ellipse cx="6.6" cy="-2" rx="2.6" ry="3.2" {...solid} /><path d="M-6 4.4v5M0 4.4v5" /></>),
  star: r('life', <><path d="M1-9.6C1.4-4 8 -2.4 8 3.4A7 7 0 0 1-6 3.4C-6 .6-4-.8-3.6-3.6-1.6-2.6-.6-1.6-.4-.2 1.4-2.6 1.6-6.4 1-9.6z" /><path d="M0 9c-2.2-.4-3.2-2-2.6-3.8 1 .6 2 .4 2.6-.8.8 1.6 2.8 2.2 2.8 4.2" stroke-width="1.6" /></>),

  // ---------------------------------------------------------------- fame (violet)
  superstar: r('fame', <><path d="M-2.4-6.6L-.6-1l5.6 1.8-5.6 1.8-1.8 5.6L-4.2 3.6l-5.6-1.8L-4.2 0z" transform="translate(0 1.6)" {...solid} /><path d="M6-9.4l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" {...solid} /></>),
  showbiz_dynasty: r('fame', <><path d="M-8.6 6.4V-4.6L-4.4 0 0-7.6 4.4 0l4.2-4.6v11z" /><path d="M-8.6 9.4h17.2" /></>),
  world_tour: r('fame', <><circle r="8.4" /><ellipse rx="3.6" ry="8.4" /><path d="M-8.4 0h16.8M-6.4-4.2h12.8M-6.4 4.2h12.8" stroke-width="1.5" /></>),
  controversial: r('fame', <><path d="M-8.6-7.4h17.2v11.6H1.6L-3.2 9v-4.8h-5.4z" /><path d="M0-4.2v3.2" stroke-width="2.4" /><circle cx="0" cy="1.4" r="0.4" stroke-width="2.4" /></>),
  one_hit: r('fame', <><ellipse cx="-3.8" cy="6.2" rx="3.4" ry="2.8" {...solid} /><path d="M-0.6 6.2V-8.4c3.4.6 6.4 2.4 6.4 6" /></>),
  party_animal: r('fame', <><path d="M-7 9L-1.4-5.6 7.4 7.6z" /><path d="M-4 2.6l8.6 2.6" /><circle cx="-1" cy="-8" r="1.7" {...solid} /><circle cx="6.6" cy="-4.4" r="1.2" {...solid} /><circle cx="-8" cy="-3" r="1.2" {...solid} /></>),

  // ---------------------------------------------------------------- shade (slate): crime and misfortune
  crime_ghost: r('shade', <><path d="M-7 9.4V-1a7 7 0 0 1 14 0v10.4L3.5 7 0 9.4 -3.5 7z" /><circle cx="-2.6" cy="-2" r="1.2" {...solid} /><circle cx="2.6" cy="-2" r="1.2" {...solid} /></>),
  crime_second_chance: r('shade', <><path d="M8.4 2.2A8.4 8.4 0 1 1 6-5.2" /><path d="M7.4-9.4v4.8h-4.8" /></>),
  crime_lifer: r('shade', <><rect x="-8.6" y="-8.6" width="17.2" height="17.2" rx="3.4" /><path d="M-4.2-8.6v17.2M0-8.6v17.2M4.2-8.6v17.2" /></>),
};

const NEUTRAL: [string, string] = ['#5A5198', '#3A3270'];
const STAR: Entry = r('life', <path d={starPath(0, 0.4, 9.4)} />);
const QUESTION = (
  <>
    <path d="M-3.2-4.6a3.4 3.4 0 1 1 4.8 3.1C.6-1 0 .2 0 1.8" />
    <circle cx="0" cy="6.2" r="0.5" stroke-width="2.6" />
  </>
);

/** Ids that have a badge (the test compares this with allRibbons()). */
export const RIBBON_ART_IDS = Object.keys(RIBBON_ART);

const SCALLOPS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return [24 + 14.6 * Math.cos(a), 20 + 14.6 * Math.sin(a)] as const;
});

export function RibbonIcon({ id, size = 40, locked = false, label }: { id: string; size?: number; locked?: boolean; label?: string }) {
  const known = RIBBON_ART[id];
  const e = known ?? STAR;
  const [light, dark] = locked ? NEUTRAL : TONES[e.family];
  const p = `ri-${locked ? 'lock' : e.family}`;
  const tail = locked ? '#2C2660' : dark;
  const ink = locked ? '#8F86C4' : INK;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      style={{ flex: 'none', display: 'block' }}
      data-ribbon={known ? id : 'unknown'}
    >
      <defs>
        <linearGradient id={p} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stop-color={light} />
          <stop offset="1" stop-color={dark} />
        </linearGradient>
      </defs>
      <path d="M14.5 30L9 45l6.6-2.6L19.4 47l4.2-16z" fill={tail} />
      <path d="M33.5 30L39 45l-6.6-2.6L28.6 47l-4.2-16z" fill={tail} opacity="0.85" />
      <g fill={`url(#${p})`}>
        {SCALLOPS.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="4.2" />
        ))}
        <circle cx="24" cy="20" r="15.4" />
      </g>
      <circle cx="24" cy="20" r="13.2" fill="none" stroke={locked ? '#8F86C4' : INK} stroke-width="0.9" opacity="0.28" />
      <path d="M13 13.5a13 13 0 0 1 9-5.6" stroke="#FFF" stroke-width="2" stroke-linecap="round" fill="none" opacity={locked ? 0.12 : 0.45} />
      <g
        transform="translate(24 20) scale(0.98)"
        style={{ color: ink }}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        {locked ? QUESTION : e.glyph}
      </g>
    </svg>
  );
}
