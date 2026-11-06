/**
 * Milestone scenes: small hand-drawn vector illustrations in the Heirloom Dusk palette.
 * Flat shapes, one warm light source per scene, faceless figures, no text, no brands. viewBox 360×150.
 */
import type { ComponentChildren } from 'preact';

const NIGHT = '#1B1446';
const DEEP = '#0C0B26';
const CORAL = '#FF6B8B';
const AMBER = '#FFB347';
const TEAL = '#00E5D1';
const CREAM = '#FFF4EC';
const SKIN = ['#F3CDB0', '#E2B08C', '#D9A27E', '#B57A55', '#8A5A3C', '#5E3B27'];
const PLUM = '#3A2470';
const DUSK = '#2A1B57';

type Stop = [number, string, number?];

function Grad({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: Stop[]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, op], i) => (
        <stop key={i} offset={o} stop-color={c} stop-opacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}

function Radial({ id, color = AMBER, op = 0.7 }: { id: string; color?: string; op?: number }) {
  return (
    <radialGradient id={id}>
      <stop offset="0" stop-color={color} stop-opacity={op} />
      <stop offset="0.5" stop-color={color} stop-opacity={op * 0.35} />
      <stop offset="1" stop-color={color} stop-opacity="0" />
    </radialGradient>
  );
}

/** Soft pool of light. */
function Glow({ id, cx, cy, r, ry }: { id: string; cx: number; cy: number; r: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={r} ry={ry ?? r} fill={`url(#${id})`} />;
}

function Sky({ id, stops }: { id: string; stops: Stop[] }) {
  return (
    <>
      <defs>
        <Grad id={id} stops={stops} />
      </defs>
      <rect width="360" height="150" fill={`url(#${id})`} />
    </>
  );
}

function Stars({ seed = 3, n = 16, h = 60, x0 = 0, w = 360 }: { seed?: number; n?: number; h?: number; x0?: number; w?: number }) {
  const pts: [number, number, number][] = [];
  let x = seed * 7919;
  for (let i = 0; i < n; i++) {
    x = (x * 16807) % 2147483647;
    const px = x0 + (x % w);
    x = (x * 16807) % 2147483647;
    pts.push([px, 6 + (x % h), i % 4 === 0 ? 1.5 : 0.9]);
  }
  return (
    <g fill={CREAM}>
      {pts.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} opacity={0.3 + (i % 4) * 0.17} />
      ))}
    </g>
  );
}

function Moon({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.4} fill={CREAM} opacity="0.06" />
      <circle cx={x} cy={y} r={r * 1.6} fill={CREAM} opacity="0.08" />
      <circle cx={x} cy={y} r={r} fill={CREAM} />
      <circle cx={x + r * 0.38} cy={y - r * 0.2} r={r * 0.9} fill={NIGHT} opacity="0.12" />
    </g>
  );
}

interface FigProps {
  x: number;
  y: number;
  s?: number;
  skin?: number;
  cloth?: string;
  pants?: string;
  hair?: string | null;
  dress?: boolean;
  /** Custom arm paths in local coords (stroke in cloth colour). */
  arms?: string;
  flip?: boolean;
  children?: ComponentChildren;
}

/** Faceless standing figure, feet at (x,y), roughly 58 units tall at s=1. */
function Fig({ x, y, s = 1, skin = 1, cloth = CORAL, pants = DUSK, hair = '#2B1B12', dress = false, arms, flip, children }: FigProps) {
  const sk = SKIN[skin];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx="0" cy="0.5" rx="11" ry="2.2" fill={DEEP} opacity="0.35" />
      {dress ? (
        <path d="M-7 -38Q0 -42 7 -38L13 -3Q0 1 -13 -3Z" fill={cloth} />
      ) : (
        <>
          <rect x="-6" y="-22" width="5" height="22" rx="2" fill={pants} />
          <rect x="1" y="-22" width="5" height="22" rx="2" fill={pants} />
          <rect x="-8" y="-41" width="16" height="25" rx="6" fill={cloth} />
        </>
      )}
      {arms ? (
        <path d={arms} stroke={cloth} stroke-width="4.4" stroke-linecap="round" fill="none" />
      ) : (
        <>
          <path d="M-8 -37Q-12 -28 -10 -19" stroke={cloth} stroke-width="4.4" stroke-linecap="round" fill="none" />
          <path d="M8 -37Q12 -28 10 -19" stroke={cloth} stroke-width="4.4" stroke-linecap="round" fill="none" />
          <circle cx="-10" cy="-18" r="2.4" fill={sk} />
          <circle cx="10" cy="-18" r="2.4" fill={sk} />
        </>
      )}
      <rect x="-2.4" y="-47" width="4.8" height="8" rx="2" fill={sk} />
      <circle cx="0" cy="-51" r="7.4" fill={sk} />
      {hair && <path d="M-7.6 -52Q-7 -60 0 -60Q7.6 -60 7.6 -52Q3 -56 -7.6 -52Z" fill={hair} />}
      {/* warm rim from the right */}
      <path d="M5.6 -55Q8.6 -51 5.6 -46" stroke={AMBER} stroke-width="1.3" fill="none" opacity="0.55" stroke-linecap="round" />
      {children}
    </g>
  );
}

/** Dark ground band that grounds the scene. */
function Ground({ y, id, from = DUSK, to = DEEP }: { y: number; id: string; from?: string; to?: string }) {
  return (
    <>
      <defs>
        <Grad id={id} stops={[[0, from], [1, to]]} />
      </defs>
      <rect y={y} width="360" height={150 - y} fill={`url(#${id})`} />
    </>
  );
}

function Lights({ pts, r = 2, id }: { pts: [number, number][]; r?: number; id: string }) {
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 3.4} fill={`url(#${id})`} />
          <circle cx={x} cy={y} r={r} fill={i % 3 === 1 ? CREAM : AMBER} />
        </g>
      ))}
    </g>
  );
}

/** Quadratic sagging string of bulbs between two points. */
function bulbString(x1: number, y1: number, x2: number, y2: number, sag: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag]);
  }
  return out;
}

