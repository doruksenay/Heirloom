/**
 * Store covers: one small vector scene per product, in the Heirloom Dusk palette.
 * Drawn here by hand (no stock or copyrighted art). viewBox 360×150, shown full-width on top of a store card.
 */

const NIGHT = '#1B1446';
const DEEP = '#0C0B26';
const CORAL = '#FF6B8B';
const AMBER = '#FFB347';
const TEAL = '#00E5D1';
const CREAM = '#FFF4EC';

function Stars({ seed = 1, n = 14, h = 70 }: { seed?: number; n?: number; h?: number }) {
  const pts: [number, number, number][] = [];
  let x = seed * 7919;
  for (let i = 0; i < n; i++) {
    x = (x * 16807) % 2147483647;
    const px = x % 360;
    x = (x * 16807) % 2147483647;
    const py = 8 + (x % h);
    pts.push([px, py, i % 3 === 0 ? 1.6 : 1]);
  }
  return (
    <g fill={CREAM}>
      {pts.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} opacity={0.35 + (i % 4) * 0.15} />
      ))}
    </g>
  );
}

function Sky({ id, from = NIGHT, to = '#3A2470' }: { id: string; from?: string; to?: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={from} />
          <stop offset="1" stop-color={to} />
        </linearGradient>
      </defs>
      <rect width="360" height="150" fill={`url(#sky-${id})`} />
    </>
  );
}

const TURKIYE = (
  <>
    <Sky id="tr" from="#24185C" to="#FF8A65" />
    <circle cx="282" cy="64" r="26" fill={AMBER} opacity="0.9" />
    {/* skyline: domes and minarets across the water */}
    <g fill="#2A1B57">
      <path d="M0 104h360v46H0z" />
      <path d="M40 104v-18a22 22 0 0 1 44 0v18z" />
      <path d="M52 86a10 10 0 0 1 20 0" />
      <rect x="30" y="58" width="4" height="46" />
      <path d="M28 60l4-12 4 12z" />
      <rect x="90" y="62" width="4" height="42" />
      <path d="M88 64l4-12 4 12z" />
      <path d="M118 104v-10a14 14 0 0 1 28 0v10z" />
      <path d="M160 104V90h26v14zM190 104V80h18v24zM212 104V92h30v12z" />
    </g>
    {/* the bridge */}
    <path d="M236 104V70M330 104V70" stroke="#2A1B57" stroke-width="4" />
    <path d="M200 92Q283 120 360 88M236 72Q283 104 330 72" stroke="#2A1B57" stroke-width="1.6" fill="none" />
    <path d="M196 98h164" stroke="#2A1B57" stroke-width="3" />
    {/* water */}
    <rect y="112" width="360" height="38" fill="#1B1446" />
    <path d="M20 122h40M110 130h50M220 124h60M300 136h40" stroke={AMBER} stroke-width="2" stroke-linecap="round" opacity="0.5" />
    {/* tea glass on a saucer */}
    <g transform="translate(150 70)">
      <ellipse cx="22" cy="72" rx="30" ry="6" fill={CORAL} />
      <path d="M8 18c-2 10 2 18 0 28-2 10 2 18 2 24h24c0-6 4-14 2-24-2-10 2-18 0-28z" fill="#B23A2A" opacity="0.85" />
      <path d="M8 18c-2 10 2 18 0 28-2 10 2 18 2 24h24c0-6 4-14 2-24-2-10 2-18 0-28z" fill="none" stroke={CREAM} stroke-width="2" opacity="0.8" />
      <path d="M10 26h24" stroke={CREAM} stroke-width="1.5" opacity="0.5" />
      <path d="M16 10c-3-4 3-6 0-10M26 10c-3-4 3-6 0-10" stroke={CREAM} stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.6" />
    </g>
  </>
);

