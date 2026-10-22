import type { Gender } from '../engine/types';

const SKIN = ['#F3CDB0', '#E2B08C', '#D9A27E', '#B57A55', '#8A5A3C', '#5E3B27'];
const HAIR = ['#2B1B12', '#3B2418', '#6B4423', '#A0652E', '#D8B56A', '#1F1F1F'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Procedural portrait: the same person always gets the same face; hair greys with age. */
export function Avatar({ id, gender, age, size = 76, label }: { id: string; gender: Gender; age: number; size?: number; label: string }) {
  const h = hash(id);
  const skin = SKIN[h % SKIN.length];
  const hair = age >= 78 ? '#EDEAEE' : age >= 58 ? '#C9C4CC' : HAIR[(h >> 3) % HAIR.length];
  const baby = age < 3;
  const headR = baby ? 12 : 14;
  const headY = baby ? 38 : 34;
  const female = gender === 'female';
  return (
    <svg width={size} height={size} viewBox="0 0 76 76" role="img" aria-label={label}>
      <circle cx="38" cy="38" r="38" style={{ fill: 'var(--surface-2)' }} />
      <path d={baby ? 'M20 76c2-12 9-18 18-18s16 6 18 18z' : 'M14 76c2-16 12-24 24-24s22 8 24 24z'} style={{ fill: 'var(--stat-health)' }} />
      <circle cx="38" cy={headY} r={headR} fill={skin} />
      {!baby && female && (
        <>
          <path d={`M22 ${headY + 2}c-2-14 6-22 16-22s18 7 16 22c-2-6-6-10-16-10s-14 4-16 10z`} fill={hair} />
          <path d={`M22 ${headY + 2}c0 8 1 14 4 18h-6c-2-6-1-12 2-18zM54 ${headY + 2}c0 8-1 14-4 18h6c2-6 1-12-2-18z`} fill={hair} />
        </>
      )}
      {!baby && !female && <path d={`M24 ${headY - 2}c0-10 6-15 14-15s14 5 14 15c-3-5-7-7-14-7s-11 2-14 7z`} fill={hair} />}
      {baby && <path d={`M33 ${headY - 11}c3-3 7-3 10 0`} stroke={HAIR[(h >> 3) % HAIR.length]} stroke-width="2" fill="none" stroke-linecap="round" />}
      <circle cx="33" cy={headY + 1} r="1.6" fill="#1C1622" />
      <circle cx="43" cy={headY + 1} r="1.6" fill="#1C1622" />
      {age >= 60 && <path d={`M29 ${headY + 5}h4M43 ${headY + 5}h4`} stroke="#9B6F55" stroke-width="1" stroke-linecap="round" />}
      <path d={`M34 ${headY + 7}c2 2 6 2 8 0`} stroke="#1C1622" stroke-width="1.6" fill="none" stroke-linecap="round" />
      {!female && age >= 30 && (h & 1) === 1 && <path d={`M30 ${headY + 9}c3 6 13 6 16 0`} stroke={hair} stroke-width="3" fill="none" stroke-linecap="round" />}
    </svg>
  );
}
