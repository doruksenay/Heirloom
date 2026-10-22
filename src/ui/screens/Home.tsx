import type { AppApi } from '../app-state';
import { buyFurniture, furniturePrice } from '../../engine/game';
import { FURNITURE, furniture } from '../../engine/home';
import { heirloomDef } from '../../engine/heirlooms';
import { fmtMoney } from '../../engine/context';
import { Icon } from '../icons';

function Room({ items, heirlooms, cat }: { items: string[]; heirlooms: string[]; cat: boolean }) {
  const has = (slot: string) => items.map((i) => furniture(i)).find((f) => f?.slot === slot);
  const sofa = has('sofa');
  return (
    <div class="room">
      <svg viewBox="0 0 350 230" role="img" aria-label="Your living room">
        <rect width="350" height="230" style={{ fill: 'var(--room-wall)' }} />
        <rect y="170" width="350" height="60" style={{ fill: 'var(--room-floor)' }} />
        {/* window */}
        <rect x="40" y="30" width="92" height="80" rx="6" fill="#1C2A3A" />
        <circle cx="110" cy="54" r="10" style={{ fill: 'var(--accent)' }} opacity="0.85" />
        <rect x="40" y="30" width="92" height="80" rx="6" fill="none" stroke="#6B5446" stroke-width="6" />
        <path d="M86 30v80M40 70h92" stroke="#6B5446" stroke-width="4" />
        {has('art') && (
          <g>
            <rect x="214" y="38" width="62" height="46" rx="3" fill="#F5EEE6" stroke="#6B4A2E" stroke-width="4" />
            <path d="M220 78l14-16 10 10 8-8 18 14z" style={{ fill: 'var(--stat-smarts)' }} />
          </g>
        )}
        {heirlooms.includes('clock') && (
          <g aria-label="Heirloom clock">
            <rect x="160" y="62" width="32" height="108" rx="4" fill="#6B4A2E" />
            <circle cx="176" cy="88" r="11" fill="#F5EEE6" />
            <path d="M176 88v-7M176 88l5 3" stroke="#1C1622" stroke-width="2" stroke-linecap="round" />
            <circle cx="176" cy="144" r="5" style={{ fill: 'var(--accent)' }} />
          </g>
        )}
        {has('shelf') && (
          <g>
            <rect x="290" y="56" width="44" height="114" rx="3" fill="#5A3E28" />
            {[70, 100, 130].map((y) => (
              <g key={y}>
                <rect x="294" y={y} width="8" height="22" fill="#C4385A" />
                <rect x="304" y={y + 4} width="7" height="18" fill="#2F5BD3" />
                <rect x="313" y={y} width="9" height="22" fill="#E7B55E" />
              </g>
            ))}
          </g>
        )}
        {has('lamp') && (
          <g>
            <path d="M246 170v-70" stroke="#B8893E" stroke-width="3" />
            <path d="M232 104h28l-6-18h-16z" fill="#E7B55E" />
          </g>
        )}
        {has('rug') && <ellipse cx="110" cy="200" rx="70" ry="13" fill="#B4495E" opacity="0.85" />}
        {sofa ? (
          <g>
            <rect x="22" y="134" width="124" height="40" rx="10" fill={sofa.id === 'sofa_velvet' ? '#7B4FA0' : '#5AB3A2'} />
            <rect x="22" y="116" width="124" height="30" rx="10" fill={sofa.id === 'sofa_velvet' ? '#8F63B5' : '#6CC7B5'} />
            <rect x="14" y="126" width="18" height="46" rx="8" fill={sofa.id === 'sofa_velvet' ? '#6A4190' : '#4FA493'} />
            <rect x="136" y="126" width="18" height="46" rx="8" fill={sofa.id === 'sofa_velvet' ? '#6A4190' : '#4FA493'} />
          </g>
        ) : (
          <rect x="40" y="150" width="60" height="22" rx="4" fill="#8A6A52" aria-label="An old crate" />
        )}
        {has('plant') && (
          <g>
            <rect x="206" y="148" width="22" height="22" rx="3" fill="#B5643A" />
            <ellipse cx="210" cy="132" rx="9" ry="16" fill="#3E8E5C" />
            <ellipse cx="224" cy="128" rx="9" ry="18" fill="#4FA46D" />
          </g>
        )}
        {heirlooms.includes('piano') && (
          <g>
            <rect x="228" y="118" width="96" height="52" rx="4" fill="#151017" />
            <rect x="234" y="140" width="84" height="9" fill="#F5EEE6" />
          </g>
        )}
        {heirlooms.includes('trophy') && <path d="M300 48h16v8a8 8 0 0 1-16 0zM306 64h4v6h-4zM302 70h12v3h-12z" fill="#E7B55E" />}
        {has('bed') && <ellipse cx="270" cy="198" rx="26" ry="9" fill="#8C4F5E" />}
        {cat && (
          <g>
            <ellipse cx="270" cy="192" rx="18" ry="9" fill="#EDE6DD" />
            <circle cx="284" cy="186" r="7" fill="#EDE6DD" />
            <path d="M280 181l2-5 3 4M287 180l2-4 1 5" fill="#EDE6DD" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function Home({ app }: { app: AppApi }) {
  const s = app.game!;
  const p = s.player;
  return (
    <div class="screen">
      <div class="row between" style={{ alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div class="eyebrow">{p.city}</div>
          <h1 class="title-xl">{p.home.name}</h1>
        </div>
        {p.home.owned && (
          <div style={{ textAlign: 'right' }}>
            <div class="eyebrow">Value</div>
            <div class="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}>
              {fmtMoney(p.home.value, p.countryId)}
            </div>
          </div>
        )}
      </div>

      <Room items={p.home.furniture} heirlooms={s.dynasty.heirlooms.map((h) => h.defId)} cat={'pet_cat' in p.flags} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">Heirlooms</h2>
          <span class="muted" style={{ fontSize: '13px' }}>
            Passed down, never sold
          </span>
        </div>
        {s.dynasty.heirlooms.length === 0 && <div class="card tight muted">No heirlooms yet. Win a trophy, or keep something special long enough.</div>}
        <div class="list">
          {s.dynasty.heirlooms.map((h) => {
            const def = heirloomDef(h.defId);
            return (
              <div class="item" key={h.uid}>
                <div class="icon-box">
                  <Icon name={def.icon} />
                </div>
                <div class="grow">
                  <div class="item-title">{h.name}</div>
                  <div class="item-sub">
                    Since {h.sinceYear} · {h.generations} generation{h.generations > 1 ? 's' : ''}
                  </div>
                  <div class="item-sub" style={{ marginTop: '4px' }}>
                    {h.story[h.story.length - 1]}
                  </div>
                </div>
                <span class="chip accent" style={{ whiteSpace: 'normal', textAlign: 'right', maxWidth: '96px' }}>
                  {def.effect}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div class="section-head">
          <h2 class="title-l">Decorate</h2>
          <span class="muted num" style={{ fontSize: '13px' }}>
            Bank {fmtMoney(p.money, p.countryId)}
          </span>
        </div>
        <div class="list">
          {FURNITURE.map((f) => {
            const owned = p.home.furniture.includes(f.id);
            const price = furniturePrice(s, f.id);
            return (
              <div class="item" key={f.id}>
                <div class="icon-box">
                  <Icon name="sofa" />
                </div>
                <div class="grow">
                  <div class="item-title">{f.name}</div>
                  <div class="item-sub">+{f.happiness} Happiness</div>
                </div>
                <button
                  type="button"
                  class="btn small"
                  disabled={owned || p.money < price || p.jailYears > 0}
                  onClick={() => app.act((g) => void buyFurniture(g, f.id))}
                >
                  {owned ? 'Placed' : fmtMoney(price, p.countryId)}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
