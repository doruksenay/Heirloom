import type { Settings } from '../engine/types';

/**
 * Accessibility settings, applied as attributes on <html> (the styles do the rest; see "accessibility" in styles.css):
 *  - text size: --fs scales every font size (styles use calc(Npx * var(--fs)))
 *  - easy-read font: Lexend instead of the theme fonts
 *  - reduce motion: on, or off (undefined follows the device setting through the media query)
 *  - high contrast: stronger text and borders
 */
export type TextSize = 'normal' | 'large' | 'xlarge';

export const TEXT_SCALE: Record<TextSize, number> = { normal: 1, large: 1.15, xlarge: 1.3 };

export const textSizeOf = (st: Settings): TextSize => st.textSize ?? 'normal';

export function applyA11y(st: Settings, root: HTMLElement = document.documentElement): void {
  const size = textSizeOf(st);
  root.style.setProperty('--fs', String(TEXT_SCALE[size]));
  root.dataset.text = size;
  if (st.easyFont) root.dataset.easyfont = '1';
  else delete root.dataset.easyfont;
  if (st.reduceMotion === true) root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
  if (st.highContrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
}
