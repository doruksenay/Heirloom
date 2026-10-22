import type { ActivityDef, ChoiceDef, ContentPack, Ctx, EventDef } from '../types';
import { wage } from '../base/util';
import { bandNames, compact, fameLevel, fameState, fameTitle, gainFans, isPath, loseFans, peekFame, songTitle, type FamePath } from './state';

// "Fame" expansion: music, social media and acting careers, the single-player side of Popmundo.
export const FAME_ENTITLEMENT = 'pack.fame';

/** Tour ladder: cities, fans needed to get booked. */
export const TOURS = [
  { cities: 5, fans: 10_000, name: 'regional mini-tour', pitch: 'Five cities, a borrowed van and a merch box you packed yourself.', done: 'You played five sweaty clubs and sold out of T-shirts in two.' },
  { cities: 10, fans: 30_000, name: 'national club tour', pitch: 'Ten cities across the country. Real venues, a real sound engineer.', done: 'Ten cities, ten encores. People knew the words.' },
  { cities: 20, fans: 100_000, name: 'theater tour', pitch: 'Twenty cities with seats, lighting rigs and a tour manager who never sleeps.', done: 'Twenty theaters, twenty standing ovations, one lost suitcase.' },
  { cities: 30, fans: 300_000, name: 'arena tour', pitch: 'Thirty cities, thirty nights, one tour bus with a broken toilet.', done: 'Thirty arenas. You cannot remember which city you are in.' },
  { cities: 50, fans: 1_000_000, name: 'world tour', pitch: 'Fifty cities on five continents. Stadiums. Private jet. Your face on buildings.', done: 'You played fifty cities around the world. A stadium in another continent sang your song back to you.' },
] as const;

function nextTour(f: { tours?: number }) {
  const done = f.tours ?? 0;
  return done < TOURS.length ? TOURS[done] : TOURS[TOURS.length - 1]; // after the world tour, repeat it
}

const fameOf = (c: Ctx) => fameLevel(peekFame(c.p)?.fans ?? 0);
const hasPath = (c: Ctx) => !!peekFame(c.p)?.path;
const free = (c: Ctx) => c.p.jailYears === 0;

function choosePath(path: FamePath, line: string): ChoiceDef {
  return {
    id: path,
    label: { music: 'Music', social: 'Social media', acting: 'Acting' }[path],
    resolve: (c) => {
      const f = fameState(c.p);
      f.path = path;
      f.lastActiveYear = c.s.year;
      c.h.stat('happiness', 5);
      return line;
    },
    tone: 'big',
  };
}

const bandChoice = (i: number): ChoiceDef => ({
  id: `band${i}`,
  label: (c) => String(c.vars[`name${i}`]),
  resolve: (c) => {
    const f = fameState(c.p);
    const members = [0, 1, 2].map(() => c.h.newPerson({ age: Math.max(14, c.age + c.rng.int(-3, 3)) }));
    members.forEach((m) => c.h.addRelation(m, 'friend', c.rng.int(55, 80)));
    f.band = { name: String(c.vars[`name${i}`]), members: members.map((m) => m.id) };
    return `You formed a band called ${f.band.name} with ${members.map((m) => m.firstName).join(', ')}. First rehearsal is in a garage that smells like oil.`;
  },
  tone: 'big',
});