/* ---------------------------------------------------------------- 1 */
const BIRTH = (
  <>
    <Sky id="bi-sky" stops={[[0, DEEP], [1, PLUM]]} />
    <defs>
      <Radial id="bi-g" op={0.8} />
      <Radial id="bi-g2" op={0.45} />
      <Grad id="bi-win" stops={[[0, '#3C2A86'], [1, '#6B3E8E']]} />
      <Grad id="bi-beam" stops={[[0, AMBER, 0.38], [1, AMBER, 0]]} x2={0.55} y2={1} />
    </defs>
    <Stars seed={5} n={10} h={30} />
    {/* window with a night garden outside, frame and sill */}
    <rect x="22" y="14" width="104" height="118" rx="6" fill="#2D1D66" />
    <rect x="30" y="22" width="88" height="102" rx="3" fill="url(#bi-win)" />
    <Stars seed={9} n={9} h={40} x0={34} w={80} />
    <Moon x={92} y={44} r={9} />
    <path d="M30 124V100Q50 88 70 98T118 92V124Z" fill={DEEP} opacity="0.7" />
    <path d="M74 22V124M30 72H118" stroke="#2D1D66" stroke-width="4" />
    <rect x="16" y="130" width="116" height="7" rx="3" fill="#3A2A7E" />
    {/* the window light spills across the floor */}
    <path d="M126 20L330 120L150 150L126 132Z" fill="url(#bi-beam)" />
    <Ground y={134} id="bi-floor" from="#2A1B57" to={DEEP} />
    <Glow id="bi-g2" cx={236} cy={92} r={110} ry={64} />
    {/* two hands cupped under the swaddled newborn */}
    <g transform="translate(236 88)">
      <Glow id="bi-g" cx={0} cy={-6} r={60} ry={44} />
      <path d="M-62 40C-56 24 -30 12 -4 18L-2 30C-26 28 -42 36 -52 50Z" fill={SKIN[2]} />
      <path d="M62 40C56 24 30 12 4 18L2 30C26 28 42 36 52 50Z" fill={SKIN[4]} />
      <path d="M-30 18C-32 0 -22 -20 0 -20C22 -20 32 0 30 18C16 28 -16 28 -30 18Z" fill={CREAM} />
      <path d="M-24 4C-6 14 12 14 28 4" stroke="#F1D6C6" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M-18 14C-4 22 10 22 22 14" stroke="#F1D6C6" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8" />
      <circle cx="0" cy="-15" r="14" fill={SKIN[1]} />
      <path d="M-9 -24Q0 -33 9 -24Q0 -28 -9 -24Z" fill="#6B4423" />
      <path d="M-14 -14Q-18 -6 -12 0" stroke={CREAM} stroke-width="5" fill="none" stroke-linecap="round" opacity="0.9" />
      <path d="M9 -22Q14 -16 12 -9" stroke={AMBER} stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7" />
    </g>
    <g fill={AMBER} opacity="0.85">
      <path d="M180 40l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" />
      <path d="M300 30l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 2 */
const FIRST_DAY_SCHOOL = (
  <>
    <Sky id="fd-sky" stops={[[0, '#3A2470'], [0.55, '#C0577F'], [1, AMBER]]} />
    <defs>
      <Radial id="fd-sun" op={0.95} />
      <Grad id="fd-path" stops={[[0, '#6E3A66'], [1, '#2A1B57']]} />
      <Grad id="fd-door" stops={[[0, '#FFD07A'], [1, '#FF9F4D']]} />
      <Radial id="fd-lamp" op={0.8} />
    </defs>
    <Stars seed={2} n={8} h={26} />
    <Glow id="fd-sun" cx={250} cy={88} r={120} ry={80} />
    <circle cx="250" cy="92" r="20" fill={CREAM} opacity="0.95" />
    {/* hills behind */}
    <path d="M0 110Q60 86 130 104T260 98T360 108V150H0Z" fill="#6E3A66" opacity="0.8" />
    {/* the school building with a big arched gate */}
    <g>
      <path d="M150 40h200v90H150z" fill={DUSK} />
      <path d="M150 40h200v10H150z" fill="#43307F" />
      <path d="M148 40L250 12L352 40Z" fill="#43307F" />
      <circle cx="250" cy="30" r="6" fill={AMBER} />
      {[170, 205, 295, 330].map((x) => (
        <g key={x}>
          <rect x={x - 9} y="62" width="18" height="24" rx="9" fill="url(#fd-door)" />
          <path d={`M${x} 62V86M${x - 9} 76H${x + 9}`} stroke={DUSK} stroke-width="2" />
        </g>
      ))}
      <path d="M222 130V92a28 28 0 0 1 56 0v38Z" fill="#FFD07A" />
      <path d="M232 130V94a18 18 0 0 1 36 0v36Z" fill="#FFF0C4" />
      <path d="M222 92a28 28 0 0 1 56 0" stroke={CREAM} stroke-width="3" fill="none" />
    </g>
    <path d="M0 130H360V150H0Z" fill={DUSK} />
    <path d="M214 130L190 150H310L286 130Z" fill="url(#fd-path)" />
    {/* fence on the left */}
    <g fill="#43307F">
      <rect x="0" y="118" width="148" height="3" />
      {Array.from({ length: 16 }).map((_, i) => (
        <rect key={i} x={6 + i * 9.4} y="108" width="3" height="24" rx="1.5" />
      ))}
    </g>
    {/* parent in the back, child with the big backpack in front */}
    <Fig x={90} y={140} s={1.25} skin={3} cloth={TEAL} pants="#1F3B63" hair="#1F1F1F" arms="M-8 -37Q-14 -26 -12 -18M8 -37Q20 -34 26 -30" />
    <Fig x={142} y={146} s={0.8} skin={1} cloth={AMBER} pants="#24408C" hair="#6B4423" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q-24 -30 -26 -28">
      <rect x="-15" y="-42" width="9" height="22" rx="4" fill={CORAL} />
      <rect x="-14" y="-28" width="7" height="6" rx="2" fill="#B33B5B" />
    </Fig>
    <path d="M115 120Q128 112 136 124" stroke={SKIN[3]} stroke-width="3.4" stroke-linecap="round" fill="none" />
    <g transform="translate(330 128)">
      <Glow id="fd-lamp" cx={0} cy={-12} r={22} />
      <rect x="-1.5" y="-12" width="3" height="22" fill={DEEP} />
      <circle cx="0" cy="-14" r="4" fill={CREAM} />
    </g>
    <g fill={CREAM} opacity="0.85">
      <path d="M40 40q4-5 8 0q4-5 8 0" stroke={CREAM} stroke-width="1.4" fill="none" />
      <path d="M90 28q3-4 6 0q3-4 6 0" stroke={CREAM} stroke-width="1.2" fill="none" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 3 */
function Cap({ x, y, r, c = DEEP }: { x: number; y: number; r: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M-12 0L0 -5L12 0L0 5Z" fill={c} />
      <path d="M-6 3V8Q0 11 6 8V3" fill={c} opacity="0.85" />
      <path d="M0 0L9 3V12" stroke={AMBER} stroke-width="1.5" fill="none" />
      <circle cx="9" cy="13" r="1.8" fill={AMBER} />
    </g>
  );
}

const GRADUATION = (
  <>
    <Sky id="gr-sky" stops={[[0, '#2A1B6B'], [0.6, '#A8497E'], [1, '#FF9A5C']]} />
    <defs>
      <Radial id="gr-sun" op={0.9} />
      <Radial id="gr-b" op={0.8} />
    </defs>
    <Stars seed={11} n={9} h={30} />
    <Glow id="gr-sun" cx={180} cy={108} r={150} ry={70} />
    <circle cx="180" cy="116" r="24" fill={CREAM} opacity="0.92" />
    {/* hall behind */}
    <path d="M0 108Q90 90 180 100T360 104V150H0Z" fill="#5A2F6B" />
    <g fill="#43307F">
      <path d="M40 100V70L70 56L100 70V100Z" />
      <path d="M260 100V70L290 56L320 70V100Z" />
    </g>
    <Lights id="gr-b" pts={[...bulbString(10, 64, 175, 58, 14, 7), ...bulbString(185, 58, 350, 64, 14, 7)]} r={1.8} />
    {/* tossed caps */}
    <Cap x={70} y={34} r={-24} c={DEEP} />
    <Cap x={132} y={20} r={14} c={NIGHT} />
    <Cap x={200} y={30} r={-8} c={DEEP} />
    <Cap x={262} y={16} r={22} c="#2A1B57" />
    <Cap x={314} y={42} r={-16} c={NIGHT} />
    {/* graduates in gowns, arms up */}
    <Fig x={98} y={134} s={1.15} skin={2} cloth="#2A1B57" pants="#2A1B57" hair="#3B2418" arms="M-8 -37Q-18 -48 -20 -62M8 -37Q18 -48 20 -62" />
    <Fig x={160} y={140} s={1.3} skin={4} cloth="#43307F" pants="#43307F" hair="#1F1F1F" arms="M-8 -37Q-20 -46 -22 -66M8 -37Q20 -46 22 -66">
      <path d="M-8 -36L-8 -4M8 -36L8 -4" stroke={CORAL} stroke-width="2.2" />
    </Fig>
    <Fig x={222} y={136} s={1.2} skin={0} cloth="#2A1B57" pants="#2A1B57" hair="#D8B56A" dress arms="M-7 -37Q-18 -46 -22 -60M7 -37Q18 -46 20 -62" />
    <Fig x={282} y={138} s={1.1} skin={5} cloth="#43307F" pants="#43307F" hair="#1F1F1F" arms="M-8 -37Q-18 -50 -16 -64M8 -37Q18 -46 22 -58" />
    {/* applauding crowd, backlit silhouettes */}
    <path d="M0 150V132Q10 124 20 134Q30 118 44 132Q56 120 66 134Q80 126 90 140V150Z" fill={DEEP} />
    <path d="M250 150V138Q262 124 274 138Q288 126 298 138Q312 120 324 136Q340 126 360 134V150Z" fill={DEEP} />
    <path d="M120 150V144Q132 136 142 146Q156 138 168 146V150Z" fill={DEEP} opacity="0.9" />
    <g fill={CORAL}>
      <circle cx="26" cy="132" r="3" />
      <circle cx="304" cy="126" r="3" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 4 */
const FIRST_JOB = (
  <>
    <Sky id="fj-sky" stops={[[0, '#201559'], [1, '#6E3A66']]} />
    <defs>
      <Radial id="fj-g" op={0.75} />
      <Grad id="fj-lit" stops={[[0, '#FFE2A0'], [1, '#FF9F4D']]} />
      <Grad id="fj-bld" stops={[[0, '#392872'], [1, '#241A5A']]} />
    </defs>
    <Stars seed={7} n={12} h={40} />
    <Moon x={40} y={32} r={8} />
    {/* neighbouring towers */}
    <rect x="6" y="64" width="64" height="86" fill="#2A1F66" />
    <rect x="300" y="52" width="54" height="98" fill="#2A1F66" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={14 + (i % 3) * 18} y={72 + Math.floor(i / 3) * 18} width="8" height="8" fill={i % 5 === 0 ? AMBER : '#43307F'} opacity={i % 5 === 0 ? 0.8 : 1} />
    ))}
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={306 + (i % 3) * 15} y={60 + Math.floor(i / 3) * 18} width="7" height="8" fill={i % 4 === 1 ? AMBER : '#43307F'} opacity={i % 4 === 1 ? 0.8 : 1} />
    ))}
    {/* the workplace itself: a lit glass entrance */}
    <rect x="96" y="30" width="170" height="120" fill="url(#fj-bld)" />
    <rect x="96" y="30" width="170" height="8" fill="#4A3790" />
    <path d="M92 30h178" stroke={CORAL} stroke-width="3" />
    <rect x="112" y="50" width="38" height="28" rx="2" fill="url(#fj-lit)" opacity="0.8" />
    <rect x="212" y="50" width="38" height="28" rx="2" fill="url(#fj-lit)" opacity="0.8" />
    <rect x="164" y="46" width="34" height="9" rx="2" fill={TEAL} opacity="0.9" />
    <Glow id="fj-g" cx={181} cy={118} r={90} ry={50} />
    <rect x="156" y="62" width="50" height="76" rx="3" fill="url(#fj-lit)" />
    <path d="M181 62V138M156 100H206" stroke="#B2602F" stroke-width="2" opacity="0.7" />
    <path d="M168 70V92M194 70V92" stroke={CREAM} stroke-width="2" opacity="0.7" />
    <path d="M150 138H212V150H150Z" fill="#43307F" />
    <Ground y={140} id="fj-gr" from="#2A1B57" to={DEEP} />
    <path d="M140 140H224L250 150H114Z" fill={AMBER} opacity="0.3" />
    {/* the new hire, a fresh ID badge on a lanyard */}
    <Fig x={118} y={146} s={1.3} skin={3} cloth={CREAM} pants="#2A3A6E" hair="#1F1F1F" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q14 -30 14 -24">
      <path d="M-4 -40L0 -24L4 -40" stroke={TEAL} stroke-width="1.6" fill="none" />
      <rect x="-5" y="-25" width="10" height="13" rx="1.6" fill={CREAM} />
      <rect x="-5" y="-25" width="10" height="4" rx="1.6" fill={TEAL} />
      <circle cx="0" cy="-17" r="2" fill={CORAL} />
      <rect x="9" y="-26" width="9" height="12" rx="2" fill="#6B4423" />
    </Fig>
    <Fig x={296} y={146} s={1.1} skin={1} cloth={CORAL} pants="#2A3A6E" hair="#6B4423" dress />
    <rect x="232" y="132" width="14" height="14" rx="3" fill="#2F6B4F" />
    <path d="M239 132Q232 118 238 110M239 132Q248 120 244 108" stroke="#3E8A63" stroke-width="3" fill="none" stroke-linecap="round" />
  </>
);

