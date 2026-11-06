import type { JSX } from 'preact';

/**
 * Hand-drawn flat-vector keepsakes, one per heirloom id (engine/heirlooms.ts), on a 96x96 grid.
 * Palette "Heirloom Dusk": night #1B1446, deep #0C0B26, coral #FF6B8B, amber #FFB347, teal #00E5D1, cream #FFF4EC
 * plus tints. One warm light from the upper left: a cream sheen on the lit side, a soft shadow on the floor.
 * Adding a heirloom later = one entry in ART below (unknown ids get the keepsake box).
 */

const NIGHT = '#1B1446';
const DEEP = '#0C0B26';
const CORAL = '#FF6B8B';
const AMBER = '#FFB347';
const TEAL = '#00E5D1';
const CREAM = '#FFF4EC';

/** Linear gradient from the lit top-left to the shaded bottom-right. */
function G({ id, a, b }: { id: string; a: string; b: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color={a} />
      <stop offset="1" stop-color={b} />
    </linearGradient>
  );
}

const Shadow = ({ cx = 48, cy = 87, rx = 28 }: { cx?: number; cy?: number; rx?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry="4.5" fill={DEEP} opacity="0.4" />
);

type Art = (p: string) => JSX.Element;

const ART: Record<string, Art> = {
  // mantel clock with an arched top, a cream face and a swinging pendulum
  clock: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFC970" b="#D9822B" />
        <G id={`${p}b`} a={CREAM} b="#EBCFB8" />
      </defs>
      <Shadow />
      <rect x="22" y="76" width="52" height="8" rx="3" fill="#B86A1F" />
      <path d="M26 78V38a22 22 0 0 1 44 0v40z" fill={`url(#${p}a)`} />
      <path d="M30 76V38a18 18 0 0 1 36 0v38z" fill="none" stroke="#FFE2A8" stroke-width="1.6" opacity="0.7" />
      <circle cx="48" cy="38" r="15" fill={`url(#${p}b)`} />
      <circle cx="48" cy="38" r="15" fill="none" stroke="#B86A1F" stroke-width="2" />
      <path d="M48 26v3M48 47v3M36 38h3M57 38h3" stroke={NIGHT} stroke-width="1.8" stroke-linecap="round" />
      <path d="M48 38V30M48 38l6 3.5" stroke={NIGHT} stroke-width="2.4" stroke-linecap="round" />
      <circle cx="48" cy="38" r="2" fill={CORAL} />
      <path d="M48 56v10" stroke="#8A4D14" stroke-width="1.6" />
      <circle cx="48" cy="68" r="4.2" fill={CREAM} stroke="#B86A1F" stroke-width="1.4" />
      <path d="M28 40V30" stroke="#FFF4EC" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    </>
  ),

  // a gold band with a teal stone, resting on a coral cushion
  ring: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FF8FA8" b="#C23F65" />
        <G id={`${p}b`} a="#FFD27D" b="#D9822B" />
        <G id={`${p}c`} a="#9CFFF3" b="#00B3A4" />
      </defs>
      <Shadow rx={32} cy={84} />
      <path d="M12 70c0-6 6-10 14-10h44c8 0 14 4 14 10v6c0 6-6 9-14 9H26c-8 0-14-3-14-9z" fill={`url(#${p}a)`} />
      <path d="M18 68c10-5 50-5 60 0" stroke="#FFC0CF" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round" />
      <circle cx="48" cy="52" r="18" fill="none" stroke={`url(#${p}b)`} stroke-width="7" />
      <path d="M33 46a18 18 0 0 1 12-9" stroke="#FFF1C9" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85" />
      <path d="M38 22l5-8h10l5 8-10 13z" fill={`url(#${p}c)`} />
      <path d="M38 22h20M43 14l5 21M53 14l-5 21" stroke={CREAM} stroke-width="1.2" opacity="0.7" />
      <path d="M72 14v8M68 18h8M24 22v5M21.5 24.5h5" stroke={CREAM} stroke-width="2" stroke-linecap="round" />
    </>
  ),

  // upright piano with cream keys and an open sheet
  piano: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#4A3C9A" b={NIGHT} />
        <G id={`${p}b`} a={CREAM} b="#E6C8B2" />
      </defs>
      <Shadow rx={32} />
      <rect x="14" y="16" width="68" height="46" rx="5" fill={`url(#${p}a)`} />
      <rect x="10" y="12" width="76" height="8" rx="3" fill="#6153B8" />
      <path d="M18 24h60" stroke="#8A7CD6" stroke-width="1.5" opacity="0.6" />
      <path d="M28 30h40M28 36h40M28 42h40" stroke={AMBER} stroke-width="1.4" opacity="0.8" />
      <rect x="22" y="22" width="24" height="18" rx="1.5" fill={`url(#${p}b)`} transform="rotate(-4 34 31)" />
      <path d="M26 27h16M26 31h16M26 35h12" stroke={NIGHT} stroke-width="1.2" opacity="0.5" transform="rotate(-4 34 31)" />
      <circle cx="56" cy="31" r="3" fill={AMBER} opacity="0.9" />
      <rect x="10" y="56" width="76" height="12" rx="3" fill={`url(#${p}b)`} />
      <path d="M20 56v12M30 56v12M40 56v12M50 56v12M60 56v12M70 56v12M80 56v12" stroke="#CDB09B" stroke-width="1" />
      <path d="M17 56h5v7h-5zM27 56h5v7h-5zM47 56h5v7h-5zM57 56h5v7h-5zM67 56h5v7h-5z" fill={NIGHT} />
      <rect x="14" y="68" width="68" height="6" rx="2" fill="#2A2070" />
      <path d="M20 74v10M76 74v10" stroke="#2A2070" stroke-width="6" stroke-linecap="round" />
    </>
  ),

  // a folded patchwork quilt with stitched border
  quilt: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFF4EC" b="#EBCFB8" />
      </defs>
      <Shadow rx={30} cy={86} />
      <g transform="rotate(-5 48 48)">
        <rect x="14" y="16" width="68" height="64" rx="5" fill={`url(#${p}a)`} />
        <rect x="19" y="21" width="58" height="54" rx="2" fill="none" stroke={CORAL} stroke-width="1.4" stroke-dasharray="3 2.4" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const cols = [CORAL, AMBER, TEAL, '#7B61FF', CREAM];
            const f = cols[(r * 2 + c * 3) % 4];
            return (
              <g key={`${r}${c}`}>
                <rect x={22 + c * 18.3} y={24 + r * 16.6} width="16" height="14.6" rx="1.5" fill={f} opacity={(r + c) % 2 ? 0.95 : 0.78} />
                <path d={`M${22 + c * 18.3} ${24 + r * 16.6}l16 14.6M${38 + c * 18.3} ${24 + r * 16.6}l-16 14.6`} stroke={CREAM} stroke-width="0.9" opacity="0.55" />
              </g>
            );
          }),
        )}
        <path d="M16 20c20-4 40-4 62 0" stroke="#FFF" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round" />
      </g>
    </>
  ),

  // a recipe book with a spoon on the cover and a bookmark
  recipes: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FF8FA8" b="#C23F65" />
      </defs>
      <Shadow rx={26} />
      <rect x="22" y="14" width="54" height="68" rx="5" fill="#8E2C4B" />
      <rect x="26" y="14" width="50" height="66" rx="3" fill={CREAM} />
      <path d="M28 72h46" stroke="#EBCFB8" stroke-width="2" />
      <path d="M20 12h50a6 6 0 0 1 6 6v58a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill={`url(#${p}a)`} />
      <rect x="16" y="12" width="9" height="68" rx="3" fill="#B8365A" />
      <path d="M21 20v52" stroke="#FFC0CF" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7" />
      <circle cx="50" cy="42" r="14" fill={CREAM} />
      <circle cx="50" cy="42" r="14" fill="none" stroke={AMBER} stroke-width="2" />
      <ellipse cx="50" cy="35.5" rx="4.2" ry="5.5" fill={CORAL} />
      <path d="M50 40v15" stroke={CORAL} stroke-width="3.2" stroke-linecap="round" />
      <path d="M40 22h20M44 66h12" stroke={CREAM} stroke-width="2" stroke-linecap="round" opacity="0.8" />
      <path d="M62 80v10l4-3 4 3V80z" fill={AMBER} />
      <path d="M22 18h46" stroke="#FFF" stroke-width="1.6" opacity="0.4" stroke-linecap="round" />
    </>
  ),

  // a gold cup on a plinth
  trophy: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFE3A3" b="#E08A22" />
        <G id={`${p}b`} a="#4A3C9A" b={NIGHT} />
      </defs>
      <Shadow rx={26} />
      <path d="M30 22c-14 0-14 20 4 26M66 22c14 0 14 20-4 26" fill="none" stroke="#E08A22" stroke-width="5" stroke-linecap="round" />
      <path d="M28 14h40v16c0 14-8 22-20 24-12-2-20-10-20-24z" fill={`url(#${p}a)`} />
      <path d="M34 18v12c0 8 3 14 8 18" stroke="#FFF7DD" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8" />
      <path d="M48 24l3 6.2 6.8.8-5 4.7 1.3 6.6L48 39l-6.1 3.3 1.3-6.6-5-4.7 6.8-.8z" fill={CORAL} />
      <rect x="43" y="54" width="10" height="12" fill="#E08A22" />
      <path d="M37 68h22l3 6H34z" fill="#F2A63A" />
      <rect x="26" y="74" width="44" height="12" rx="3" fill={`url(#${p}b)`} />
      <rect x="40" y="78" width="16" height="4" rx="1.5" fill={AMBER} opacity="0.9" />
    </>
  ),

  // a gilt-framed landscape, hanging slightly askew from its cord
  painting: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFD27D" b="#C9741A" />
        <linearGradient id={`${p}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2A2070" />
          <stop offset="0.7" stop-color="#E96A8A" />
          <stop offset="1" stop-color={AMBER} />
        </linearGradient>
        <clipPath id={`${p}c`}>
          <rect x="22" y="30" width="52" height="42" rx="1" />
        </clipPath>
      </defs>
      <Shadow rx={26} cy={88} />
      <g transform="rotate(-3 48 48)">
        <path d="M48 6L24 30M48 6l24 24" stroke="#C9741A" stroke-width="1.6" fill="none" />
        <circle cx="48" cy="6" r="2.6" fill={AMBER} />
        <rect x="14" y="24" width="68" height="56" rx="4" fill={`url(#${p}a)`} />
        <rect x="19" y="29" width="58" height="46" rx="2" fill="#8A4D14" />
        <g clip-path={`url(#${p}c)`}>
          <rect x="22" y="30" width="52" height="42" fill={`url(#${p}s)`} />
          <circle cx="56" cy="54" r="9" fill={CREAM} opacity="0.95" />
          <path d="M22 62c8-8 14-8 22-2s16-10 30-6v18H22z" fill="#4A3C9A" />
          <path d="M22 68c10-5 20-3 28 0s16 0 24-3v7H22z" fill={TEAL} opacity="0.85" />
          <path d="M30 40l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill={CREAM} opacity="0.8" />
        </g>
        <path d="M18 28h60" stroke="#FFF1C9" stroke-width="1.8" opacity="0.7" stroke-linecap="round" />
      </g>
    </>
  ),

  // a folding camera of leather and chrome
  camera: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FF8FA8" b="#B8365A" />
        <G id={`${p}b`} a={CREAM} b="#D8BBA6" />
        <radialGradient id={`${p}l`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#5BE9D9" />
          <stop offset="0.45" stop-color="#2A2070" />
          <stop offset="1" stop-color={DEEP} />
        </radialGradient>
      </defs>
      <Shadow rx={32} />
      <rect x="10" y="30" width="76" height="48" rx="7" fill={`url(#${p}a)`} />
      <path d="M10 44h76v22H10z" fill="#FFF4EC" opacity="0.14" />
      <path d="M10 37a7 7 0 0 1 7-7h62a7 7 0 0 1 7 7v4H10z" fill={`url(#${p}b)`} />
      <rect x="18" y="20" width="18" height="12" rx="2.5" fill={`url(#${p}b)`} />
      <rect x="22" y="23" width="10" height="6" rx="1" fill={AMBER} opacity="0.85" />
      <rect x="62" y="22" width="14" height="9" rx="3" fill="#9C93C9" />
      <circle cx="48" cy="54" r="21" fill={`url(#${p}b)`} />
      <circle cx="48" cy="54" r="17" fill={NIGHT} />
      <circle cx="48" cy="54" r="13" fill={`url(#${p}l)`} />
      <circle cx="48" cy="54" r="13" fill="none" stroke="#6153B8" stroke-width="1.5" />
      <path d="M40 48a10 10 0 0 1 8-5" stroke={CREAM} stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.85" />
      <circle cx="53" cy="59" r="2" fill={TEAL} opacity="0.9" />
      <circle cx="19" cy="48" r="3" fill={AMBER} />
      <path d="M12 70h14M70 70h14" stroke="#FFC0CF" stroke-width="1.6" stroke-linecap="round" opacity="0.5" />
    </>
  ),

  // a bundle of old letters tied with string, sealed with a heart
  letters: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFFFFF" b="#EBCFB8" />
      </defs>
      <Shadow rx={30} />
      <g transform="rotate(-9 48 48)">
        <rect x="16" y="26" width="62" height="42" rx="4" fill="#E2C2AA" />
      </g>
      <g transform="rotate(7 48 50)">
        <rect x="18" y="24" width="62" height="44" rx="4" fill="#F6DCC6" />
      </g>
      <rect x="14" y="22" width="68" height="48" rx="4" fill={`url(#${p}a)`} />
      <path d="M14 26l34 24 34-24" stroke="#D9B79E" stroke-width="2" fill="none" stroke-linejoin="round" />
      <path d="M14 68l26-22M82 68L56 46" stroke="#E8CDB8" stroke-width="1.6" fill="none" />
      <path d="M28 22v48" stroke={AMBER} stroke-width="3.2" />
      <path d="M28 46c-5-6-10-3-8 1M28 46c5-6 10-3 8 1" stroke={AMBER} stroke-width="2.2" fill="none" stroke-linecap="round" />
      <path d="M26 48l-3 8M30 48l3 8" stroke={AMBER} stroke-width="2.2" stroke-linecap="round" />
      <path d="M58 52c-6-5-10-8-10-12a5.6 5.6 0 0 1 10-3 5.6 5.6 0 0 1 10 3c0 4-4 7-10 12z" fill={CORAL} transform="translate(-2 6) scale(1.06)" />
      <path d="M54 43a3 3 0 0 1 3-3" stroke="#FFC0CF" stroke-width="1.6" stroke-linecap="round" fill="none" transform="translate(0 6)" />
    </>
  ),

  // a teapot and one cup on a saucer, steam rising
  teaset: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#6BF2E3" b="#00998C" />
        <G id={`${p}b`} a={CREAM} b="#E2C2AA" />
      </defs>
      <Shadow rx={34} />
      <path d="M26 20c-3 6-1 8 2 10M38 16c-3 6-1 9 2 12" stroke={CREAM} stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.6" />
      <path d="M22 50c-12 0-12 16 0 16" stroke="#00998C" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M64 46l22-14" stroke="#00998C" stroke-width="5" stroke-linecap="round" />
      <path d="M22 52c0-10 8-16 20-16s20 6 20 16v10c0 8-8 14-20 14S22 70 22 62z" fill={`url(#${p}a)`} />
      <path d="M26 50c2-6 7-10 13-11" stroke="#C8FFF8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8" />
      <rect x="28" y="32" width="28" height="6" rx="3" fill="#00998C" />
      <circle cx="42" cy="29" r="4" fill={AMBER} />
      <path d="M24 56c10 4 28 4 36 0" stroke={AMBER} stroke-width="3" fill="none" opacity="0.9" />
      <ellipse cx="72" cy="78" rx="19" ry="5" fill={`url(#${p}b)`} />
      <path d="M58 64h28v6c0 7-6 10-14 10s-14-3-14-10z" fill={`url(#${p}b)`} />
      <path d="M86 66c6 0 6 8 0 8" stroke="#E2C2AA" stroke-width="3" fill="none" stroke-linecap="round" />
      <ellipse cx="72" cy="64" rx="14" ry="3.4" fill={CORAL} />
      <path d="M62 70c1 5 4 7 8 8" stroke="#FFF" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.7" />
    </>
  ),

  // a sewing machine: arm, needle bar, coral spool and a hand wheel
  sewing: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#4A3C9A" b={NIGHT} />
        <G id={`${p}b`} a="#FFD27D" b="#D9822B" />
      </defs>
      <Shadow rx={34} />
      <rect x="10" y="68" width="76" height="14" rx="5" fill="#2A2070" />
      <path d="M16 68V32a14 14 0 0 1 14-14h44a10 10 0 0 1 10 10v12a4 4 0 0 1-4 4H68v34z" fill={`url(#${p}a)`} />
      <path d="M22 66V34a10 10 0 0 1 10-10h40" stroke="#8A7CD6" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7" />
      <rect x="30" y="6" width="14" height="14" rx="2.5" fill="#E2C2AA" />
      <rect x="30" y="9" width="14" height="8" fill={CORAL} />
      <path d="M44 14h8c6 0 8 4 8 10" stroke={CORAL} stroke-width="1.4" fill="none" />
      <path d="M76 44v18" stroke="#C9C2E8" stroke-width="2.4" stroke-linecap="round" />
      <path d="M76 62l-2.5 5h5z" fill="#C9C2E8" />
      <path d="M52 70h30" stroke={AMBER} stroke-width="2.4" stroke-linecap="round" />
      <circle cx="30" cy="48" r="11" fill="none" stroke={`url(#${p}b)`} stroke-width="5" />
      <circle cx="30" cy="48" r="3" fill={AMBER} />
      <path d="M22 44a9 9 0 0 1 6-6" stroke="#FFF1C9" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M14 76v8M82 76v8" stroke="#2A2070" stroke-width="5" stroke-linecap="round" />
    </>
  ),

  // a wooden valve radio with a glowing dial
  radio: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FFC970" b="#C9741A" />
        <G id={`${p}b`} a="#3A2E84" b={DEEP} />
      </defs>
      <Shadow rx={34} />
      <path d="M70 26L84 6" stroke="#C9C2E8" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="84" cy="6" r="2.4" fill={CREAM} />
      <rect x="10" y="26" width="76" height="56" rx="10" fill={`url(#${p}a)`} />
      <path d="M14 34a8 8 0 0 1 8-6h50" stroke="#FFE9BB" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.8" />
      <rect x="17" y="35" width="40" height="38" rx="6" fill={`url(#${p}b)`} />
      <path d="M23 43h28M23 49h28M23 55h28M23 61h28M23 67h28" stroke={AMBER} stroke-width="1.8" stroke-linecap="round" opacity="0.75" />
      <rect x="62" y="35" width="18" height="16" rx="3" fill={DEEP} />
      <path d="M65 45h12" stroke={TEAL} stroke-width="2" stroke-linecap="round" />
      <path d="M71 38v7" stroke={CORAL} stroke-width="2" stroke-linecap="round" />
      <circle cx="66" cy="63" r="5" fill={CREAM} />
      <circle cx="66" cy="63" r="5" fill="none" stroke="#8A4D14" stroke-width="1.4" />
      <path d="M66 59.5v3" stroke="#8A4D14" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="78" cy="68" r="3.4" fill={CREAM} />
      <path d="M20 82v4M76 82v4" stroke="#8A4D14" stroke-width="4" stroke-linecap="round" />
    </>
  ),

  // a woven kilim rug with diamond medallions and fringe
  kilim: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#E2476F" b="#A52F52" />
      </defs>
      <Shadow rx={34} cy={85} />
      <g transform="skewX(-8) translate(7 0)">
        <path d="M14 18v-5M24 18v-5M34 18v-5M44 18v-5M54 18v-5M64 18v-5M74 18v-5M84 18v-5M14 76v6M24 76v6M34 76v6M44 76v6M54 76v6M64 76v6M74 76v6M84 76v6" stroke={CREAM} stroke-width="2" stroke-linecap="round" />
        <rect x="10" y="18" width="78" height="58" rx="2" fill={`url(#${p}a)`} />
        <rect x="14" y="22" width="70" height="50" fill="none" stroke={AMBER} stroke-width="2" />
        <path d="M14 27h70M14 67h70" stroke={CREAM} stroke-width="1.4" stroke-dasharray="4 3" opacity="0.8" />
        <path d="M49 28l20 20-20 20-20-20z" fill={AMBER} />
        <path d="M49 34l14 14-14 14-14-14z" fill={NIGHT} />
        <path d="M49 40l8 8-8 8-8-8z" fill={TEAL} />
        <path d="M49 45l3 3-3 3-3-3z" fill={CREAM} />
        <path d="M20 40l6 8-6 8-6-8zM78 40l6 8-6 8-6-8z" fill={CREAM} transform="translate(0 0)" />
        <path d="M20 44l3 4-3 4-3-4zM78 44l3 4-3 4-3-4z" fill={CORAL} />
        <path d="M14 22h70" stroke="#FFF" stroke-width="1.6" opacity="0.35" />
      </g>
    </>
  ),

  // a typewriter with a sheet in the roller
  typewriter: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#4FFFF0" b="#00998C" />
        <G id={`${p}b`} a="#4A3C9A" b={NIGHT} />
      </defs>
      <Shadow rx={34} />
      <rect x="30" y="6" width="36" height="34" rx="2" fill={CREAM} transform="rotate(-3 48 24)" />
      <path d="M36 14h24M36 20h24M36 26h16" stroke="#9C93C9" stroke-width="1.6" stroke-linecap="round" transform="rotate(-3 48 24)" />
      <rect x="22" y="34" width="52" height="8" rx="4" fill={`url(#${p}b)`} />
      <circle cx="20" cy="38" r="4" fill={AMBER} />
      <circle cx="76" cy="38" r="4" fill={AMBER} />
      <path d="M12 82V60c0-8 6-14 16-14h40c10 0 16 6 16 14v22z" fill={`url(#${p}a)`} />
      <path d="M18 60c0-5 4-8 10-8h22" stroke="#D9FFFB" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.8" />
      <rect x="18" y="62" width="60" height="16" rx="4" fill={NIGHT} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={26 + i * 9.2} cy="67" r="3" fill={CREAM} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={30.6 + i * 9.2} cy="74" r="2.6" fill={CREAM} opacity="0.85" />
      ))}
      <path d="M36 80h24" stroke={CORAL} stroke-width="3" stroke-linecap="round" />
      <path d="M20 82v4M76 82v4" stroke={NIGHT} stroke-width="4" stroke-linecap="round" />
    </>
  ),

  // an open backgammon (tavla) board with counters
  tavla: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#E0974B" b="#9C5516" />
      </defs>
      <Shadow rx={36} cy={83} />
      <rect x="8" y="14" width="80" height="66" rx="6" fill={`url(#${p}a)`} />
      <rect x="13" y="19" width="70" height="56" rx="3" fill="#5C2F0E" />
      <rect x="45" y="19" width="6" height="56" fill={`url(#${p}a)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <path d={`M${14 + i * 6.4} 20l3.2 20 3.2-20z`} fill={i % 2 ? CREAM : CORAL} />
          <path d={`M${52 + i * 6.4} 20l3.2 20 3.2-20z`} fill={i % 2 ? CREAM : CORAL} />
          <path d={`M${14 + i * 6.4} 74l3.2-20 3.2 20z`} fill={i % 2 ? CORAL : CREAM} />
          <path d={`M${52 + i * 6.4} 74l3.2-20 3.2 20z`} fill={i % 2 ? CORAL : CREAM} />
        </g>
      ))}
      <circle cx="17.2" cy="70" r="3.4" fill={TEAL} />
      <circle cx="17.2" cy="62" r="3.4" fill={TEAL} />
      <circle cx="29.6" cy="68" r="3.4" fill={TEAL} />
      <circle cx="55.2" cy="26" r="3.4" fill={AMBER} />
      <circle cx="55.2" cy="34" r="3.4" fill={AMBER} />
      <circle cx="73" cy="28" r="3.4" fill={AMBER} />
      <rect x="62" y="44" width="7" height="7" rx="1.6" fill={CREAM} transform="rotate(14 65 47)" />
      <circle cx="64" cy="46" r="0.9" fill={NIGHT} />
      <circle cx="67" cy="49" r="0.9" fill={NIGHT} />
      <path d="M12 18h72" stroke="#FFD9A6" stroke-width="1.6" opacity="0.6" stroke-linecap="round" />
    </>
  ),

  // a coral toolbox with a wrench across the lid
  toolbox: (p) => (
    <>
      <defs>
        <G id={`${p}a`} a="#FF8FA8" b="#B8365A" />
        <G id={`${p}b`} a="#E5E1F5" b="#8F86C4" />
      </defs>
      <Shadow rx={34} />
      <path d="M32 36V26a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v10" fill="none" stroke="#C9C2E8" stroke-width="5" stroke-linecap="round" />
      <rect x="10" y="34" width="76" height="46" rx="6" fill={`url(#${p}a)`} />
      <path d="M10 52h76" stroke="#8E2C4B" stroke-width="2" />
      <path d="M14 42a4 4 0 0 1 4-4h40" stroke="#FFD0DB" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.8" />
      <rect x="40" y="46" width="16" height="12" rx="3" fill={AMBER} />
      <rect x="45" y="50" width="6" height="4" rx="1" fill="#8A4D14" />
      <rect x="14" y="48" width="6" height="8" rx="2" fill="#8E2C4B" />
      <rect x="76" y="48" width="6" height="8" rx="2" fill="#8E2C4B" />
      <g transform="rotate(-30 62 22)">
        <rect x="46" y="18" width="38" height="7" rx="3.5" fill={`url(#${p}b)`} />
        <path d="M84 21.5m-2.5-6a8 8 0 1 0 0 12v-3.2a4.4 4.4 0 1 1 0-5.6z" fill={`url(#${p}b)`} />
        <circle cx="50" cy="21.5" r="1.8" fill={DEEP} opacity="0.35" />
      </g>
    </>
  ),
};