// ------------------------------------------------------------------ events
const events: EventDef[] = [
  {
    id: 'fame.choose_path',
    category: 'fame',
    scheduled: true,
    title: 'You want to be famous. But for what?',
    text: 'Every path starts small. Some end on billboards.',
    choices: [
      choosePath('music', 'You decided to become a musician. Your neighbors decided to buy earplugs.'),
      choosePath('social', 'You decided to become a content creator. You bought a ring light the same day.'),
      choosePath('acting', 'You decided to become an actor. You practiced crying in the mirror for an hour.'),
      { id: 'later', label: 'Not yet', resolve: () => 'You decided fame can wait.' },
    ],
  },
  {
    id: 'fame.band_name',
    category: 'fame',
    scheduled: true,
    setup: (c) => bandNames(c).forEach((n, i) => (c.vars[`name${i}`] = n)),
    title: 'Your new band needs a name.',
    text: 'Everybody has an opinion. The drummer wants something with "skull" in it.',
    choices: [bandChoice(0), bandChoice(1), bandChoice(2)],
  },
  {
    id: 'fame.label_offer',
    category: 'fame',
    minAge: 16,
    once: true,
    when: (c) => isPath(c, 'music') && !fameState(c.p).label && fameState(c.p).fans >= 5000,
    setup: (c) => {
      c.vars.advance = wage(c, c.rng.int(20000, 80000));
    },
    title: 'A record label wants to sign you.',
    text: (c) => `The major label offers a ${c.h.fmt(Number(c.vars.advance))} advance. A small indie label offers creative freedom and free pizza.`,
    choices: [
      {
        id: 'major',
        label: 'Sign with the major label',
        badge: 'Big money',
        resolve: (c) => {
          const f = fameState(c.p);
          f.label = 'major';
          c.h.money(Number(c.vars.advance));
          gainFans(c, f, f.fans * 0.5);
          return `You signed with a major label and got a ${c.h.fmt(Number(c.vars.advance))} advance. A man in sunglasses now calls you "kid".`;
        },
        tone: 'big',
      },
      {
        id: 'indie',
        label: 'Go with the indie label',
        resolve: (c) => {
          const f = fameState(c.p);
          f.label = 'indie';
          c.h.stat('happiness', 6);
          gainFans(c, f, f.fans * 0.2);
          return 'You signed with the indie label. The pizza was excellent.';
        },
        tone: 'good',
      },
      { id: 'self', label: 'Stay independent', resolve: () => 'You turned both labels down. You will do it your way.' },
    ],
  },
  {
    id: 'fame.viral_song',
    category: 'fame',
    cooldown: 6,
    when: (c) => isPath(c, 'music') && fameState(c.p).songs.some((s) => s.released && s.quality >= 72 && c.s.year - s.year <= 2),
    setup: (c) => {
      const song = fameState(c.p).songs.filter((s) => s.released && s.quality >= 72).pop()!;
      c.vars.title = song.title;
    },
    text: '',
    apply: (c) => {
      const f = fameState(c.p);
      const g = gainFans(c, f, f.fans * 2 + 20000);
      c.h.stat('happiness', 10);
      c.h.achieve('viral');
      return `"${c.vars.title}" blew up on short videos. ${compact(g)} new fans in a month. Strangers sing it at you on the bus.`;
    },
    tone: 'big',
  },
  {
    id: 'fame.paparazzi',
    category: 'fame',
    cooldown: 3,
    when: (c) => fameOf(c) >= 50 && free(c),
    title: 'Paparazzi are waiting outside your favorite café.',
    text: 'You have no make-up, yesterday\'s clothes and a simit in your hand.',
    choices: [
      {
        id: 'smile',
        label: 'Smile and wave',
        resolve: (c) => {
          gainFans(c, fameState(c.p), 2000);
          return 'You smiled and waved. "Down to earth" became your headline.';
        },
      },
      {
        id: 'shove',
        label: 'Shove the camera away',
        badge: 'Risky',
        resolve: (c) => {
          const f = fameState(c.p);
          if (c.rng.chance(0.5)) {
            f.scandals++;
            const lost = loseFans(f, 0.12);
            return `The photo of you shoving a photographer was everywhere. You lost ${compact(lost)} fans.`;
          }
          return 'You pushed the camera away. Weirdly, people loved it.';
        },
      },
      { id: 'hide', label: 'Hide behind the menu', resolve: () => 'You hid behind the menu for two hours. The waiter kept bringing tea.' },
    ],
  },
  {
    id: 'fame.scandal',
    category: 'fame',
    cooldown: 7,
    when: (c) => fameOf(c) >= 40,
    title: 'Your old posts from ten years ago have resurfaced.',
    text: 'They are... not great. Your name is trending for the wrong reasons.',
    choices: [
      {
        id: 'apologize',
        label: 'Post a sincere apology',
        resolve: (c) => {
          const f = fameState(c.p);
          f.scandals++;
          const lost = loseFans(f, 0.08);
          return `You apologized. Most people moved on. You lost ${compact(lost)} fans.`;
        },
      },
      {
        id: 'double',
        label: 'Double down',
        badge: 'Risky',
        resolve: (c) => {
          const f = fameState(c.p);
          f.scandals++;
          if (c.rng.chance(0.35)) {
            const g = gainFans(c, f, f.fans * 0.2);
            return `You doubled down. Somehow you gained ${compact(g)} fans. The internet is a strange place.`;
          }
          const lost = loseFans(f, 0.35);
          c.h.stat('happiness', -10);
          return `You doubled down. It went very badly. You lost ${compact(lost)} fans and two sponsors.`;
        },
      },
      {
        id: 'silent',
        label: 'Go silent for a while',
        resolve: (c) => {
          const lost = loseFans(fameState(c.p), 0.15);
          return `You logged off for three months. It blew over, but ${compact(lost)} fans left.`;
        },
      },
    ],
  },
  {
    id: 'fame.award',
    category: 'fame',
    cooldown: 4,
    when: (c) => {
      const f = peekFame(c.p);
      if (!f || fameLevel(f.fans) < 55) return false;
      return f.path === 'acting' ? f.roles >= 3 : f.albums.some((a) => a.quality >= 70 && c.s.year - a.year <= 1) || f.path === 'social';
    },
    title: 'You have been nominated for a major award!',
    text: 'The ceremony is next month. Your outfit costs more than your first car.',
    choices: [
      {
        id: 'attend',
        label: 'Attend and hope',
        resolve: (c) => {
          const f = fameState(c.p);
          c.h.money(-wage(c, 3000));
          if (c.rng.chance(0.35)) {
            f.awards++;
            gainFans(c, f, f.fans * 0.3);
            c.h.achieve('award');
            const trophy = { music: 'Golden Record', social: 'Creator of the Year award', acting: 'Best Performance statuette' }[f.path ?? 'music'];
            c.h.addHeirloom('trophy', `${c.p.firstName}'s ${trophy}`, `${c.p.firstName} won it on stage in ${c.s.year}.`);
            c.h.stat('happiness', 15);
            return `You won! You forgot everyone's name in your speech except your grandmother's. The ${trophy} goes on the family shelf.`;
          }
          c.h.stat('happiness', -3);
          return 'You did not win. You clapped so hard for the winner that it became a meme.';
        },
      },
      { id: 'skip', label: 'Skip it', resolve: () => 'You skipped the ceremony and watched it in pajamas.' },
    ],
  },
  {
    id: 'fame.bandmate_quits',
    category: 'fame',
    cooldown: 6,
    when: (c) => !!peekFame(c.p)?.band && peekFame(c.p)!.band!.members.length > 0,
    setup: (c) => {
      c.vars.pid = c.rng.pick(fameState(c.p).band!.members);
    },
    title: (c) => `${c.h.person(String(c.vars.pid)).firstName} wants to leave the band.`,
    text: 'Creative differences. Also, they want a salary.',
    choices: [
      {
        id: 'convince',
        label: 'Convince them to stay',
        resolve: (c) => {
          if (c.rng.chance(0.5)) {
            c.h.closeness(String(c.vars.pid), 8);
            return `${c.h.person(String(c.vars.pid)).firstName} agreed to stay. For now.`;
          }
          fameState(c.p).band!.members = fameState(c.p).band!.members.filter((m) => m !== c.vars.pid);
          return `${c.h.person(String(c.vars.pid)).firstName} left anyway and started a rival band.`;
        },
      },
      {
        id: 'solo',
        label: 'Break up the band and go solo',
        badge: 'Big change',
        resolve: (c) => {
          const f = fameState(c.p);
          const name = f.band!.name;
          f.band = null;
          loseFans(f, 0.1);
          return `${name} broke up. Your solo career starts now.`;
        },
      },
    ],
  },
  {
    id: 'fame.brand_deal',
    category: 'fame',
    cooldown: 3,
    when: (c) => isPath(c, 'social') && fameState(c.p).fans >= 20000,
    setup: (c) => {
      c.vars.amt = wage(c, Math.min(200000, fameState(c.p).fans * 0.4));
      c.vars.brand = c.rng.pick(['a suspicious energy drink', 'a teeth-whitening pen', 'a crypto app', 'a meal-kit company', 'a luxury hotel']);
    },
    title: (c) => `${String(c.vars.brand)[0].toUpperCase()}${String(c.vars.brand).slice(1)} wants you to promote them.`,
    text: (c) => `They offer ${c.h.fmt(Number(c.vars.amt))} for three posts.`,
    choices: [
      {
        id: 'take',
        label: 'Take the money',
        resolve: (c) => {
          c.h.money(Number(c.vars.amt));
          if (c.rng.chance(0.3)) {
            const lost = loseFans(fameState(c.p), 0.1);
            return `You promoted ${c.vars.brand}. Your fans called you a sellout and ${compact(lost)} unfollowed.`;
          }
          return `You promoted ${c.vars.brand} and earned ${c.h.fmt(Number(c.vars.amt))}.`;
        },
      },
      {
        id: 'decline',
        label: 'Decline',
        resolve: (c) => {
          gainFans(c, fameState(c.p), 1000);
          return 'You turned the deal down and told your fans why. They respected it.';
        },
      },
    ],
  },
  {
    // Staged tours: each one unlocks after the previous is done and the fan base is big enough.
    id: 'fame.tour',
    category: 'fame',
    cooldown: 2,
    when: (c) => {
      if (!isPath(c, 'music') || !free(c)) return false;
      const t = nextTour(fameState(c.p));
      return !!t && fameState(c.p).fans >= t.fans;
    },
    setup: (c) => {
      const f = fameState(c.p);
      const t = nextTour(f)!;
      c.vars.tier = TOURS.indexOf(t);
      c.vars.repeat = (f.tours ?? 0) >= TOURS.length ? 1 : 0;
    },
    title: (c) => {
      const t = TOURS[Number(c.vars.tier)];
      return c.vars.repeat ? `Your fans want another ${t.cities}-city ${t.name}.` : `Your manager has booked a ${t.cities}-city ${t.name}.`;
    },
    text: (c) => TOURS[Number(c.vars.tier)].pitch,
    choices: [
      {
        id: 'go',
        label: (c) => `Go on the ${TOURS[Number(c.vars.tier)].cities}-city tour`,
        resolve: (c) => {
          const f = fameState(c.p);
          const t = TOURS[Number(c.vars.tier)];
          // a tour booked right at the edge of your fan base can play to half-empty rooms
          const shaky = f.fans < t.fans * 1.5 && c.rng.chance(0.25);
          const pay = wage(c, Math.min(5_000_000, f.fans * 0.02 * t.cities) * (shaky ? 0.45 : 1));
          c.h.money(pay);
          const g = gainFans(c, f, f.fans * (shaky ? 0.04 : 0.08 + t.cities / 250));
          c.h.stat('health', -Math.ceil(2 + t.cities / 6));
          c.h.stat('happiness', shaky ? -3 : 6);
          const partner = c.h.partner();
          if (partner) c.h.closeness(partner.person.id, -Math.ceil(t.cities / 5));
          if (!c.vars.repeat) f.tours = (f.tours ?? 0) + 1;
          if (t.cities === 50) c.h.achieve('world_tour');
          const stage = c.vars.repeat ? '' : ` Tour ${Number(c.vars.tier) + 1} of ${TOURS.length} done.`;
          return shaky
            ? `The ${t.name} played to half-empty rooms in some cities. It still earned ${c.h.fmt(pay)} and ${compact(g)} fans.${stage}`
            : `${t.done} The tour earned ${c.h.fmt(pay)} and ${compact(g)} new fans.${stage}`;
        },
        tone: 'good',
      },
      { id: 'rest', label: 'Not this year', resolve: (c) => (c.h.stat('health', 4), 'You said no to the tour and slept for a week.') },
    ],
  },
  {
    id: 'fame.reality_show',
    category: 'fame',
    once: true,
    when: (c) => hasPath(c) && fameOf(c) >= 30 && fameOf(c) < 70,
    title: 'A reality show wants you as a contestant.',
    text: 'Eight celebrities, one villa, unlimited cameras.',
    choices: [
      {
        id: 'join',
        label: 'Join the show',
        resolve: (c) => {
          const f = fameState(c.p);
          const g = gainFans(c, f, f.fans * 0.8);
          c.h.stat('happiness', -5);
          c.h.money(wage(c, 25000));
          return `You joined the show and gained ${compact(g)} fans. You also cried on camera about a sandwich.`;
        },
      },
      { id: 'no', label: 'Keep your dignity', resolve: () => 'You said no. You watched the show anyway and judged everyone.' },
    ],
  },
  {
    id: 'fame.comeback',
    category: 'fame',
    once: true,
    minAge: 40,
    when: (c) => {
      const f = peekFame(c.p);
      return !!f && f.peakFame >= 55 && fameLevel(f.fans) < 35;
    },
    title: 'Fans are asking for a comeback.',
    text: 'A promoter thinks nostalgia is worth a lot of money.',
    choices: [
      {
        id: 'comeback',
        label: 'Do the comeback',
        resolve: (c) => {
          const f = fameState(c.p);
          const g = gainFans(c, f, f.fans * 1.5 + 30000);
          c.h.money(wage(c, 60000));
          c.h.stat('happiness', 10);
          return `Your comeback sold out in minutes. ${compact(g)} fans, old and new, are back.`;
        },
        tone: 'big',
      },
      { id: 'no', label: 'Leave the past in the past', resolve: () => 'You said no. Some legends stay legends by disappearing.' },
    ],
  },
  {
    id: 'fame.fan_letter',
    category: 'fame',
    cooldown: 5,
    when: (c) => fameOf(c) >= 20,
    text: '',
    apply: (c) => {
      c.h.stat('happiness', 6);
      return c.rng.pick([
        'A fan wrote to say your work got them through the hardest year of their life. You kept the letter.',
        'A kid at the airport asked for your autograph and then asked who you were.',
        'A fan tattooed your face on their arm. It looks nothing like you.',
      ]);
    },
  },
];

