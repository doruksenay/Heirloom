import { describe, expect, it } from 'vitest';
import { PACKS } from '../src/content/registry';
import { SCENES } from '../src/ui/scenes/scenes';
import { SceneArt } from '../src/ui/scenes/SceneArt';
import { SCENE_BY_EVENT, SCENE_PATTERNS, sceneFor } from '../src/ui/scenes/map';

const IDS = PACKS.flatMap((p) => p.events.map((e) => e.id));

describe('scenes', () => {
  it('has the 14 priority scenes', () => {
    expect(Object.keys(SCENES)).toHaveLength(14);
  });
  it('every mapped scene exists', () => {
    for (const sc of Object.values(SCENE_BY_EVENT)) expect(SCENES[sc], sc).toBeTruthy();
    for (const [, sc] of SCENE_PATTERNS) expect(SCENES[sc], sc).toBeTruthy();
  });
  it('every exact id is a real event', () => {
    for (const id of Object.keys(SCENE_BY_EVENT)) expect(IDS, id).toContain(id);
  });
  it('every pattern matches a real event', () => {
    for (const [re] of SCENE_PATTERNS) expect(IDS.some((i) => re.test(i)), String(re)).toBe(true);
  });
  it('sceneFor resolves real ids and returns null otherwise', () => {
    expect(sceneFor('base.proposal')).toBe('proposal');
    expect(sceneFor('tr.kina')).toBe('wedding');
    expect(sceneFor('nope.unknown', 'love')).toBeNull();
    expect(sceneFor('')).toBeNull();
  });
  it('each scene renders a vnode; unknown renders nothing', () => {
    for (const id of Object.keys(SCENES)) {
      const v = SceneArt({ id });
      expect(v, id).not.toBeNull();
      expect((v as any).type).toBe('svg');
    }
    expect(SceneArt({ id: 'zzz' })).toBeNull();
  });
  it('reports coverage', () => {
    expect(IDS.filter((i) => sceneFor(i)).length).toBeGreaterThan(40);
  });
});
