import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform() as 'ios' | 'android' | 'web';

/** Matches the system status bar to the active theme on phones. */
export async function syncStatusBar(dark: boolean, color: string): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    if (platform() === 'android') await StatusBar.setBackgroundColor({ color });
  } catch {
    /* status bar plugin missing on this platform */
  }
}
