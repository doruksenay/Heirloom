import { describe, expect, it } from 'vitest';
import { choose, finishLife, newGame, openEvent } from '../src/engine/game';
import { makeCtx } from '../src/engine/context';
import { findEvent } from '../src/content/registry';
import type { Lang, Profile } from '../src/engine/types';

const profile = (language: Lang): Profile => ({ entitlements: [], settings: { themeId: 'evening', adultContent: false, sound: true, language } });
const game = (seed: number, lang: Lang = 'en') => {
  const s = newGame({ firstName: 'Deniz', lastName: 'Kaya', gender: 'female', countryId: 'tr', city: 'İzmir', seed }, profile(lang));
  s.year += 30;
  return s;
};

describe('dynasty echoes', () => {
  it('records the moral flags of a life that ends, with its generation and name', () => {
    const s = game(1);
    s.player.flags.mr_whistleblower = s.year;
    s.player.flags.other = s.year;
    s.player.deathCause = 'old age';
    finishLife(s);
    expect(s.dynasty.echoes?.mr_whistleblower?.name).toBe('Deniz');
    expect(s.dynasty.echoes?.other).toBeUndefined();
  });

  it('every echo event is closed to the life that made the choice and open to the next generation', () => {
    const flags: Record<string, string> = { 'base.ec_honest_name': 'mr_whistleblower', 'base.ec_envelope': 'mr_paid_bribe', 'base.ec_family_chair': 'mr_chair', 'base.ec_books': 'mr_cash_deal', 'base.ec_runner': 'mr_vote_cash', 'base.ec_family_story': 'mr_chair' };
    for (const lang of ['en', 'tr'] as Lang[]) {
      for (const [id, flag] of Object.entries(flags)) {
        const s = game(2, lang);
        s.dynasty.echoes = { [flag]: { generation: s.dynasty.generation, name: 'Ata' } };
        const def = findEvent(id)?.def as NonNullable<ReturnType<typeof findEvent>>['def'];
        expect(def, id).toBeTruthy();
        expect(def.when!(makeCtx(s)), id + ' same generation').toBe(false);
        s.dynasty.generation += 1;
        s.player.jailYears = 0;
        expect(def.when!(makeCtx(s)), id + ' next generation').toBe(true);
        expect(openEvent(s, def), id + ' opens').toBe(true);
        expect(s.pending!.body).toContain('Ata');
        choose(s, s.pending!.choices[0].id);
        expect(s.pending).toBeFalsy();
      }
    }
  });
});