// ------------------------------------------------------------------ activities
const activities: ActivityDef[] = [
  {
    id: 'fame_start',
    label: 'Chase fame',
    description: 'Music, social media or acting',
    group: 'Fame',
    minAge: 10,
    available: (c) => !hasPath(c) && free(c),
    run: () => ({ event: 'fame.choose_path' }),
  },
  // music
  {
    id: 'fame_practice',
    label: 'Practice your instrument',
    description: '+Skill',
    group: 'Fame',
    minAge: 8,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(3, 7));
      return c.rng.pick(['You practiced scales until your fingers hurt.', 'You learned a song you hate. You play it perfectly now.', 'You practiced for four hours. Your neighbor knocked twice.']);
    },
  },
  {
    id: 'fame_write',
    label: 'Write a song',
    description: 'Quality depends on Skill, Smarts and Happiness',
    group: 'Fame',
    minAge: 10,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const q = Math.max(1, Math.min(100, Math.round(f.skill * 0.55 + c.p.stats.smarts * 0.25 + c.p.stats.happiness * 0.15 + c.rng.int(-15, 15))));
      const title = songTitle(c);
      f.songs.push({ title, quality: q, year: c.s.year, released: false });
      const verdict = q >= 80 ? 'It might be a hit.' : q >= 60 ? 'It is pretty good.' : q >= 40 ? 'It is fine.' : 'It is bad. Like, really bad.';
      return `You wrote a song called "${title}" (quality ${q}). ${verdict}`;
    },
  },
  {
    id: 'fame_band',
    label: 'Form a band',
    description: 'Find three bandmates',
    group: 'Fame',
    minAge: 13,
    available: (c) => isPath(c, 'music') && !fameState(c.p).band && free(c),
    run: () => ({ event: 'fame.band_name' }),
  },
  {
    id: 'fame_gig',
    label: 'Play a gig',
    description: '+Fans, a little money',
    group: 'Fame',
    minAge: 12,
    perYear: 2,
    available: (c) => isPath(c, 'music') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      if (c.rng.chance(0.15)) {
        c.h.stat('happiness', -4);
        return 'Your gig was a disaster. The amp died and so did the crowd.';
      }
      const crowd = Math.round(20 + f.skill * 3 + f.fans * 0.04 * c.rng.next());
      const g = gainFans(c, f, crowd * (0.3 + f.skill / 200) * (f.band ? 1.3 : 1));
      c.h.money(wage(c, crowd * 2));
      return `You played to ${compact(crowd)} people${f.band ? ` with ${f.band.name}` : ''}. ${compact(g)} new fans.`;
    },
  },
  {
    id: 'fame_single',
    label: 'Release a single',
    description: 'Put your best unreleased song out',
    group: 'Fame',
    minAge: 12,
    available: (c) => isPath(c, 'music') && fameState(c.p).songs.some((s) => !s.released) && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const song = [...f.songs].filter((s) => !s.released).sort((a, b) => b.quality - a.quality)[0];
      song.released = true;
      song.year = c.s.year;
      const g = gainFans(c, f, (song.quality ** 2 / 10) * (1 + f.fans / 20000) * (f.label === 'major' ? 2 : f.label ? 1.3 : 1));
      return `You released "${song.title}". ${song.quality >= 70 ? 'Radio stations picked it up!' : 'A few people noticed.'} ${compact(g)} new fans.`;
    },
  },
  {
    id: 'fame_album',
    label: 'Record an album',
    description: 'Needs 4 unreleased songs',
    group: 'Fame',
    minAge: 15,
    available: (c) => isPath(c, 'music') && fameState(c.p).songs.filter((s) => !s.released).length >= 4 && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const tracks = f.songs.filter((s) => !s.released);
      const quality = Math.round(tracks.reduce((a, s) => a + s.quality, 0) / tracks.length);
      const cost = f.label ? 0 : wage(c, 4000);
      c.h.money(-cost);
      tracks.forEach((s) => (s.released = true));
      const title = tracks.sort((a, b) => b.quality - a.quality)[0].title;
      const sales = Math.round((quality ** 2 / 50) * (1 + f.fans / 50000) * (f.label === 'major' ? 2.5 : f.label ? 1.4 : 1));
      f.albums.push({ title, year: c.s.year, quality, sales });
      const g = gainFans(c, f, sales * 40);
      c.h.money(wage(c, sales * (f.label === 'major' ? 400 : 800)));
      return `You released the album "${title}" (quality ${quality}). It sold ${compact(sales * 1000)} copies and brought ${compact(g)} new fans.${cost ? ` Recording cost ${c.h.fmt(cost)}.` : ''}`;
    },
  },
  // social
  {
    id: 'fame_post',
    label: 'Post content',
    description: '+Fans, depends on Looks and luck',
    group: 'Fame',
    minAge: 13,
    perYear: 3,
    available: (c) => isPath(c, 'social') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const roll = c.rng.next();
      if (roll > 0.96) {
        const g = gainFans(c, f, f.fans * 1.5 + 50000);
        c.h.achieve('viral');
        return `Your video went massively viral. ${compact(g)} new followers overnight.`;
      }
      const g = gainFans(c, f, (50 + c.p.stats.looks * 6 + f.fans * 0.08) * (0.4 + roll));
      const what = c.rng.pick(['a "day in my life" video', 'a dance trend', 'a rant about public transport', 'a cooking fail', 'a get-ready-with-me']);
      return `You posted ${what}. ${compact(g)} new followers.`;
    },
  },
  {
    id: 'fame_collab',
    label: 'Collab with another creator',
    description: 'Big boost, needs 5K followers',
    group: 'Fame',
    minAge: 14,
    available: (c) => isPath(c, 'social') && fameState(c.p).fans >= 5000 && free(c),
    run: (c) => {
      const f = fameState(c.p);
      if (c.rng.chance(0.2)) {
        f.scandals++;
        loseFans(f, 0.05);
        return 'The collab ended in a public feud. Everybody watched. Nobody won.';
      }
      const g = gainFans(c, f, f.fans * 0.35);
      return `Your collab video was a hit. ${compact(g)} new followers.`;
    },
  },
  // acting
  {
    id: 'fame_class',
    label: 'Take acting classes',
    description: '+Skill',
    group: 'Fame',
    minAge: 8,
    perYear: 2,
    available: (c) => isPath(c, 'acting') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      f.skill = Math.min(100, f.skill + c.rng.int(3, 7));
      c.h.money(-wage(c, 150));
      return c.rng.pick(['Your acting coach made you be a tree for an hour.', 'You did a Shakespeare monologue. The coach nodded slowly.', 'You practiced crying on command. You are now unstoppable.']);
    },
  },
  {
    id: 'fame_audition',
    label: 'Go to an audition',
    description: 'Land a role',
    group: 'Fame',
    minAge: 10,
    perYear: 2,
    available: (c) => isPath(c, 'acting') && free(c),
    run: (c) => {
      const f = fameState(c.p);
      const tier = Math.min(3, Math.floor(f.roles / 2));
      const role = ['a background role in a soap opera', 'a supporting role in a TV series', 'the lead in a TV series', 'the lead in a feature film'][tier];
      if (c.rng.chance(0.2 + f.skill / 250 + c.p.stats.looks / 400 - tier * 0.05)) {
        f.roles++;
        const pay = wage(c, [1500, 12000, 60000, 250000][tier]);
        c.h.money(pay);
        const g = gainFans(c, f, [300, 4000, 40000, 300000][tier] * (0.5 + f.skill / 100));
        return `You got ${role}! Paid ${c.h.fmt(pay)} and ${compact(g)} new fans.`;
      }
      return `You auditioned for ${role}. They said you were "almost right". Next time.`;
    },
  },
  {
    id: 'fame_meet',
    label: 'Meet your fans',
    description: '+Happiness, +Fans',
    group: 'Fame',
    minAge: 12,
    available: (c) => fameOf(c) >= 20 && free(c),
    run: (c) => {
      c.h.stat('happiness', 5);
      const g = gainFans(c, fameState(c.p), fameState(c.p).fans * 0.03);
      return `You signed autographs for three hours. ${compact(g)} new fans and one sore wrist.`;
    },
  },
  {
    id: 'fame_quit',
    label: 'Retire from the spotlight',
    description: 'Leave fame behind',
    group: 'Fame',
    minAge: 18,
    available: (c) => hasPath(c),
    run: (c) => {
      const f = fameState(c.p);
      const title = fameTitle(f);
      f.path = null;
      c.h.stat('happiness', 3);
      return `You retired from the spotlight as a ${title}. Your fans will remember.`;
    },
  },
];

