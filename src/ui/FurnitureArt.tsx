import type { FurnitureDef } from '../engine/home';

/** Each style set has its own two colours, so a row tells you the look before you read its name. */
const SET_COLORS: Record<string, [string, string]> = {
  ottoman: ['#C8553D', '#FFB347'],
  scandi: ['#E9E4DA', '#00B3A4'],
  retro: ['#E07A2E', '#7B61FF'],
  basics: ['#9C93C9', '#6B6496'],
};

/** Silhouettes per slot, drawn on a 48×48 grid. `a` is the main colour, `b` the accent. */
function shape(slot: FurnitureDef['slot'], a: string, b: string) {
  switch (slot) {
    case 'sofa':
      return (
        <>
          <rect x="8" y="16" width="32" height="12" rx="4" fill={a} />
          <rect x="5" y="24" width="38" height="11" rx="4" fill={a} />
          <rect x="5" y="22" width="7" height="13" rx="3" fill={b} />
          <rect x="36" y="22" width="7" height="13" rx="3" fill={b} />
          <path d="M9 35v4M39 35v4" stroke={b} stroke-width="2.5" stroke-linecap="round" />
        </>
      );
    case 'kitchen':
      return (
        <>
          <rect x="6" y="22" width="36" height="18" rx="2" fill={a} />
          <rect x="4" y="19" width="40" height="4" rx="1.5" fill={b} />
          <circle cx="16" cy="31" r="4" fill="none" stroke={b} stroke-width="2" />
          <path d="M28 27h10M28 33h10" stroke={b} stroke-width="2" stroke-linecap="round" />
          <path d="M30 19v-6a4 4 0 0 1 8 0" stroke={b} stroke-width="2" fill="none" stroke-linecap="round" />
        </>
      );
    case 'tv':
      return (
        <>
          <rect x="7" y="10" width="34" height="22" rx="3" fill={a} />
          <rect x="10" y="13" width="28" height="16" rx="1.5" fill={b} opacity="0.55" />
          <path d="M18 38h12M24 32v6" stroke={a} stroke-width="3" stroke-linecap="round" />
        </>
      );
    case 'art':
      return (
        <>
          <rect x="9" y="9" width="30" height="26" rx="2" fill={a} />
          <rect x="13" y="13" width="22" height="18" fill={b} opacity="0.5" />
          <path d="M13 31l7-8 5 5 4-4 6 7z" fill={a} />
          <circle cx="30" cy="18" r="2.5" fill={a} />
          <path d="M20 9l4-4 4 4" stroke={a} stroke-width="1.5" fill="none" />
        </>
      );
    case 'lamp':
      return (
        <>
          <path d="M16 8h16l5 13H11z" fill={b} />
          <path d="M24 21v17" stroke={a} stroke-width="3" />
          <ellipse cx="24" cy="40" rx="9" ry="3" fill={a} />
        </>
      );
    case 'shelf':
      return (
        <>
          <path d="M8 16h32M8 28h32M8 40h32" stroke={a} stroke-width="3" stroke-linecap="round" />
          <rect x="11" y="6" width="4" height="10" fill={b} />
          <rect x="16" y="8" width="4" height="8" fill={a} opacity="0.7" />
          <rect x="21" y="5" width="3" height="11" fill={b} opacity="0.7" />
          <circle cx="33" cy="22" r="5" fill={b} />
          <rect x="12" y="20" width="10" height="8" rx="1" fill={a} opacity="0.7" />
          <rect x="27" y="32" width="4" height="8" fill={a} opacity="0.7" />
          <rect x="32" y="30" width="4" height="10" fill={b} />
        </>
      );
    case 'plant':
      return (
        <>
          <path d="M24 30C14 26 10 16 12 8c8 3 12 12 12 22zM24 30c10-4 14-14 12-22-8 3-12 12-12 22zM24 30c-2-8 0-16 0-22 0 6 2 14 0 22z" fill="#2FA37F" />
          <path d="M15 30h18l-3 11H18z" fill={a} />
          <path d="M14 30h20" stroke={b} stroke-width="2.5" stroke-linecap="round" />
        </>
      );
    case 'rug':
      return (
        <>
          <rect x="5" y="15" width="38" height="20" rx="3" fill={a} />
          <rect x="10" y="19" width="28" height="12" rx="2" fill="none" stroke={b} stroke-width="2" />
          <path d="M24 21l4 4-4 4-4-4z" fill={b} />
          <path d="M3 18v14M45 18v14" stroke={a} stroke-width="1.5" stroke-dasharray="1.5 1.5" />
        </>
      );
    case 'bed':
      return (
        <>
          <rect x="5" y="12" width="6" height="28" rx="2" fill={a} />
          <rect x="9" y="24" width="34" height="10" rx="2" fill={b} />
          <rect x="11" y="19" width="10" height="6" rx="3" fill={a} opacity="0.6" />
          <rect x="22" y="22" width="21" height="6" rx="2" fill={a} opacity="0.85" />
          <path d="M10 34v6M41 34v6" stroke={a} stroke-width="2.5" stroke-linecap="round" />
        </>
      );
    case 'desk':
      return (
        <>
          <rect x="5" y="22" width="38" height="4" rx="1.5" fill={a} />
          <path d="M8 26v14M40 26v14" stroke={a} stroke-width="3" stroke-linecap="round" />
          <rect x="26" y="26" width="12" height="9" rx="1" fill={a} opacity="0.7" />
          <rect x="11" y="10" width="15" height="11" rx="1.5" fill={b} />
          <path d="M18 21v1" stroke={b} stroke-width="2" />
        </>
      );
    case 'bath':
      return (
        <>
          <path d="M5 22h38v5a10 10 0 0 1-10 10H15A10 10 0 0 1 5 27z" fill={a} />
          <path d="M9 22v-10a4 4 0 0 1 8 0" stroke={b} stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M12 37l-2 4M36 37l2 4" stroke={b} stroke-width="2.5" stroke-linecap="round" />
          <circle cx="30" cy="17" r="2" fill={b} opacity="0.6" />
          <circle cx="35" cy="13" r="1.5" fill={b} opacity="0.6" />
        </>
      );
    case 'petbed':
      return (
        <>
          <ellipse cx="24" cy="32" rx="18" ry="8" fill={a} />
          <ellipse cx="24" cy="30" rx="12" ry="4.5" fill={b} opacity="0.7" />
          <path d="M20 18a2.5 2.5 0 1 1 0 .1zM28 18a2.5 2.5 0 1 1 0 .1zM16 22a2 2 0 1 1 0 .1zM32 22a2 2 0 1 1 0 .1z" fill={b} />
          <ellipse cx="24" cy="24" rx="4" ry="3" fill={b} />
        </>
      );
    case 'garden':
      return (
        <>
          <path d="M4 40h40" stroke="#2FA37F" stroke-width="3" stroke-linecap="round" />
          <path d="M14 40V24M34 40V28" stroke={a} stroke-width="2.5" />
          <circle cx="14" cy="20" r="8" fill="#2FA37F" />
          <circle cx="34" cy="24" r="6" fill="#2FA37F" opacity="0.8" />
          <circle cx="24" cy="36" r="3" fill={b} />
          <circle cx="8" cy="36" r="2.5" fill={b} />
          <circle cx="42" cy="35" r="2.5" fill={a} />
        </>
      );
    default:
      return <rect x="10" y="14" width="28" height="22" rx="4" fill={a} />;
  }
}

/** A small drawn picture of a piece of furniture, coloured by its style set. */
export function FurnitureArt({ f, size = 44, owned }: { f: FurnitureDef; size?: number; owned?: boolean }) {
  const [a, b] = SET_COLORS[f.set ?? 'basics'] ?? SET_COLORS.basics;
  return (
    <svg class={`furn-art${owned ? ' owned' : ''}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {shape(f.slot, a, b)}
    </svg>
  );
}