const CRIME = (
  <>
    <Sky id="cr" from={DEEP} to="#2A1840" />
    <Stars seed={3} n={10} h={40} />
    <circle cx="300" cy="34" r="16" fill={CREAM} opacity="0.9" />
    <circle cx="308" cy="30" r="14" fill={DEEP} />
    {/* brick wall */}
    <rect x="0" y="40" width="150" height="110" fill="#2E1E4A" />
    <g stroke={DEEP} stroke-width="2" opacity="0.6">
      {[52, 66, 80, 94, 108, 122, 136].map((y, i) => (
        <g key={y}>
          <path d={`M0 ${y}h150`} />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={`M${k * 28 + (i % 2) * 14} ${y - 14}v14`} />
          ))}
        </g>
      ))}
    </g>
    {/* street lamp and its light */}
    <path d="M200 150V44h22" stroke="#4A3A70" stroke-width="5" fill="none" />
    <path d="M214 46h18l-4 8h-10z" fill={AMBER} />
    <path d="M216 54L178 150h92L232 54z" fill={AMBER} opacity="0.16" />
    {/* the getaway car, tail lights glowing */}
    <g transform="translate(240 104)">
      <path d="M0 30v-12q4-12 22-14l12-10h38l16 12q16 2 18 12v12z" fill="#14102E" />
      <rect x="96" y="20" width="10" height="5" rx="2" fill={CORAL} />
      <circle cx="22" cy="32" r="8" fill={DEEP} />
      <circle cx="84" cy="32" r="8" fill={DEEP} />
    </g>
    <rect y="140" width="360" height="10" fill="#14102E" />
    {/* a figure in a hat, half in shadow */}
    <g transform="translate(150 70)" fill="#0A0820">
      <ellipse cx="14" cy="6" rx="16" ry="3" />
      <rect x="4" y="-8" width="20" height="14" rx="3" />
      <circle cx="14" cy="14" r="9" />
      <path d="M-4 80V36q0-12 18-12t18 12v44z" />
    </g>
  </>
);

const FAME = (
  <>
    <Sky id="fm" from="#2B0F45" to={NIGHT} />
    <path d="M70 0L20 150h110z" fill={AMBER} opacity="0.14" />
    <path d="M290 0L230 150h110z" fill={CORAL} opacity="0.16" />
    <path d="M180 0L130 150h100z" fill={TEAL} opacity="0.1" />
    {/* stage */}
    <rect y="118" width="360" height="32" fill="#120B30" />
    <path d="M0 118h360" stroke={AMBER} stroke-width="2" opacity="0.6" />
    {/* microphone on a stand */}
    <g transform="translate(168 30)">
      <rect x="4" y="0" width="16" height="26" rx="8" fill="#C8C2E8" />
      <path d="M6 8h12M6 13h12M6 18h12" stroke="#8A82B8" stroke-width="1.3" />
      <path d="M12 26v62M-6 88h36" stroke="#C8C2E8" stroke-width="3" stroke-linecap="round" />
    </g>
    {/* stars and notes */}
    <path d="m70 40 3.5 7.5 8 1-6 5.5 1.6 8L70 58l-7 4 1.6-8-6-5.5 8-1z" fill={AMBER} />
    <path d="m290 30 2.5 5.5 6 .7-4.4 4 1.2 6L290 43.4l-5.3 2.8 1.2-6-4.4-4 6-.7z" fill={CORAL} />
    <path d="m250 80 2 4.4 4.8.6-3.5 3.2 1 4.8-4.3-2.4-4.3 2.4 1-4.8-3.5-3.2 4.8-.6z" fill={TEAL} />
    <g fill={CREAM} opacity="0.85">
      <path d="M110 70v22a6 6 0 1 1-3-5V66l16-4v20a6 6 0 1 1-3-5V68z" />
    </g>
    {/* crowd */}
    <g fill="#0A0820">
      {[10, 40, 70, 100, 130, 220, 250, 280, 310, 340].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={136 - (i % 3) * 3} r="9" />
          <rect x={x - 12} y={142 - (i % 3) * 3} width="24" height="20" rx="8" />
        </g>
      ))}
      <path d="M44 128l-6-18M254 124l6-20" stroke="#0A0820" stroke-width="5" stroke-linecap="round" />
    </g>
  </>
);

