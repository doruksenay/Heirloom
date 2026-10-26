import { sceneSvg } from './art';
import logoUrl from './logo-h.png';
import type { ComponentChildren } from 'preact';

/** "Heirloom" wordmark: rounded, warm cream, with a sparkle in place of the dot on the i. */
export function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <span class="wordmark" style={{ fontSize: `${size}px` }} lang="en" aria-label="Heirloom">
      <span aria-hidden="true">
        He
        <span class="dot-i">
          ı
          <svg class="spark" viewBox="0 0 20 20">
            <path d="M10 0 l2.6 7.4 L20 10 l-7.4 2.6 L10 20 l-2.6 -7.4 L0 10 l7.4 -2.6z" fill="#FFF4EC" />
          </svg>
        </span>
        rloom
      </span>
    </span>
  );
}

/** The sunset valley illustration, with optional content laid over its lower part. */
export function Scene({ height = 220, id = 's', children }: { height?: number; id?: string; children?: ComponentChildren }) {
  return (
    <div class="scene" style={{ height: `${height}px` }}>
      {/* static, app-made SVG markup (no user content) */}
      <div style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: sceneSvg(id) }} />
      {children && <div class="scene-overlay">{children}</div>}
    </div>
  );
}

/** The app logo: the sunset valley seen through a rounded H (same art as the app icon). */
export const Logo = ({ size = 96 }: { size?: number }) => (
  <img src={logoUrl} width={size} height={Math.round(size * 0.94)} alt="" style={{ display: 'block', filter: 'drop-shadow(0 8px 16px rgba(5, 4, 26, 0.55))' }} />
);
