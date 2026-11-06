import { describe, expect, it } from 'vitest';
import { FEEDBACK_CATS, FEEDBACK_MAX_CHARS, buildFeedback, withEntry } from '../src/platform/feedback';

describe('feedback entries', () => {
  it('needs a pick or a few words', () => {
    expect(buildFeedback([], '')).toBeNull();
    expect(buildFeedback([], '   \n ')).toBeNull();
    expect(buildFeedback(['nonsense'], '')).toBeNull();
  });
  it('keeps only known categories, in the fixed order, and tidies the text', () => {
    const e = buildFeedback(['visuals', 'x', 'events'], '  more   countries\nplease ')!;
    expect(e.cats).toEqual(['events', 'visuals']);
    expect(e.text).toBe('more countries please');
    expect(e.sent).toBe(false);
  });
  it('accepts free text alone and cuts it to the limit', () => {
    const e = buildFeedback([], 'a'.repeat(FEEDBACK_MAX_CHARS + 50))!;
    expect(e.cats).toEqual([]);
    expect(e.text).toHaveLength(FEEDBACK_MAX_CHARS);
  });
  it('keeps the last 20 entries on the phone', () => {
    let list = undefined as ReturnType<typeof withEntry> | undefined;
    for (let i = 0; i < 25; i++) list = withEntry(list, buildFeedback(['events'], `n${i}`)!);
    expect(list).toHaveLength(20);
    expect(list![19].text).toBe('n24');
    expect(list![0].text).toBe('n5');
    expect(FEEDBACK_CATS.length).toBe(5);
  });
});