// ------------------------------------------------------------------ yearly tick
function onYear(c: Ctx) {
  const f = peekFame(c.p);
  if (!f || (!f.path && f.fans === 0)) return;
  // income
  if (f.path === 'music') {
    const streams = f.fans * 0.12 + f.albums.reduce((a, al) => a + al.sales * 30, 0);
    c.h.money(wage(c, streams * (f.label === 'major' ? 0.6 : 1)));
    f.albums.forEach((al) => (al.sales = Math.round(al.sales * 0.6)));
  } else if (f.path === 'social' && f.fans >= 10000) {
    c.h.money(wage(c, f.fans * 0.2));
  }
  // fans drift away when you stop working
  const idle = c.s.year - f.lastActiveYear;
  if (idle >= 1) loseFans(f, Math.min(0.5, 0.06 + idle * 0.04));
  // fame shows as your title when you have no regular job
  if (!c.p.jobId && f.path && fameLevel(f.fans) >= 20) c.p.jobTitle = fameTitle(f);
  f.peakFame = Math.max(f.peakFame, fameLevel(f.fans));
  if (fameLevel(f.fans) >= 80) c.h.achieve('superstar');
}

export const famePack: ContentPack = {
  id: 'fame',
  title: 'Fame',
  description: 'Music, social media and acting. Form a band, write songs, release albums, go viral, survive scandals.',
  rating: 'all',
  entitlement: FAME_ENTITLEMENT,
  events,
  activities,
  onYear,
  lifeTiles: (s) => {
    const f = peekFame(s.player);
    if (!f || (!f.path && f.fans === 0)) return [];
    return [
      { label: 'Fans', value: compact(f.fans) },
      { label: 'Fame', value: `${fameLevel(f.fans)}` },
      { label: f.path ? 'Status' : 'Former', value: f.path ? fameTitle(f) : 'Retired star' },
    ];
  },
  goals: [
    { id: 'fame_star', label: 'Reach 60 Fame', check: (s) => (peekFame(s.player)?.peakFame ?? 0) >= 60 },
    { id: 'fame_world_tour', label: 'Finish a world tour', check: (s) => s.player.achievements.includes('world_tour') },
  ],
  ribbons: [
    { id: 'superstar', name: 'Superstar', desc: 'Reached 80+ Fame.', test: (_r, p) => (peekFame(p)?.peakFame ?? 0) >= 80 },
    { id: 'world_tour', name: 'Around the World', desc: 'Finished a 50-city world tour.', test: (_r, p) => p.achievements.includes('world_tour') },
    { id: 'controversial', name: 'Controversial', desc: 'Three or more public scandals.', test: (_r, p) => (peekFame(p)?.scandals ?? 0) >= 3 },
    { id: 'one_hit', name: 'One-Hit Wonder', desc: 'Was famous once, then faded away.', test: (_r, p) => {
      const f = peekFame(p);
      return !!f && f.peakFame >= 50 && fameLevel(f.fans) < 25;
    } },
  ],
};