/* ---------------------------------------------------------------- 5 */
function skyline(): [number, number, number][] {
  return [
    [0, 74, 30], [28, 54, 24], [50, 88, 22], [70, 62, 28], [96, 80, 20], [114, 46, 22],
    [134, 84, 26], [158, 68, 20], [176, 92, 22], [196, 58, 26], [220, 78, 22], [240, 50, 24],
    [262, 86, 28], [288, 64, 22], [308, 82, 26], [332, 56, 28],
  ];
}

const PROPOSAL = (
  <>
    <Sky id="pr-sky" stops={[[0, DEEP], [0.7, '#3A2470'], [1, '#7A3A74']]} />
    <defs>
      <Radial id="pr-g" op={0.85} />
      <Radial id="pr-g2" op={0.6} color={CORAL} />
      <Radial id="pr-city" op={0.7} />
    </defs>
    <Stars seed={13} n={22} h={58} />
    <Moon x={298} y={30} r={9} />
    <Glow id="pr-g2" cx={180} cy={110} r={160} ry={50} />
    {/* city across the water with a warm glow */}
    <g fill="#241A5A">
      {skyline().map(([x, y, w], i) => (
        <rect key={i} x={x} y={y + 14} width={w} height={150 - y} />
      ))}
    </g>
    <g fill={AMBER}>
      {skyline().flatMap(([x, y], i) =>
        [0, 1, 2].map((r) => (
          <rect key={`${i}-${r}`} x={x + 4 + ((i + r) % 2) * 8} y={y + 22 + r * 12} width="3.4" height="4" opacity={(i * 3 + r) % 3 === 0 ? 0.9 : 0.25} />
        )),
      )}
    </g>
    <path d="M0 112H360V150H0Z" fill="#150F3A" />
    <g stroke={AMBER} stroke-width="1.6" stroke-linecap="round" opacity="0.4">
      <path d="M20 120h30M90 126h40M180 122h24M250 128h50M320 120h24" />
    </g>
    {/* rooftop terrace and railing */}
    <path d="M0 150V126H360V150Z" fill="#2A1B57" />
    <path d="M0 126H360" stroke="#43307F" stroke-width="3" />
    <g stroke="#43307F" stroke-width="2">
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={i} d={`M${i * 15 + 4} 108V126`} />
      ))}
      <path d="M0 108H360" />
    </g>
    <Lights id="pr-g" pts={bulbString(0, 20, 360, 24, 18, 16)} r={1.7} />
    {/* two figures, one kneeling with the ring */}
    <Glow id="pr-g" cx={178} cy={104} r={70} ry={50} />
    <Fig x={200} y={142} s={1.55} skin={0} cloth={TEAL} dress hair="#6B4423" arms="M-7 -37Q-14 -30 -16 -24M7 -37Q-6 -34 -14 -34" />
    <g transform="translate(150 142)">
      <ellipse cx="0" cy="1" rx="20" ry="3" fill={DEEP} opacity="0.4" />
      <path d="M-18 0L-4 -22L4 -22L16 -2Z" fill="#2A3A6E" />
      <path d="M-12 -2L-6 -10" stroke="#2A3A6E" stroke-width="6" stroke-linecap="round" />
      <rect x="-6" y="-48" width="16" height="30" rx="7" fill={CORAL} transform="rotate(8 0 -30)" />
      <rect x="-1" y="-62" width="4.8" height="9" rx="2" fill={SKIN[4]} transform="rotate(10 0 -56)" />
      <circle cx="3.5" cy="-66" r="8.4" fill={SKIN[4]} />
      <path d="M-5 -67Q-3 -76 5 -75Q12 -74 12 -66Q6 -72 -5 -67Z" fill="#1F1F1F" />
      <path d="M8 -44Q20 -50 22 -56" stroke={CORAL} stroke-width="5" stroke-linecap="round" fill="none" />
      <circle cx="22.4" cy="-57" r="2.8" fill={SKIN[4]} />
    </g>
    {/* the ring, with sparkle */}
    <g transform="translate(172 82)">
      <circle cx="0" cy="0" r="22" fill="url(#pr-g)" />
      <circle cx="0" cy="3" r="5" fill="none" stroke={AMBER} stroke-width="2" />
      <path d="M0 -4l3-4h-6z" fill={CREAM} />
      <path d="M-3 -8l3 4 3-4z" fill={TEAL} />
      <path d="M-14 -10l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4z" fill={CREAM} />
      <path d="M12 -14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill={CREAM} opacity="0.85" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 6 */
