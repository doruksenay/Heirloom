import type { JSX } from 'preact';

const PATHS: Record<string, JSX.Element> = {
  life: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />,
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  family: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5V12M5 16.5V12h14v4.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m12 12.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  bag: (
    <>
      <path d="M4 7h16l-1.5 13h-13z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="m9 4 3 4 3-4" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  quilt: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 12h16M12 4v16" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </>
  ),
  painting: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
    </>
  ),
  share: (
    <>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="m16 6-4-4-4 4M12 2v14" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  check: <path d="M5 12l5 5L20 7" />,
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </>
  ),
  sofa: (
    <>
      <path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
      <path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  // round 6: the heirlooms added in round 4 get their own drawings (engine/heirlooms.ts HeirloomIcon)
  camera: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h3L9 4.5h6L16.5 7h3A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  letters: (
    <>
      <path d="M7 4h12a2 2 0 0 1 2 2v9" />
      <rect x="3" y="8" width="15" height="12" rx="2" />
      <path d="m3 10 7.5 5 7.5-5" />
    </>
  ),
  teaset: (
    <>
      <path d="M6 10h11v3.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M9 10a2.5 2.5 0 0 1 5 0M11.5 7.5V6" />
      <path d="M6 11.5 3 9M17 11.5h1.5a2 2 0 0 1 0 4H17M4 21.5h15" />
    </>
  ),
  sewing: (
    <>
      <rect x="6" y="3" width="12" height="3" rx="1" />
      <rect x="6" y="18" width="12" height="3" rx="1" />
      <path d="M8.5 6v12M15.5 6v12M8.5 9l7 2.5M8.5 13l7 2.5" />
    </>
  ),
  radio: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="m7 8 9-5" />
      <circle cx="8.5" cy="14" r="2.5" />
      <path d="M14 12h4M14 16h4" />
    </>
  ),
  kilim: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <path d="m12 8 3 4-3 4-3-4z" />
      <path d="M8 2v2M12 2v2M16 2v2M8 20v2M12 20v2M16 20v2" />
    </>
  ),
  typewriter: (
    <>
      <path d="M8 12V4h8v8M10.5 7h3" />
      <rect x="3" y="12" width="18" height="8" rx="2" />
      <path d="M7 16h.01M10.5 16h.01M14 16h.01M17 16h.01" />
    </>
  ),
  backgammon: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M12 5v14M5 5l2.5 5.5L10 5M14 5l2.5 5.5L19 5M5 19l2.5-5.5L10 19M14 19l2.5-5.5L19 19" />
    </>
  ),
  toolbox: (
    <>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9M3 13.5h7M14 13.5h7M10 12.5h4v2.5h-4z" />
    </>
  ),
};

export function Icon({ name, size = 22, label }: { name: string; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {PATHS[name] ?? PATHS.life}
    </svg>
  );
}
