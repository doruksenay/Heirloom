# Writing content for Heirloom

How to write events and activities. Read this before adding to `src/content/`.

## Where things are
- Types: `src/content/types.ts` (EventDef, ChoiceDef, ActivityDef, Ctx, Helpers).
- Good examples: `src/content/base/events-adult.ts`, `src/content/base/events-more.ts`, `src/content/base/activities.ts`.
- Helpers: `src/content/base/util.ts`.
  - People: `who`, `nm`, `kin`, `cap`.
  - Money and jobs: `wage`, `single`, `eligibleJobs`.
  - Turkish suffixes: `gen`, `acc`, `dat`, `loc`, `abl`, `wth`.
- How events fire: `src/engine/game.ts` (`eligible`, `pickRandomEvent`, `ageUp`).
  - 85% of years open one random event, sometimes two.
  - Picks are weighted by `weight`, default 10.
  - `cooldown` defaults to 4 years. `once: true` means once per life.
  - Only `crime` category events fire while in prison.

## Bilingual text (English + Turkish), always
- Every player-visible string goes through `c.t('English', 'Türkçe')`.
  - This covers `title`, `text`, choice `label`, `resolve` and `apply` return lines, and activity `label`/`description`/`run`.
  - Use the function form `(c) => c.t(...)` for `title`/`text`/`label`/`description`.
- Turkish must read as if written by a Turkish writer, not translated.
  - Use local detail where it fits: çay, komşu, bayram, dolmuş, maaş günü, apartman yöneticisi. They are fine in any country's life.
  - Address the player as "sen".
- Names in sentences take suffixes with the helpers, never by hand:
  - `wth(name)` → "Alp'le", "Ayşe'yle"
  - `gen(name)` → "Ada'nın"
  - `dat(name)` → "Mehmet'e"
  - `acc(name)` → "Ada'yı"
  - `loc(city)` → "Zonguldak'ta"
  - `abl(city)` → "İzmir'den"
- Kinship: `kin(c, person, 'mother' | 'father' | 'sibling' | 'child' | 'spouse' | 'partner' | 'friend')` gives "annen", "kız kardeşin", "kocan" in Turkish and "mom", "sister", "husband" in English. `cap()` capitalizes Turkish-aware (i → İ).
- Never put a Turkish suffix right after a money amount or a number. "₺1.053'ü" needs pronunciation rules, so rephrase instead: "Üstüne bir de ₺1.053 kazandın." / "Hesabına ₺1.053 yattı."
- Do not drop English common words into Turkish sentences.
  - Company, place and brand names must be proper names that work in both languages, or have a Turkish twin.
  - `tests/i18n-sim.test.ts` fails on English words like "the", "you" or "and" in Turkish logs.
  - Text inside double quotes is exempt, for jokes.
- `badge` and `requiresLabel` stay in English, from this set:
  - Risky, Big change, Costs more, No opening, Not enough money, Not enough savings, Breaks the chain, No way back, Big money, Safe, Free, Bank loan, Illegal
  - Needs Smarts N+, Needs Looks N+, Needs Health N+
  - The UI translates them. Ask the lead before adding a new one.

## Randomness rules (important)
- All randomness goes through `c.rng`, never `Math.random`.
- The same seed must play the same life in both languages, so the number and order of `c.rng` calls must not depend on `c.lang`.
- To pick one of several text variants, pick one index and read both languages from it:
  ```ts
  const i = c.rng.int(0, LINES.length - 1);
  return c.t(LINES[i][0], LINES[i][1]);
  ```
- Never call `c.rng` inside a `c.t(...)` argument that only one language evaluates. Compute values first, then build both strings.
- Values stored in `c.vars` must be serializable (string or number). Store an id or the English value, and translate at display time.

## Style
- Short and witty, warm, a little absurd, in the BitLife spirit.
  - Titles are under ~8 words. The text is 1–2 sentences.
  - Choices are 2–4 options, each a short verb phrase. Result lines are 1–2 sentences with a punchline when it fits.
- Choices must matter, with different effects and sometimes trade-offs. Use `c.rng.chance` for risky outcomes.
- Typical effects:
  - `c.h.stat(k, ±1..±10)`.
  - Money is scaled with `wage(c, usd)`. A gift is about $50–500, a big swing about $2k–20k, and something rare and huge up to about $100k.
- Do not create infinite money or stat loops. `tests/sim.test.ts` checks that 1000 lives stay sane.
- Use `tone: 'good' | 'bad' | 'big'` on choices or events where it fits.
- Death: `c.h.kill(cause)` only with a cause already in `CAUSE_TR` in `src/engine/game.ts`. Ask the lead to add new causes.
- Heirlooms: `c.h.addHeirloom(defId, name, storyLine)` with defId one of clock, ring, piano, quilt, recipes, trophy, painting. Name and story are both `c.t(...)`. Keep heirloom drops rare.
- Every event needs an `id` with a pack prefix (`base.`, `crime.`) that never clashes with an existing id (grep first), a `category` from the Category type, and an age window.

## Checks before you finish
```
npx tsc --noEmit
npx vitest run
```
All tests must pass. Then play a few lives in Turkish with a scratch script and read the logs for English, broken suffixes and repeated lines.