const BOSS = (
  <>
    <Sky id="bs" from="#2A1E66" to="#5B3D8F" />
    {/* skyline */}
    <g fill="#231A55">
      <rect x="10" y="50" width="44" height="100" />
      <rect x="60" y="30" width="36" height="120" />
      <rect x="260" y="40" width="40" height="110" />
      <rect x="306" y="62" width="48" height="88" />
    </g>
    <g fill={AMBER} opacity="0.55">
      {[60, 76, 92, 108].map((y) => (
        <g key={y}>
          <rect x="18" y={y} width="8" height="8" />
          <rect x="36" y={y} width="8" height="8" />
          <rect x="68" y={y - 16} width="8" height="8" />
          <rect x="82" y={y - 16} width="8" height="8" />
          <rect x="268" y={y - 6} width="8" height="8" />
          <rect x="284" y={y - 6} width="8" height="8" />
        </g>
      ))}
    </g>
    {/* the shop: striped awning, window, door */}
    <g transform="translate(110 46)">
      <rect x="0" y="22" width="140" height="82" fill="#3C2C7A" />
      <path d="M-6 6h152l-6 22H0z" fill={CREAM} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${-6 + i * 22} 6h11l-1 22h-10z`} fill={CORAL} />
      ))}
      <path d="M-6 28q11 8 22 0t22 0 22 0 22 0 22 0 22 0 22 0" fill={CORAL} />
      <rect x="12" y="40" width="70" height="44" rx="4" fill={AMBER} opacity="0.9" />
      <rect x="96" y="40" width="30" height="64" rx="3" fill="#231A55" />
      <circle cx="120" cy="74" r="2" fill={AMBER} />
      {/* cup in the window */}
      <path d="M36 56h22v10a11 11 0 0 1-22 0z" fill={CREAM} />
      <path d="M58 60h4a4 4 0 0 1 0 8h-4" stroke={CREAM} stroke-width="2.5" fill="none" />
      <path d="M42 50c-2-3 2-4 0-7M50 50c-2-3 2-4 0-7" stroke={CREAM} stroke-width="1.5" fill="none" stroke-linecap="round" />
    </g>
    {/* growth line */}
    <path d="M180 30l22-10 16 8 28-20" stroke={TEAL} stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M238 8h10v10" stroke={TEAL} stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <rect y="140" width="360" height="10" fill="#1A1440" />
  </>
);

const CAMPUS = (
  <>
    <Sky id="cp" from="#1F3A6E" to="#5A4DA8" />
    <Stars seed={9} n={6} h={30} />
    {/* old university hall */}
    <g transform="translate(70 34)">
      <path d="M0 40L110 0l110 40z" fill={CREAM} opacity="0.92" />
      <circle cx="110" cy="26" r="7" fill={AMBER} />
      <rect x="6" y="40" width="208" height="8" fill={CREAM} opacity="0.92" />
      {[16, 52, 88, 124, 160, 196].map((x) => (
        <rect key={x} x={x - 6} y="48" width="12" height="52" fill="#E6DCF7" />
      ))}
      <rect x="0" y="100" width="220" height="10" fill={CREAM} opacity="0.92" />
    </g>
    <rect y="144" width="360" height="6" fill="#2E2768" />
    {/* lawn */}
    <path d="M0 150v-10q90-8 180 0t180 0v10z" fill="#1F7A6E" />
    {/* caps in the air */}
    {[
      [40, 40, -18],
      [310, 30, 14],
      [290, 90, -8],
    ].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M-16 0l16-7 16 7-16 7z" fill="#120B30" />
        <path d="M-8 3v6q8 4 16 0V3" fill="#120B30" />
        <path d="M12 2v10" stroke={i === 1 ? CORAL : AMBER} stroke-width="2" />
      </g>
    ))}
  </>
);

const BUNDLE = (
  <>
    <Sky id="bd" from="#2A1A62" to="#FF6B8B" />
    <Stars seed={5} n={18} h={60} />
    {/* four little cards fanned like a hand of cards, one per pack */}
    {[
      { c: '#2E1E4A', a: -24, x: 110, ico: 'moon' },
      { c: '#2B0F45', a: -8, x: 152, ico: 'star' },
      { c: '#3C2C7A', a: 8, x: 194, ico: 'cup' },
      { c: '#1F3A6E', a: 24, x: 236, ico: 'cap' },
    ].map((k) => (
      <g key={k.x} transform={`translate(${k.x} 130) rotate(${k.a})`}>
        <rect x="-26" y="-104" width="52" height="76" rx="8" fill={k.c} stroke={CREAM} stroke-width="2.5" />
        {k.ico === 'moon' && <path d="M6-78a12 12 0 1 1-12-10 10 10 0 0 0 12 10z" fill={CREAM} />}
        {k.ico === 'star' && <path d="m0-86 4 8.5 9 1-6.6 6 1.8 9L0-66l-8.2 4.5 1.8-9-6.6-6 9-1z" fill={AMBER} />}
        {k.ico === 'cup' && (
          <g fill={CREAM}>
            <path d="M-11-80h18v8a9 9 0 0 1-18 0z" />
            <path d="M7-78h3a3 3 0 0 1 0 6H7" stroke={CREAM} stroke-width="2" fill="none" />
          </g>
        )}
        {k.ico === 'cap' && (
          <g fill={CREAM}>
            <path d="M-14-76l14-6 14 6-14 6z" />
            <path d="M-7-73v5q7 4 14 0v-5" />
          </g>
        )}
        <path d="M-14-46h28M-14-38h18" stroke={CREAM} stroke-width="2.5" stroke-linecap="round" opacity="0.5" />
      </g>
    ))}
  </>
);

const PLUS = (
  <>
    <Sky id="pl" from="#1E1A50" to="#4A2B7A" />
    <Stars seed={11} n={20} h={120} />
    {/* the pocket watch with its chain */}
    <g transform="translate(180 78)">
      <path d="M0-52c-30-6-70 4-110 30" stroke={AMBER} stroke-width="2.5" stroke-dasharray="5 4" fill="none" />
      <rect x="-7" y="-60" width="14" height="10" rx="3" fill={AMBER} />
      <circle r="46" fill={AMBER} />
      <circle r="38" fill={CREAM} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M0-34v6" stroke="#2A1B57" stroke-width={i % 3 ? 1.5 : 3} transform={`rotate(${i * 30})`} />
      ))}
      <path d="M0 0V-22M0 0l14 8" stroke="#2A1B57" stroke-width="3" stroke-linecap="round" />
      <circle r="3" fill={CORAL} />
    </g>
    <path d="m290 40 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={TEAL} />
    <path d="m70 96 2.4 5.6 5.6 2.4-5.6 2.4L70 112l-2.4-5.6-5.6-2.4 5.6-2.4z" fill={CORAL} />
  </>
);

const COVERS: Record<string, preact.JSX.Element> = {
  'bundle.all': BUNDLE,
  'free.culture_tr': TURKIYE,
  'pack.crime_world': CRIME,
  'pack.fame': FAME,
  'pack.boss': BOSS,
  'pack.campus': CAMPUS,
  'premium.no_ads': PLUS,
};

export const hasCover = (id: string) => id in COVERS;

export function Cover({ id, height = 150 }: { id: string; height?: number }) {
  const art = COVERS[id];
  if (!art) return null;
  return (
    <svg class="cover" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" style={{ height: `${height}px` }} aria-hidden="true">
      {art}
    </svg>
  );
}

/** Theme cards show the theme itself: its background, surfaces and four stat colors. */
export function ThemeSwatch({ tokens, height = 96 }: { tokens: Record<string, string>; height?: number }) {
  const t = (k: string) => tokens[k];
  return (
    <svg class="cover" viewBox="0 0 360 96" preserveAspectRatio="xMidYMid slice" style={{ height: `${height}px` }} aria-hidden="true">
      <rect width="360" height="96" fill={t('--bg')} />
      <rect x="20" y="18" width="150" height="60" rx="12" fill={t('--surface')} />
      <rect x="34" y="32" width="70" height="10" rx="5" fill={t('--text')} opacity="0.85" />
      <rect x="34" y="52" width="110" height="8" rx="4" fill={t('--muted')} opacity="0.6" />
      {['--stat-happiness', '--stat-health', '--stat-smarts', '--stat-looks'].map((k, i) => (
        <g key={k}>
          <circle cx={210 + i * 36} cy="40" r="13" fill="none" stroke={t('--surface-2')} stroke-width="5" />
          <circle cx={210 + i * 36} cy="40" r="13" fill="none" stroke={t(k)} stroke-width="5" stroke-dasharray={`${40 + i * 10} 100`} transform={`rotate(-90 ${210 + i * 36} 40)`} />
        </g>
      ))}
      <rect x="196" y="64" width="140" height="14" rx="7" fill={t('--accent')} />
    </svg>
  );
}
