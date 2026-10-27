import type { Gender } from '../engine/types';

const SKIN = ['#F3CDB0', '#E2B08C', '#D9A27E', '#B57A55', '#8A5A3C', '#5E3B27'];
const HAIR = ['#2B1B12', '#3B2418', '#6B4423', '#A0652E', '#D8B56A', '#1F1F1F'];
const OUTFIT = ['var(--stat-health)', 'var(--stat-happiness)', 'var(--stat-smarts)', 'var(--stat-looks)'];
const INK = '#1C1622';
const LINE = 'rgba(70, 35, 25, 0.38)';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type AgeStage = 'baby' | 'child' | 'teen' | 'adult' | 'middle' | 'old';

export function ageStage(age: number): AgeStage {
  if (age < 3) return 'baby';
  if (age < 13) return 'child';
  if (age < 20) return 'teen';
  if (age < 45) return 'adult';
  if (age < 65) return 'middle';
  return 'old';
}

/** Head size and position per stage: babies are all head, adults get a longer face. */
const HEAD: Record<AgeStage, { y: number; rx: number; ry: number }> = {
  baby: { y: 40, rx: 15, ry: 14.5 },
  child: { y: 37, rx: 14, ry: 14 },
  teen: { y: 35, rx: 13, ry: 15 },
  adult: { y: 34, rx: 13, ry: 15.5 },
  middle: { y: 34, rx: 13.5, ry: 15.5 },
  old: { y: 35, rx: 13.5, ry: 15 },
};

const SHOULDERS: Record<AgeStage, string> = {
  baby: 'M22 76c2-9 8-14 16-14s14 5 16 14z',
  child: 'M17 76c2-11 10-17 21-17s19 6 21 17z',
  teen: 'M13 76c2-14 12-21 25-21s23 7 25 21z',
  adult: 'M11 76c2-15 13-22 27-22s25 7 27 22z',
  middle: 'M10 76c2-15 13-22 28-22s26 7 28 22z',
  old: 'M12 76c2-14 12-21 26-21s24 7 26 21z',
};

/**
 * Procedural portrait: the same person always gets the same face, drawn for their age.
 * Six stages (baby, child, teen, adult, middle age, old): the head shrinks relative to the body,
 * the face lengthens, hair greys from the temples, and lines, glasses and baldness arrive late.
 */
