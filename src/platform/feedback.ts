import type { FeedbackEntry } from '../engine/types';
import { sendExplicit } from './analytics';

/**
 * "What should we add?": a few fixed wishes plus a free line. Kept by category so the answers can be counted.
 * The ids are what gets sent; the labels are shown in the sheet (ui/FeedbackSheet.tsx) in the player's language.
 */
export const FEEDBACK_CATS = ['events', 'countries', 'family', 'careers', 'visuals'] as const;
export type FeedbackCat = (typeof FEEDBACK_CATS)[number];

export const FEEDBACK_MAX_CHARS = 280;
/** Wishes kept on the phone. */
const KEEP = 20;

/** Cleans what the player picked and typed. Null when there is nothing to send. */
export function buildFeedback(cats: string[], text: string, now = new Date()): FeedbackEntry | null {
  const known = FEEDBACK_CATS.filter((c) => cats.includes(c));
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, FEEDBACK_MAX_CHARS);
  if (!known.length && !clean) return null;
  return { at: now.toISOString(), cats: known, text: clean, sent: false };
}

/** The profile's list after adding one entry (newest last, at most KEEP). */
export function withEntry(list: FeedbackEntry[] | undefined, e: FeedbackEntry): FeedbackEntry[] {
  return [...(list ?? []), e].slice(-KEEP);
}

/** Sends one entry. One event per wish, with the categories joined so a dashboard can filter on them. */
export function deliverFeedback(e: FeedbackEntry, lang: string, gens: number): Promise<boolean> {
  return sendExplicit('feature_request', { cats: e.cats.join(',') || 'freetext', text: e.text, text_len: e.text.length, lang, gens });
}