function Bloom({ x, y, r, c }: { x: number; y: number; r: number; c: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * r * 0.7} cy={y + Math.sin((a * Math.PI) / 180) * r * 0.7} r={r * 0.6} fill={c} />
      ))}
      <circle cx={x} cy={y} r={r * 0.4} fill={AMBER} />
    </g>
  );
}

const WEDDING = (
  <>
    <Sky id="we-sky" stops={[[0, DEEP], [0.65, '#3A2470'], [1, '#8A3F7A']]} />
    <defs>
      <Radial id="we-b" op={0.8} />
      <Radial id="we-g" op={0.7} />
    </defs>
    <Stars seed={21} n={14} h={34} />
    <Glow id="we-g" cx={180} cy={96} r={150} ry={76} />
    {/* distant trees */}
    <path d="M0 110Q30 84 60 104T130 100T200 106T280 96T360 108V150H0Z" fill="#241A5A" />
    <Ground y={118} id="we-gr" from="#2A1B57" to={DEEP} />
    {/* garland of lights */}
    <path d="M0 22Q90 54 180 30T360 22" stroke="#43307F" stroke-width="1.5" fill="none" />
    <Lights id="we-b" pts={[...bulbString(0, 22, 180, 30, 14, 9).map(([x, y]) => [x, y + 2] as [number, number]), ...bulbString(180, 30, 360, 22, 14, 9)]} r={1.8} />
    {/* floral arch */}
    <g>
      <path d="M118 132V74a62 62 0 0 1 124 0v58" stroke="#3E7A5F" stroke-width="8" fill="none" stroke-linecap="round" />
      <path d="M118 132V74a62 62 0 0 1 124 0v58" stroke="#2F6B4F" stroke-width="3" fill="none" stroke-dasharray="6 5" />
      {[
        [124, 110, 7, CORAL], [121, 92, 6, CREAM], [128, 74, 7, CORAL], [140, 52, 6.5, CREAM], [158, 36, 7, AMBER],
        [180, 28, 8, CORAL], [202, 36, 7, CREAM], [220, 52, 6.5, CORAL], [232, 74, 7, AMBER], [239, 92, 6, CORAL], [236, 110, 7, CREAM],
      ].map(([x, y, r, c], i) => (
        <Bloom key={i} x={x as number} y={y as number} r={r as number} c={c as string} />
      ))}
      {[[150, 44], [170, 33], [194, 32], [212, 44], [128, 100], [232, 100]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="6" ry="3" fill="#3E8A63" transform={`rotate(${i * 40 - 60} ${x} ${y})`} />
      ))}
    </g>
    {/* couple */}
    <Fig x={166} y={134} s={1.35} skin={3} cloth="#2A2060" pants="#2A2060" hair="#1F1F1F" arms="M-8 -37Q-6 -28 6 -26M8 -37Q14 -30 16 -24">
      <path d="M-3 -41L0 -34L3 -41" fill={CORAL} />
    </Fig>
    <Fig x={196} y={134} s={1.35} skin={1} cloth={CREAM} dress hair="#A0652E" arms="M-7 -37Q-12 -30 -16 -26M7 -37Q10 -30 8 -24">
      <path d="M-8 -57Q-14 -44 -10 -6M-8 -57Q-14 -44 -16 -4" stroke={CREAM} stroke-width="1" opacity="0.5" fill="none" />
      <path d="M-7 -58Q0 -64 7 -58" stroke={CREAM} stroke-width="2.5" fill="none" opacity="0.7" />
      <circle cx="-13" cy="-24" r="3.4" fill={CORAL} />
      <circle cx="-16" cy="-26" r="2.4" fill={AMBER} />
    </Fig>
    {/* guests on both sides */}
    <Fig x={46} y={142} s={1.15} skin={2} cloth={TEAL} dress hair="#3B2418" arms="M-7 -37Q-16 -46 -18 -56M7 -37Q12 -30 10 -24" />
    <Fig x={76} y={146} s={1.05} skin={4} cloth="#43307F" pants="#2A1B57" hair="#1F1F1F" arms="M-8 -37Q-18 -46 -20 -54M8 -37Q12 -30 10 -24" />
    <Fig x={288} y={142} s={1.15} skin={0} cloth={CORAL} dress hair="#D8B56A" arms="M-7 -37Q-14 -44 -14 -54M7 -37Q14 -44 16 -54" />
    <Fig x={320} y={146} s={1.05} skin={5} cloth={AMBER} pants="#2A1B57" hair="#1F1F1F" arms="M-8 -37Q-14 -26 -12 -20M8 -37Q18 -44 20 -54" />
    <g fill={CORAL} opacity="0.9">
      <circle cx="108" cy="116" r="2" />
      <circle cx="252" cy="120" r="2" />
      <circle cx="262" cy="108" r="1.6" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 7 */
const NEWBORN = (
  <>
    <Sky id="nb-sky" stops={[[0, DEEP], [1, '#2D1D66']]} />
    <defs>
      <Radial id="nb-g" op={0.85} />
      <Radial id="nb-g2" op={0.4} />
      <Grad id="nb-wall" stops={[[0, '#2A1B66'], [1, '#4A2A7A']]} />
    </defs>
    <rect width="360" height="150" fill="url(#nb-wall)" />
    {/* night window */}
    <rect x="262" y="16" width="70" height="86" rx="5" fill="#4A3790" />
    <rect x="268" y="22" width="58" height="74" rx="2" fill={NIGHT} />
    <Stars seed={4} n={7} h={50} x0={270} w={54} />
    <Moon x={308} y={42} r={7} />
    <path d="M297 22V96M268 58H326" stroke="#4A3790" stroke-width="3" />
    <Glow id="nb-g2" cx={150} cy={90} r={170} ry={80} />
    <Ground y={124} id="nb-fl" from="#5A2F6B" to={DEEP} />
    <rect y="120" width="360" height="5" fill="#2A1B57" />
    {/* hanging mobile */}
    <g>
      <path d="M150 0V14" stroke={CREAM} stroke-width="1.5" opacity="0.6" />
      <path d="M118 22H182" stroke={CREAM} stroke-width="2" stroke-linecap="round" opacity="0.8" />
      {[[120, 38, AMBER], [150, 46, CORAL], [180, 36, TEAL]].map(([x, y, c], i) => (
        <g key={i}>
          <path d={`M${x} 22V${(y as number) - 5}`} stroke={CREAM} stroke-width="1" opacity="0.6" />
          <path
            d={`M${x} ${(y as number) - 6}l2.6 5.4 5.8.8-4.2 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4 5.8-.8z`}
            fill={c as string}
          />
        </g>
      ))}
    </g>
    {/* the crib */}
    <g>
      <path d="M92 64Q150 50 208 64V122H92Z" fill="#B87A4E" opacity="0.0" />
      <rect x="86" y="62" width="130" height="6" rx="3" fill="#C98A5A" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={94 + i * 10.5} y="66" width="3.6" height="54" rx="1.8" fill="#C98A5A" />
      ))}
      <rect x="86" y="108" width="130" height="8" rx="3" fill="#A56A40" />
      <rect x="88" y="62" width="6" height="64" rx="3" fill="#A56A40" />
      <rect x="208" y="62" width="6" height="64" rx="3" fill="#A56A40" />
      {/* blanket and tiny sleeper behind bars */}
      <rect x="96" y="88" width="108" height="22" rx="8" fill={TEAL} opacity="0.55" />
      <circle cx="116" cy="92" r="11" fill={SKIN[1]} />
      <path d="M107 87Q116 80 125 87Q116 84 107 87Z" fill="#6B4423" />
      <path d="M96 100Q150 88 204 100V110H96Z" fill={CORAL} opacity="0.85" />
      <path d="M104 100h92" stroke={CREAM} stroke-width="1.4" stroke-dasharray="3 5" opacity="0.7" />
    </g>
    {/* the night lamp */}
    <g transform="translate(236 112)">
      <Glow id="nb-g" cx={0} cy={-6} r={46} ry={38} />
      <rect x="-14" y="0" width="28" height="8" rx="2" fill="#6B4423" />
      <path d="M-8 0Q-10 -14 -4 -20H4Q10 -14 8 0Z" fill="#FFE2A0" />
      <path d="M-4 -20H4" stroke={CREAM} stroke-width="2" />
    </g>
    <rect x="224" y="118" width="46" height="5" fill="#3A2A7E" />
    {/* two tired parents leaning in */}
    <Fig x={40} y={146} s={1.6} skin={3} cloth={CORAL} pants="#2A1B57" hair="#1F1F1F" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q20 -44 30 -40" />
    <g transform="translate(284 146) scale(-1 1)">
      <Fig x={0} y={0} s={1.5} skin={0} cloth={AMBER} pants="#2A1B57" hair="#A0652E" dress arms="M-7 -37Q-12 -28 -10 -19M7 -37Q22 -44 40 -38" />
    </g>
    <path d="M0 148H360" stroke={DEEP} stroke-width="3" opacity="0.5" />
  </>
);

