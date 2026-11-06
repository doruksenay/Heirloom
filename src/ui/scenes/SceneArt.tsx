import { SCENES } from './scenes';

/** One milestone illustration, full card width. Decorative: the event text carries the meaning. */
export function SceneArt({ id, class: cls }: { id: string; class?: string }) {
  const art = SCENES[id];
  if (!art) return null;
  return (
    <svg
      class={`scene-art${cls ? ` ${cls}` : ''}`}
      viewBox="0 0 360 150"
      width="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '360 / 150', borderRadius: '14px', overflow: 'hidden', flex: 'none' }}
    >
      {art}
    </svg>
  );
}
