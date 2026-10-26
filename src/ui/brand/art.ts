/**
 * Brand artwork as plain SVG strings, so the same drawing is used in the app (Intro, New Life)
 * and by scripts/make-icons.mjs to render the app icon and splash screen.
 * Palette: pink #FF6B8B, teal #00E5D1, violet #7B61FF, amber #FFB347, night #141238.
 */

/** Sunset valley: a river winding to a little house, a town on the hill, the sun going down. */
export function sceneInner(p: string): string {
  return `
  <defs>
    <linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22175A"/>
      <stop offset="0.32" stop-color="#5B2E8F"/>
      <stop offset="0.55" stop-color="#C9467E"/>
      <stop offset="0.72" stop-color="#FF7A6B"/>
      <stop offset="0.86" stop-color="#FFB347"/>
    </linearGradient>
    <radialGradient id="${p}sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFF1C4"/>
      <stop offset="0.6" stop-color="#FFD27A"/>
      <stop offset="1" stop-color="#FFB347"/>
    </radialGradient>
    <radialGradient id="${p}glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFD27A" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#FFB347" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${p}river" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#00E5D1"/>
      <stop offset="0.45" stop-color="#3FA6FF"/>
      <stop offset="0.8" stop-color="#9C7BFF"/>
      <stop offset="1" stop-color="#FFB0B8"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#${p}sky)"/>
  <circle cx="300" cy="150" r="70" fill="url(#${p}glow)"/>
  <circle cx="300" cy="150" r="30" fill="url(#${p}sun)"/>
  <g fill="#FFF4EC" opacity="0.9">
    <path d="M70 46 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3z"/>
    <circle cx="150" cy="30" r="1.6"/><circle cx="208" cy="58" r="1.2"/><circle cx="36" cy="92" r="1.3"/><circle cx="360" cy="40" r="1.4"/>
  </g>
  <path d="M0 176 Q50 150 95 166 T190 158 T280 170 T400 160 V300 H0z" fill="#8E4A93" opacity="0.75"/>
  <path d="M0 192 Q60 172 120 186 T240 180 T400 188 V300 H0z" fill="#5E2F7F"/>
  <g fill="#3B2265">
    <rect x="34" y="150" width="12" height="44"/><path d="M32 150 L40 132 L48 150z"/>
    <rect x="52" y="164" width="22" height="30"/><path d="M50 164 L63 150 L76 164z"/>
    <rect x="80" y="158" width="10" height="36"/><path d="M78 158 L85 140 L92 158z"/>
    <rect x="96" y="170" width="26" height="24"/>
  </g>
  <g fill="#FFC86B">
    <rect x="38" y="160" width="3" height="5"/><rect x="58" y="172" width="3" height="4"/><rect x="66" y="178" width="3" height="4"/>
    <rect x="83" y="168" width="3" height="5"/><rect x="104" y="178" width="3" height="4"/><rect x="112" y="178" width="3" height="4"/>
  </g>
  <path d="M168 300 C150 262 238 248 214 226 C196 210 240 200 228 186 C222 180 236 176 246 176 L254 176 C246 182 242 188 250 196 C266 212 222 224 246 246 C270 268 238 284 262 300z" fill="url(#${p}river)"/>
  <path d="M206 262 q14 -6 26 -2 M214 236 q10 -4 20 -1 M228 204 q8 -3 14 0" stroke="#E9FFFC" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.55"/>
  <path d="M0 236 Q60 214 130 232 Q170 244 182 300 H0z" fill="#2A1A55"/>
  <path d="M400 222 Q330 206 268 226 Q236 238 250 300 H400z" fill="#2A1A55"/>
  <g fill="#1A1140">
    <ellipse cx="30" cy="236" rx="22" ry="30"/><ellipse cx="62" cy="248" rx="16" ry="22"/><ellipse cx="380" cy="230" rx="24" ry="34"/>
    <rect x="28" y="254" width="4" height="20"/><rect x="378" y="252" width="4" height="22"/>
  </g>
  <g>
    <rect x="300" y="200" width="44" height="30" rx="2" fill="#3A235F"/>
    <path d="M294 202 L322 180 L350 202z" fill="#271848"/>
    <rect x="334" y="184" width="6" height="12" fill="#271848"/>
    <rect x="308" y="208" width="9" height="9" rx="1" fill="#FFC86B"/>
    <rect x="326" y="208" width="9" height="9" rx="1" fill="#FFC86B"/>
    <rect x="317" y="219" width="8" height="11" rx="1" fill="#FF9A5A"/>
    <circle cx="312" cy="212" r="10" fill="#FFC86B" opacity="0.18"/>
  </g>
  <path d="M0 300 V268 Q90 256 160 300z" fill="#140C33"/>
  <path d="M400 300 V262 Q320 258 270 300z" fill="#140C33"/>`;
}

export const sceneSvg = (p = 's') =>
  `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sceneInner(p)}</svg>`;

/** Rounded "H" used as a window onto the scene. In a 1024 box. */
const H_PATH =
  'M232 196 h150 a40 40 0 0 1 40 40 v226 h180 v-226 a40 40 0 0 1 40 -40 h150 a40 40 0 0 1 40 40 v552 a40 40 0 0 1 -40 40 h-150 a40 40 0 0 1 -40 -40 v-196 h-180 v196 a40 40 0 0 1 -40 40 h-150 a40 40 0 0 1 -40 -40 v-552 a40 40 0 0 1 40 -40z';

/**
 * App icon: the sunset scene seen through a rounded H on night blue.
 * `bg: false` gives a transparent background (Android adaptive foreground).
 */
export function iconSvg(opts: { bg?: boolean; size?: number } = {}): string {
  const { bg = true, size = 1024 } = opts;
  return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="hclip"><path d="${H_PATH}"/></clipPath>
    <radialGradient id="ibg" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#26205E"/><stop offset="1" stop-color="#0E0C2A"/></radialGradient>
    <filter id="hshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#05041A" flood-opacity="0.55"/></filter>
  </defs>
  ${bg ? '<rect width="1024" height="1024" fill="url(#ibg)"/>' : ''}
  <g filter="url(#hshadow)"><path d="${H_PATH}" fill="#1A1440"/></g>
  <g clip-path="url(#hclip)">
    <svg x="152" y="196" width="720" height="632" viewBox="40 0 320 300" preserveAspectRatio="xMidYMid slice">${sceneInner('i')}</svg>
  </g>
  <path d="${H_PATH}" fill="none" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="6"/>
  <path d="M512 92 l14 42 l42 14 l-42 14 l-14 42 l-14 -42 l-42 -14 l42 -14z" fill="#FFF4EC"/>
</svg>`;
}