/* ---------------------------------------------------------------- 8 */
const EMPTY_NEST = (
  <>
    <defs>
      <Grad id="en-wall" stops={[[0, '#2D1D66'], [1, '#4A2A7A']]} />
      <Grad id="en-beam" stops={[[0, '#FFD07A', 0.55], [1, '#FFB347', 0.04]]} x2={1} y2={0.3} />
      <Radial id="en-g" op={0.9} />
      <Radial id="en-g2" op={0.35} />
      <Grad id="en-door" stops={[[0, '#FFE9B8'], [1, '#FFB347']]} x2={1} y2={0} />
    </defs>
    <rect width="360" height="150" fill="url(#en-wall)" />
    {/* wallpaper stars */}
    <g fill={CREAM} opacity="0.12">
      {Array.from({ length: 20 }).map((_, i) => (
        <path key={i} d={`M${14 + (i % 10) * 34} ${14 + Math.floor(i / 10) * 40}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} />
      ))}
    </g>
    {/* light from the hallway door on the left */}
    <path d="M40 18L214 82L260 150L40 150Z" fill="url(#en-beam)" />
    <rect x="18" y="14" width="46" height="120" rx="3" fill="#2A1B57" />
    <path d="M24 20L58 14V128L24 134Z" fill="url(#en-door)" />
    <Glow id="en-g2" cx={60} cy={80} r={90} ry={80} />
    <path d="M24 134L58 128V18" stroke={CREAM} stroke-width="1.5" opacity="0.5" fill="none" />
    <Ground y={126} id="en-fl" from="#6B3E78" to={DEEP} />
    <path d="M40 126L260 126" stroke="#2A1B57" stroke-width="2" />
    {/* a window at the back with the moon */}
    <rect x="236" y="22" width="74" height="70" rx="4" fill="#4A3790" />
    <rect x="242" y="28" width="62" height="58" rx="2" fill={NIGHT} />
    <Stars seed={19} n={7} h={50} x0={244} w={58} />
    <Moon x={284} y={46} r={7} />
    <path d="M273 28V86M242 57H304" stroke="#4A3790" stroke-width="3" />
    <rect x="232" y="92" width="82" height="6" rx="2" fill="#5B46A5" />
    {/* the bed, neatly made and empty */}
    <g>
      <rect x="150" y="96" width="132" height="38" rx="5" fill="#8A5A3C" />
      <rect x="146" y="84" width="10" height="52" rx="4" fill="#6B4423" />
      <rect x="152" y="98" width="128" height="24" rx="8" fill={CORAL} />
      <rect x="152" y="98" width="128" height="9" rx="4" fill="#FF8DA6" />
      <rect x="158" y="86" width="40" height="14" rx="7" fill={CREAM} />
      <path d="M210 112h56" stroke={CREAM} stroke-width="1.6" stroke-dasharray="4 6" opacity="0.7" />
      {/* a forgotten teddy */}
      <g transform="translate(222 90)">
        <circle cx="-6" cy="-9" r="2.6" fill="#A0652E" />
        <circle cx="6" cy="-9" r="2.6" fill="#A0652E" />
        <circle cx="0" cy="-4" r="7" fill="#C98A5A" />
        <ellipse cx="0" cy="7" rx="7" ry="8" fill="#C98A5A" />
        <circle cx="0" cy="-2" r="2.6" fill={CREAM} opacity="0.8" />
      </g>
    </g>
    {/* shelf with a trophy, a globe, a star lamp */}
    <rect x="86" y="46" width="52" height="4" rx="2" fill="#6B4423" />
    <g>
      <circle cx="102" cy="36" r="9" fill={TEAL} opacity="0.85" />
      <path d="M93 36H111M102 27V45" stroke={NIGHT} stroke-width="1" opacity="0.5" />
      <rect x="99" y="44" width="6" height="2" fill="#6B4423" />
      <path d="M120 28h10v8a5 5 0 0 1-10 0z" fill={AMBER} />
      <rect x="123" y="40" width="4" height="6" fill={AMBER} />
    </g>
    {/* a lonely chair and a sports ball by the door */}
    <g>
      <rect x="100" y="104" width="30" height="5" rx="2" fill="#6B4423" />
      <rect x="102" y="109" width="4" height="22" fill="#6B4423" />
      <rect x="124" y="109" width="4" height="22" fill="#6B4423" />
      <rect x="100" y="80" width="5" height="26" rx="2" fill="#6B4423" />
      <path d="M108 112l8-6" stroke={CREAM} stroke-width="0" />
    </g>
    <circle cx="82" cy="123" r="6" fill={CORAL} />
    <path d="M76 123h12M82 117a8 8 0 0 1 0 12" stroke={CREAM} stroke-width="1" fill="none" opacity="0.7" />
    <path d="M64 130H210L240 150H40Z" fill={AMBER} opacity="0.2" />
  </>
);

/* ---------------------------------------------------------------- 9 */
const INHERITANCE = (
  <>
    <Sky id="in-sky" stops={[[0, DEEP], [1, '#2D1D66']]} />
    <defs>
      <Radial id="in-g" op={0.9} />
      <Radial id="in-g2" op={0.35} />
      <Grad id="in-desk" stops={[[0, '#7A4A2E'], [1, '#3E2418']]} />
      <Grad id="in-paper" stops={[[0, '#FFF9EE'], [1, '#F2D9B6']]} x2={1} y2={1} />
    </defs>
    <Stars seed={31} n={10} h={30} />
    {/* bookshelf in the dusk */}
    <g opacity="0.9">
      <rect x="236" y="10" width="110" height="90" fill="#21175A" />
      <rect x="236" y="48" width="110" height="3" fill="#43307F" />
      <rect x="236" y="86" width="110" height="3" fill="#43307F" />
      {[[240, 14, 8, 32, CORAL], [250, 18, 7, 28, TEAL], [259, 12, 9, 34, AMBER], [270, 20, 7, 26, '#8A5A9E'], [279, 16, 10, 30, CORAL], [291, 14, 7, 32, TEAL],
        [242, 54, 9, 30, AMBER], [253, 58, 7, 26, '#8A5A9E'], [262, 52, 10, 32, TEAL], [274, 56, 8, 28, CORAL]].map(([x, y, w, h, c], i) => (
        <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} rx="1.5" fill={c as string} opacity="0.55" />
      ))}
      <circle cx="326" cy="68" r="9" fill={TEAL} opacity="0.4" />
    </g>
    <Glow id="in-g2" cx={150} cy={100} r={190} ry={80} />
    {/* writing desk */}
    <path d="M0 112H360V150H0Z" fill="url(#in-desk)" />
    <path d="M0 112H360" stroke="#A56A40" stroke-width="2" />
    <path d="M0 126H360M0 138H360" stroke="#2A160E" stroke-width="1" opacity="0.4" />
    {/* the will: parchment scroll with a coral wax seal */}
    <g transform="translate(96 74) rotate(-6)">
      <path d="M0 14Q-6 10 -2 4T6 2H112V38H6Q-8 38 -6 28T0 14Z" fill="url(#in-paper)" opacity="0" />
      <rect x="4" y="2" width="112" height="44" rx="3" fill="url(#in-paper)" />
      <rect x="-4" y="0" width="12" height="48" rx="6" fill="#F2D9B6" />
      <rect x="110" y="0" width="12" height="48" rx="6" fill="#E8C69A" />
      <g stroke="#B58A5E" stroke-width="1.6" stroke-linecap="round" opacity="0.7">
        <path d="M18 12H84M18 20H98M18 28H72" />
      </g>
      <path d="M78 36Q86 28 92 36T104 34" stroke="#3E2418" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <circle cx="58" cy="42" r="9" fill={CORAL} />
      <circle cx="58" cy="42" r="6" fill="#E04D70" />
      <path d="M58 37.5l1.3 3 3.2.3-2.4 2.1.7 3.1-2.8-1.7-2.8 1.7.7-3.1-2.4-2.1 3.2-.3z" fill="#FF9AB0" />
    </g>
    {/* old key with a ribbon */}
    <g transform="translate(216 122) rotate(-18)">
      <path d="M-4 0Q-30 -20 -54 -8" stroke={CORAL} stroke-width="2.4" fill="none" opacity="0.8" />
      <circle cx="0" cy="0" r="9" fill="none" stroke={AMBER} stroke-width="4" />
      <circle cx="0" cy="0" r="3" fill={AMBER} opacity="0.4" />
      <rect x="8" y="-2.4" width="44" height="4.8" rx="2" fill={AMBER} />
      <path d="M38 2.4V10H44V2.4M48 2.4V8H52V2.4" stroke={AMBER} stroke-width="3" fill="none" />
    </g>
    {/* the candle: the single warm light */}
    <g transform="translate(60 112)">
      <Glow id="in-g" cx={0} cy={-34} r={80} ry={64} />
      <ellipse cx="0" cy="2" rx="22" ry="5" fill="#B87A4E" />
      <rect x="-9" y="-30" width="18" height="32" rx="3" fill={CREAM} />
      <path d="M-9 -22Q-4 -18 0 -22T9 -20V-26H-9Z" fill="#F2D9B6" />
      <path d="M0 -42Q-7 -48 0 -62Q7 -48 0 -42Z" fill={AMBER} />
      <path d="M0 -44Q-3 -48 0 -56Q3 -48 0 -44Z" fill={CREAM} />
      <path d="M0 -30V-42" stroke={DEEP} stroke-width="1.4" />
    </g>
    {/* a small inkwell and quill */}
    <g transform="translate(300 118)">
      <path d="M-8 0Q-10 -10 -4 -12H4Q10 -10 8 0Z" fill="#241A5A" />
      <path d="M0 -12Q18 -40 38 -52Q30 -30 6 -10Z" fill={CREAM} />
      <path d="M2 -12Q22 -38 38 -52" stroke="#B58A5E" stroke-width="1" fill="none" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 10 */
const RETIREMENT = (
  <>
    <Sky id="re-sky" stops={[[0, '#3A2470'], [0.55, '#C0577F'], [1, AMBER]]} />
    <defs>
      <Radial id="re-g" op={0.95} />
      <Radial id="re-g2" op={0.4} />
      <Grad id="re-floor" stops={[[0, '#6B3E5F'], [1, '#2A1B57']]} />
    </defs>
    {/* big window onto a sunset */}
    <Glow id="re-g" cx={226} cy={86} r={140} ry={80} />
    <circle cx="226" cy="90" r="22" fill={CREAM} opacity="0.95" />
    <path d="M110 100Q170 84 226 98T360 92V130H110Z" fill="#7A3A74" opacity="0.8" />
    <path d="M110 112Q190 100 250 112T360 106V130H110Z" fill="#4A2A7A" />
    <path d="M110 18H350V130H110Z" fill="none" stroke="#2A1B57" stroke-width="7" />
    <path d="M230 18V130M110 74H350" stroke="#2A1B57" stroke-width="4" />
    <rect x="0" y="0" width="110" height="150" fill="#241A5A" />
    <rect x="0" y="0" width="110" height="150" fill="url(#re-g2)" opacity="0.5" />
    <Glow id="re-g2" cx={226} cy={110} r={150} ry={60} />
    <rect y="128" width="360" height="22" fill="url(#re-floor)" />
    {/* the desk, closing up for good */}
    <g>
      <rect x="22" y="98" width="130" height="8" rx="3" fill="#6B4423" />
      <rect x="30" y="106" width="8" height="24" fill="#4A2E18" />
      <rect x="136" y="106" width="8" height="24" fill="#4A2E18" />
      <rect x="92" y="106" width="44" height="22" rx="2" fill="#5A3820" />
      <rect x="98" y="112" width="32" height="3" rx="1.5" fill="#B58A5E" />
      <rect x="98" y="119" width="32" height="3" rx="1.5" fill="#B58A5E" />
      {/* closed laptop */}
      <rect x="30" y="93" width="44" height="5" rx="2" fill="#43307F" />
      <rect x="34" y="94" width="36" height="1.6" fill={TEAL} opacity="0.7" />
      {/* tidy stack of folders */}
      <rect x="82" y="88" width="30" height="5" rx="1" fill={CORAL} />
      <rect x="85" y="83" width="26" height="5" rx="1" fill={CREAM} />
      {/* teacup with steam */}
      <path d="M120 98V88Q120 84 124 84H134Q138 84 138 88V98Z" fill={CREAM} />
      <path d="M138 88Q146 88 144 94T137 95" stroke={CREAM} stroke-width="2" fill="none" />
      <path d="M125 80Q121 74 126 70M133 80Q129 74 134 68" stroke={CREAM} stroke-width="1.5" fill="none" opacity="0.6" stroke-linecap="round" />
      {/* desk lamp switched off, a coat on the hook */}
      <path d="M44 93V76L58 66" stroke={DEEP} stroke-width="3" fill="none" />
      <path d="M52 62L66 66L60 74Z" fill="#43307F" />
    </g>
    <g>
      <rect x="10" y="30" width="3" height="20" fill="#6B4423" />
      <path d="M2 38H22" stroke="#6B4423" stroke-width="3" stroke-linecap="round" />
      <path d="M6 40Q4 66 8 80H24Q26 62 20 40Z" fill={TEAL} opacity="0.7" />
    </g>
    {/* packed suitcase with a travel tag */}
    <g transform="translate(176 132)">
      <ellipse cx="0" cy="1" rx="30" ry="4" fill={DEEP} opacity="0.4" />
      <path d="M-12 -34V-40H12V-34" stroke="#B58A5E" stroke-width="3" fill="none" />
      <rect x="-26" y="-34" width="52" height="34" rx="5" fill={CORAL} />
      <rect x="-26" y="-34" width="52" height="8" rx="4" fill="#FF8DA6" />
      <path d="M-12 -28V0M12 -28V0" stroke="#B83A5B" stroke-width="2" />
      <rect x="-5" y="-17" width="10" height="6" rx="1.5" fill={AMBER} />
      <path d="M24 -26Q34 -24 32 -14" stroke={CREAM} stroke-width="1.4" fill="none" />
      <rect x="28" y="-14" width="8" height="10" rx="1.5" fill={CREAM} />
    </g>
    {/* an older figure seen from behind, walking toward the light */}
    <Fig x={282} y={140} s={1.4} skin={1} cloth={TEAL} pants="#2A1B57" hair="#E8E0D8" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q16 -30 18 -22">
      <path d="M12 -22L18 0" stroke="#6B4423" stroke-width="2.4" stroke-linecap="round" />
    </Fig>
  </>
);

/* ---------------------------------------------------------------- 11 */
const PASS_THE_TORCH = (
  <>
    <Sky id="pt-sky" stops={[[0, '#2A1B6B'], [0.6, '#B24F7C'], [1, '#FF9A5C']]} />
    <defs>
      <Radial id="pt-sun" op={0.9} />
      <Radial id="pt-orb" op={1} />
      <Grad id="pt-hill" stops={[[0, '#6E3A66'], [1, '#2A1B57']]} />
    </defs>
    <Stars seed={17} n={10} h={36} />
    <Glow id="pt-sun" cx={300} cy={110} r={150} ry={72} />
    <circle cx="300" cy="118" r="26" fill={CREAM} opacity="0.95" />
    <path d="M0 112Q80 90 160 108T360 100V150H0Z" fill="#7A3A74" opacity="0.8" />
    <path d="M0 126Q100 108 200 124T360 120V150H0Z" fill="url(#pt-hill)" />
    <path d="M0 136H360V150H0Z" fill={DEEP} opacity="0.7" />
    {/* long shadows stretching away from the sun */}
    <path d="M110 136L-10 150H28Z" fill={DEEP} opacity="0.4" />
    <path d="M122 136L-30 150H20Z" fill={DEEP} opacity="0.0" />
    <path d="M232 138L60 150H118Z" fill={DEEP} opacity="0.35" />
    {/* elder passes, young receives; the heirloom glows between their hands */}
    <Fig x={112} y={138} s={1.6} skin={2} cloth="#43307F" pants="#2A1B57" hair="#E8E0D8" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q22 -40 30 -36">
      <path d="M-9 -24Q-6 -30 0 -30" stroke={CREAM} stroke-width="0" />
    </Fig>
    <Fig x={226} y={142} s={1.3} skin={4} cloth={CORAL} pants="#2A1B57" hair="#1F1F1F" flip arms="M-8 -37Q-12 -28 -10 -19M8 -37Q22 -40 30 -36" />
    <g transform="translate(170 94)">
      <Glow id="pt-orb" cx={0} cy={0} r={46} />
      <circle cx="0" cy="0" r="9" fill={AMBER} />
      <circle cx="0" cy="0" r="9" fill="none" stroke={CREAM} stroke-width="2" opacity="0.9" />
      <path d="M0 -6V0L4 3" stroke={DEEP} stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M0 -9V-16Q0 -22 6 -22" stroke={AMBER} stroke-width="2" fill="none" />
      <path d="M-24 -18l1.6 4.6 4.6 1.6-4.6 1.6-1.6 4.6-1.6-4.6-4.6-1.6 4.6-1.6z" fill={CREAM} />
      <path d="M22 -22l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill={CREAM} opacity="0.85" />
    </g>
    {/* small tree on the ridge */}
    <g transform="translate(30 118)">
      <rect x="-1.6" y="-4" width="3.2" height="12" fill="#2A1B57" />
      <circle cx="0" cy="-12" r="12" fill="#2F2468" />
      <circle cx="-8" cy="-6" r="8" fill="#2F2468" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 12 */
const FINAL_WORDS = (
  <>
    <Sky id="fw-sky" stops={[[0, DEEP], [1, '#241A5A']]} />
    <defs>
      <Radial id="fw-g" op={0.8} />
      <Radial id="fw-g2" op={0.35} />
      <Grad id="fw-desk" stops={[[0, '#6B4423'], [1, '#2A160E']]} />
      <Grad id="fw-page" stops={[[0, '#FFF9EE'], [1, '#EBCFA8']]} x2={1} />
    </defs>
    {/* a window with a deep starry night */}
    <rect x="196" y="10" width="124" height="104" rx="6" fill="#3A2A7E" />
    <rect x="204" y="18" width="108" height="88" rx="3" fill="#120E36" />
    <Stars seed={27} n={22} h={80} x0={206} w={104} />
    <Moon x={286} y={44} r={9} />
    <path d="M258 18V106M204 62H312" stroke="#3A2A7E" stroke-width="4" />
    <path d="M196 10Q176 40 184 120" stroke={CORAL} stroke-width="14" opacity="0.5" fill="none" />
    <Glow id="fw-g2" cx={110} cy={90} r={160} ry={70} />
    <path d="M0 108H360V150H0Z" fill="url(#fw-desk)" />
    <path d="M0 108H360" stroke="#8A5A3C" stroke-width="2" />
    {/* the open notebook, lines of handwriting */}
    <g transform="translate(150 104)">
      <path d="M-70 4L-4 -10V22L-70 30Z" fill="url(#fw-page)" />
      <path d="M70 4L4 -10V22L70 30Z" fill="url(#fw-page)" />
      <path d="M-70 30L-4 22V26L-70 36ZM70 30L4 22V26L70 36Z" fill="#6B4423" />
      <path d="M0 -10V26" stroke="#B58A5E" stroke-width="2" />
      <g stroke="#8A6A4E" stroke-width="1.4" stroke-linecap="round" opacity="0.75">
        <path d="M-58 8L-16 0M-58 14L-16 6M-58 20L-26 14M12 -2L60 6M12 4L60 12M12 10L44 16" />
      </g>
      <path d="M12 18Q20 14 26 18T40 18" stroke="#3E2418" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M34 22Q46 6 70 -16" stroke="#1B1446" stroke-width="3" stroke-linecap="round" />
      <path d="M33 23L31 27L36 24Z" fill="#1B1446" />
      <path d="M70 -16Q82 -34 90 -42Q80 -22 74 -12Z" fill={CREAM} opacity="0.9" />
    </g>
    {/* the candle, nearly burnt out */}
    <g transform="translate(46 108)">
      <Glow id="fw-g" cx={0} cy={-20} r={70} ry={54} />
      <ellipse cx="0" cy="2" rx="22" ry="5" fill="#B58A5E" />
      <ellipse cx="0" cy="-2" rx="16" ry="4" fill="#E8C69A" />
      <path d="M-8 -20Q-8 -2 -10 -1H10Q8 -2 8 -20Z" fill={CREAM} />
      <path d="M6 -20Q8 -10 6 -2" stroke="#F2D9B6" stroke-width="2" fill="none" />
      <ellipse cx="0" cy="-20" rx="8" ry="2.4" fill="#F2D9B6" />
      <path d="M0 -21V-26" stroke={DEEP} stroke-width="1.2" />
      <path d="M0 -26Q-4 -30 0 -38Q4 -30 0 -26Z" fill={AMBER} />
      <path d="M0 -27Q-1.6 -29 0 -33Q1.6 -29 0 -27Z" fill={CREAM} />
      <path d="M1 -40Q-3 -46 2 -52" stroke={CREAM} stroke-width="1.2" fill="none" opacity="0.35" stroke-linecap="round" />
    </g>
    {/* a keepsake: tiny framed photo and spectacles */}
    <g transform="translate(250 112)">
      <circle cx="-12" cy="0" r="6" fill="none" stroke="#B58A5E" stroke-width="1.6" />
      <circle cx="6" cy="0" r="6" fill="none" stroke="#B58A5E" stroke-width="1.6" />
      <path d="M-6 -1Q-3 -3 0 -1" stroke="#B58A5E" stroke-width="1.6" fill="none" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 13 */
const FAMILY_PORTRAIT = (
  <>
    <defs>
      <Grad id="fp-wall" stops={[[0, '#2A1B66'], [1, '#4A2A7A']]} />
      <Radial id="fp-g" op={0.6} />
      <Radial id="fp-lamp" op={0.9} />
      <Grad id="fp-frame" stops={[[0, '#FFD07A'], [0.5, '#C98A3A'], [1, '#8A5A2C']]} x2={1} y2={1} />
      <Grad id="fp-pic" stops={[[0, '#FFD6A0'], [1, '#FF8A65']]} />
      <Grad id="fp-shelf" stops={[[0, '#7A4A2E'], [1, '#3E2418']]} />
    </defs>
    <rect width="360" height="150" fill="url(#fp-wall)" />
    <g stroke="#5B3C8E" stroke-width="1" opacity="0.4">
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M${i * 32 + 10} 0V150`} />
      ))}
    </g>
    <Glow id="fp-g" cx={180} cy={62} r={170} ry={80} />
    {/* the frame */}
    <rect x="96" y="8" width="168" height="108" rx="6" fill="url(#fp-frame)" />
    <rect x="104" y="16" width="152" height="92" rx="3" fill="#8A5A2C" />
    <rect x="107" y="19" width="146" height="86" rx="2" fill="url(#fp-pic)" />
    <circle cx="180" cy="86" r="30" fill={CREAM} opacity="0.35" />
    <path d="M107 90Q150 74 180 88T253 82V105H107Z" fill="#B24F7C" opacity="0.7" />
    {/* four generations as silhouettes, tall to small */}
    <g fill={DEEP} opacity="0.92">
      {[
        { x: 134, h: 56, hair: 0 },
        { x: 164, h: 62, hair: 1 },
        { x: 196, h: 48, hair: 0 },
        { x: 224, h: 32, hair: 1 },
      ].map(({ x, h }, i) => (
        <g key={i}>
          <circle cx={x} cy={105 - h * 0.78 - 5} r={5 + h * 0.06} />
          <path d={`M${x - 8 - h * 0.05} 105Q${x - 6} ${105 - h * 0.72} ${x} ${105 - h * 0.74}Q${x + 6} ${105 - h * 0.72} ${x + 8 + h * 0.05} 105Z`} />
        </g>
      ))}
      <path d="M143 76L158 74" stroke={DEEP} stroke-width="3" />
    </g>
    {/* warm lamp on the shelf below lights the frame */}
    <rect x="40" y="126" width="280" height="8" rx="3" fill="url(#fp-shelf)" />
    <rect y="134" width="360" height="16" fill={DEEP} opacity="0.55" />
    <g transform="translate(66 126)">
      <Glow id="fp-lamp" cx={0} cy={-18} r={50} ry={44} />
      <rect x="-11" y="-2" width="22" height="4" rx="1" fill="#6B4423" />
      <rect x="-2" y="-14" width="4" height="12" fill="#6B4423" />
      <path d="M-14 -14L-8 -30H8L14 -14Z" fill="#FFE2A0" />
    </g>
    {/* small frames and a plant */}
    <g>
      <rect x="244" y="104" width="22" height="22" rx="2" fill="url(#fp-frame)" />
      <rect x="248" y="108" width="14" height="14" fill="#FF9A5C" />
      <circle cx="255" cy="114" r="3" fill={DEEP} opacity="0.8" />
      <path d="M248 122Q255 114 262 122Z" fill={DEEP} opacity="0.8" />
      <rect x="276" y="110" width="18" height="16" rx="2" fill="url(#fp-frame)" />
      <rect x="279" y="113" width="12" height="10" fill={TEAL} opacity="0.7" />
      <path d="M312 126Q300 108 306 96M312 126Q320 106 316 92M312 126Q310 110 300 100" stroke="#3E8A63" stroke-width="3" stroke-linecap="round" fill="none" />
      <rect x="304" y="122" width="16" height="5" rx="2" fill={CORAL} />
    </g>
    <g fill={CREAM} opacity="0.7">
      <path d="M180 0V8" stroke={CREAM} stroke-width="1" />
    </g>
  </>
);

