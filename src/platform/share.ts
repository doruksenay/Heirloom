/**
 * Hands a picture to the person: the system share sheet where the WebView can share files, a download otherwise.
 * Returns what happened so the caller can say so ('failed' means nothing was shared and the caller may fall back to text).
 */
export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function shareImage(blob: Blob, filename: string, text: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  try {
    if (nav?.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], text });
      return 'shared';
    }
  } catch (e) {
    // the person closed the sheet: that is not an error and nothing else should open
    if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