export function Avatar({ id, gender, age, size = 76, label }: { id: string; gender: Gender; age: number; size?: number; label: string }) {
  const h = hash(id);
  const stage = ageStage(age);
  const skin = SKIN[h % SKIN.length];
  const base = HAIR[(h >>> 3) % HAIR.length];
  const hair = age >= 78 ? '#EDEAEE' : age >= 62 ? '#C9C4CC' : base;
  const temples = stage === 'middle' && age >= 50 ? '#B9B3BE' : hair;
  const outfit = OUTFIT[(h >>> 7) % OUTFIT.length];
  const female = gender === 'female';
  const { y, rx, ry } = HEAD[stage];
  const L = 38 - rx;
  const R = 38 + rx;
  const top = y - ry;
  const style = (h >>> 11) % 3; // per-person hairstyle variant
  const bald = !female && stage === 'old' && (h >>> 13) % 2 === 0;
  const receding = !female && stage === 'middle' && (h >>> 13) % 3 === 0;
  const glasses = (stage === 'old' && (h >>> 15) % 2 === 0) || (stage === 'middle' && (h >>> 15) % 4 === 0) || (stage === 'adult' && (h >>> 15) % 6 === 0);
  const beard = !female && (stage === 'adult' || stage === 'middle' || stage === 'old') && (h & 1) === 1;
  const young = stage === 'baby' || stage === 'child';
  const eyeY = y + (stage === 'baby' ? 2 : 1);
  const eyeR = stage === 'baby' ? 2.2 : stage === 'child' ? 2 : 1.7;
  const lined = stage === 'middle' || stage === 'old';

  // the cap of hair over the crown; shared by most styles
  const cap = (lift: number, dip: number) =>
    `M${L - 1} ${y - 1}C${L - 2} ${top - lift} ${R + 2} ${top - lift} ${R + 1} ${y - 1}C${R - 3} ${top + dip} ${L + 3} ${top + dip} ${L - 1} ${y - 1}z`;

  // long or bobbed hair falls behind the head and is drawn first
  const backHair = female && !young && stage !== 'old' ? (style === 2 ? y + ry - 3 : y + ry + 7) : female && stage === 'child' && style !== 1 ? y + ry - 2 : null;

  return (
    <svg width={size} height={size} viewBox="0 0 76 76" role="img" aria-label={label} class={`avatar avatar-${stage}`}>
      <circle cx="38" cy="38" r="38" style={{ fill: 'var(--surface-2)' }} />
      {backHair !== null && <path d={`M${L - 3} ${y}C${L - 4} ${top - 7} ${R + 4} ${top - 7} ${R + 3} ${y}L${R + 3} ${backHair}Q38 ${backHair + 5} ${L - 3} ${backHair}z`} fill={hair} />}
      {female && stage === 'old' && <circle cx="38" cy={top - 2} r="6" fill={hair} />}
      {stage !== 'baby' && <rect x="34" y={y + ry - 4} width="8" height="9" rx="3" fill={skin} />}
      <path d={SHOULDERS[stage]} style={{ fill: outfit }} />
      {stage === 'baby' && <path d="M31 63q7 5 14 0" stroke="#fff" stroke-width="2.2" fill="none" opacity="0.55" stroke-linecap="round" />}
      <ellipse cx="38" cy={y} rx={rx} ry={ry} fill={skin} />
      <ellipse cx={L + 0.5} cy={y + 2} rx="2.2" ry="3.2" fill={skin} />
      <ellipse cx={R - 0.5} cy={y + 2} rx="2.2" ry="3.2" fill={skin} />

      {/* hair in front */}
      {stage === 'baby' && <path d={`M34 ${top + 1}c2-4 6-4 8 0`} stroke={base} stroke-width="2" fill="none" stroke-linecap="round" />}
      {stage !== 'baby' && !bald && !receding && <path d={cap(young ? 5 : 6, female ? 7 : 5)} fill={hair} />}
      {receding && (
        <>
          <ellipse cx={L + 1} cy={y - 4} rx="3" ry="6" fill={hair} />
          <ellipse cx={R - 1} cy={y - 4} rx="3" ry="6" fill={hair} />
          <path d={`M33 ${top + 1.5}q5-2.5 10 0`} stroke={hair} stroke-width="2.4" fill="none" stroke-linecap="round" />
        </>
      )}
      {bald && (
        <>
          <ellipse cx={L + 1} cy={y - 3} rx="3" ry="5" fill={hair} />
          <ellipse cx={R - 1} cy={y - 3} rx="3" ry="5" fill={hair} />
        </>
      )}
      {temples !== hair && !bald && (
        <>
          <path d={`M${L - 1} ${y - 1}q1-6 4-8v8z`} fill={temples} />
          <path d={`M${R + 1} ${y - 1}q-1-6-4-8v8z`} fill={temples} />
        </>
      )}
      {female && !young && style === 0 && stage !== 'old' && <path d={`M${L + 2} ${top + 6}q9 2 16-5`} stroke={hair} stroke-width="4" fill="none" stroke-linecap="round" />}
      {female && stage === 'child' && style === 1 && (
        <>
          <circle cx={L - 3} cy={y - 4} r="4.5" fill={hair} />
          <circle cx={R + 3} cy={y - 4} r="4.5" fill={hair} />
        </>
      )}
      {!female && stage === 'teen' && style === 1 && <path d={`M${L + 3} ${top + 3}l4-6 3 5 4-6 3 5 4-5 2 6`} fill={hair} />}

      {/* face */}
      {young && (
        <>
          <circle cx="29.5" cy={eyeY + 5} r="2.8" fill="#FF8FA6" opacity="0.35" />
          <circle cx="46.5" cy={eyeY + 5} r="2.8" fill="#FF8FA6" opacity="0.35" />
        </>
      )}
      {stage === 'old' ? (
        <path d={`M30.5 ${eyeY}q2.5-2 5 0M40.5 ${eyeY}q2.5-2 5 0`} stroke={INK} stroke-width="1.6" fill="none" stroke-linecap="round" />
      ) : (
        <>
          <circle cx="33" cy={eyeY} r={eyeR} fill={INK} />
          <circle cx="43" cy={eyeY} r={eyeR} fill={INK} />
          {young && (
            <>
              <circle cx="33.7" cy={eyeY - 0.8} r="0.7" fill="#fff" />
              <circle cx="43.7" cy={eyeY - 0.8} r="0.7" fill="#fff" />
            </>
          )}
        </>
      )}
      {!young && <path d={`M30.5 ${eyeY - 4.5}q2.5-1.2 5 0M40.5 ${eyeY - 4.5}q2.5-1.2 5 0`} stroke={stage === 'old' ? hair : base} stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.9" />}
      {lined && <path d={`M33 ${top + 6.5}h10`} stroke={LINE} stroke-width="1" stroke-linecap="round" />}
      {stage === 'old' && (
        <>
          <path d={`M32 ${top + 9}h12`} stroke={LINE} stroke-width="1" stroke-linecap="round" />
          <path d={`M27 ${eyeY - 1}l-2-1M27 ${eyeY + 1}l-2 1M49 ${eyeY - 1}l2-1M49 ${eyeY + 1}l2 1`} stroke={LINE} stroke-width="0.9" stroke-linecap="round" />
        </>
      )}
      {lined && <path d={`M31 ${eyeY + 4}q-1.4 3 0.6 5.5M45 ${eyeY + 4}q1.4 3-0.6 5.5`} stroke={LINE} stroke-width="1" fill="none" stroke-linecap="round" />}
      <path d={stage === 'baby' ? `M35.5 ${y + 7.5}q2.5 2 5 0` : `M34 ${y + 7}c2 2 6 2 8 0`} stroke={INK} stroke-width="1.6" fill="none" stroke-linecap="round" />
      {beard && <path d={`M30 ${y + 9}c3 6 13 6 16 0`} stroke={hair} stroke-width="3" fill="none" stroke-linecap="round" />}
      {glasses && (
        <g stroke={INK} stroke-width="1.2" fill="rgba(255,255,255,0.12)">
          <circle cx="33" cy={eyeY} r="3.8" />
          <circle cx="43" cy={eyeY} r="3.8" />
          <path d={`M36.8 ${eyeY}h2.4`} fill="none" />
        </g>
      )}
    </svg>
  );
}