/* ---------------------------------------------------------------- 14 */
const MUSEUM_CARD = (
  <>
    <Sky id="mu-sky" stops={[[0, DEEP], [1, '#241A5A']]} />
    <defs>
      <Grad id="mu-cone" stops={[[0, AMBER, 0.55], [1, AMBER, 0.05]]} />
      <Radial id="mu-g" op={0.85} />
      <Radial id="mu-g2" op={0.45} />
      <Grad id="mu-glass" stops={[[0, CREAM, 0.22], [1, TEAL, 0.1]]} x2={1} y2={1} />
      <Grad id="mu-ped" stops={[[0, '#4A3790'], [1, '#241A5A']]} />
      <Grad id="mu-floor" stops={[[0, '#3A2470'], [1, DEEP]]} />
    </defs>
    {/* gallery wall with frames receding into shadow */}
    <g opacity="0.55">
      <rect x="20" y="30" width="46" height="60" rx="2" fill="#2F2468" />
      <rect x="25" y="35" width="36" height="50" fill={CORAL} opacity="0.35" />
      <circle cx="43" cy="55" r="9" fill={AMBER} opacity="0.5" />
      <rect x="296" y="26" width="52" height="42" rx="2" fill="#2F2468" />
      <rect x="301" y="31" width="42" height="32" fill={TEAL} opacity="0.3" />
      <path d="M301 63L316 46L328 56L336 48L343 63Z" fill={DEEP} opacity="0.5" />
    </g>
    <rect y="116" width="360" height="34" fill="url(#mu-floor)" />
    <path d="M0 116H360" stroke="#4A3790" stroke-width="1.5" />
    {/* ceiling spotlight cone */}
    <path d="M172 0H188L252 124H108Z" fill="url(#mu-cone)" />
    <rect x="164" y="0" width="32" height="6" rx="2" fill="#4A3790" />
    <Glow id="mu-g2" cx={180} cy={110} r={120} ry={34} />
    {/* pedestal and glass vitrine */}
    <rect x="132" y="96" width="96" height="42" rx="3" fill="url(#mu-ped)" />
    <rect x="128" y="132" width="104" height="8" rx="2" fill="#2A1B67" />
    <rect x="140" y="30" width="80" height="68" rx="4" fill="url(#mu-glass)" />
    <rect x="140" y="30" width="80" height="68" rx="4" fill="none" stroke={CREAM} stroke-width="1.6" opacity="0.55" />
    <path d="M148 34L170 94M176 32L188 60" stroke={CREAM} stroke-width="3" opacity="0.18" />
    <rect x="140" y="26" width="80" height="6" rx="2" fill="#4A3790" />
    {/* the heirloom: an old pocket watch on a velvet cushion */}
    <Glow id="mu-g" cx={180} cy={72} r={46} ry={38} />
    <path d="M150 96Q150 84 164 84H196Q210 84 210 96Z" fill={CORAL} opacity="0.9" />
    <path d="M154 94H206" stroke="#FF8DA6" stroke-width="2" opacity="0.7" />
    <g transform="translate(180 66) rotate(-12)">
      <path d="M0 -20V-26" stroke={AMBER} stroke-width="3" />
      <circle cx="0" cy="-27" r="3.4" fill="none" stroke={AMBER} stroke-width="2" />
      <path d="M0 -27Q-26 -30 -28 -12" stroke={AMBER} stroke-width="1.4" fill="none" opacity="0.7" />
      <circle cx="0" cy="0" r="19" fill={AMBER} />
      <circle cx="0" cy="0" r="15" fill={CREAM} />
      <circle cx="0" cy="0" r="15" fill="none" stroke="#C98A3A" stroke-width="1" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0 -13V-11" stroke="#8A5A2C" stroke-width="1.2" transform={`rotate(${i * 30})`} />
      ))}
      <path d="M0 0V-9M0 0L6 3" stroke={DEEP} stroke-width="1.8" stroke-linecap="round" />
      <circle cx="0" cy="0" r="1.6" fill={CORAL} />
      <path d="M-12 -12Q-6 -16 0 -16" stroke={CREAM} stroke-width="1.6" fill="none" opacity="0.6" stroke-linecap="round" />
    </g>
    {/* the small keepsake card on a stand in front */}
    <g transform="translate(250 112)">
      <path d="M0 22L-4 10H44L40 22Z" fill="#2A1B67" opacity="0" />
      <path d="M-2 28L2 12H46L50 28Z" fill="#241A5A" />
      <path d="M2 12L8 -12H52L46 12Z" fill={CREAM} />
      <path d="M2 12H46L52 -12" fill="none" stroke="#F2D9B6" stroke-width="1" />
      <g stroke="#8A6A4E" stroke-width="1.6" stroke-linecap="round" opacity="0.7">
        <path d="M14 -4H44M12 2H38" />
      </g>
      <circle cx="42" cy="6" r="2.4" fill={CORAL} />
    </g>
    {/* a tiny visitor in silhouette, admiring */}
    <Fig x={78} y={144} s={1.15} skin={3} cloth="#43307F" pants="#241A5A" hair="#1F1F1F" arms="M-8 -37Q-12 -28 -10 -19M8 -37Q14 -32 16 -34" />
    <g fill={CREAM} opacity="0.6">
      <path d="M142 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      <path d="M222 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </g>
  </>
);

export const SCENES: Record<string, ComponentChildren> = {
  birth: BIRTH,
  first_day_school: FIRST_DAY_SCHOOL,
  graduation: GRADUATION,
  first_job: FIRST_JOB,
  proposal: PROPOSAL,
  wedding: WEDDING,
  newborn: NEWBORN,
  empty_nest: EMPTY_NEST,
  inheritance: INHERITANCE,
  retirement: RETIREMENT,
  pass_the_torch: PASS_THE_TORCH,
  final_words: FINAL_WORDS,
  family_portrait: FAMILY_PORTRAIT,
  museum_card: MUSEUM_CARD,
};

export type SceneId = keyof typeof SCENES;