/** The fallback for an id with no drawing yet: a little keepsake chest, lid ajar, light spilling out. */
const KEEPSAKE: Art = (p) => (
  <>
    <defs>
      <G id={`${p}a`} a="#FFD27D" b="#C9741A" />
      <G id={`${p}b`} a="#7A5BD0" b={NIGHT} />
    </defs>
    <Shadow />
    <path d="M48 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={CREAM} />
    <path d="M30 24l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1zM68 22l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill={AMBER} />
    <rect x="14" y="40" width="68" height="40" rx="6" fill={`url(#${p}b)`} />
    <path d="M14 40h68v8H14z" fill="#2A2070" />
    <path d="M12 38c0-6 4-10 10-10h52c6 0 10 4 10 10v4H12z" fill={`url(#${p}a)`} />
    <path d="M20 33h40" stroke="#FFF1C9" stroke-width="2.4" stroke-linecap="round" opacity="0.8" />
    <path d="M30 40v40M66 40v40" stroke={AMBER} stroke-width="4" opacity="0.9" />
    <rect x="41" y="44" width="14" height="14" rx="3" fill={CORAL} />
    <circle cx="48" cy="50" r="2.6" fill={NIGHT} />
    <path d="M48 52v3" stroke={NIGHT} stroke-width="2" stroke-linecap="round" />
  </>
);

/** Ids that have a drawing (the test compares this with HEIRLOOMS). */
export const HEIRLOOM_ART_IDS = Object.keys(ART);

export function HeirloomArt({ id, size = 96, label }: { id: string; size?: number; label?: string }) {
  const draw = ART[id] ?? KEEPSAKE;
  const p = `ha-${ART[id] ? id : 'box'}-`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      style={{ flex: 'none', display: 'block' }}
    >
      {draw(p)}
    </svg>
  );
}
