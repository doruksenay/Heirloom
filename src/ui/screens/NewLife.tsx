import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import type { Gender } from '../../engine/types';
import { COUNTRIES, getCountry, firstNames } from '../../engine/world';
import { newGame } from '../../engine/game';
import { Avatar } from '../Avatar';
import { T } from '../../i18n/ui';

export function NewLife({ app }: { app: AppApi }) {
  const [gender, setGender] = useState<Gender>('female');
  const [countryId, setCountry] = useState('tr');
  const country = getCountry(countryId);
  const [city, setCity] = useState(country.cities[0]);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');

  const randomize = () => {
    const g: Gender = Math.random() < 0.5 ? 'female' : 'male';
    const c = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    setGender(g);
    setCountry(c.id);
    setCity(c.cities[Math.floor(Math.random() * c.cities.length)]);
    const fn = firstNames(c.id, g);
    setFirst(fn[Math.floor(Math.random() * fn.length)]);
    setLast(c.names.last[Math.floor(Math.random() * c.names.last.length)]);
  };

  const begin = () => {
    const firstName = first.trim() || firstNames(countryId, gender)[0];
    const lastName = last.trim() || country.names.last[0];
    app.start(newGame({ firstName, lastName, gender, countryId, city }, app.profile));
  };

  const sano = () =>
    app.start(
      newGame({ firstName: 'Sano', lastName: 'Baba', gender: 'female', countryId: 'tr', city: 'Zonguldak', scenario: 'sano' }, app.profile),
    );

  return (
    <div class="screen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '12px' }}>
        <div class="eyebrow" lang="en">Heirloom: Life Simulator</div>
        <h1 class="title-xl">{T('Begin a new family')}</h1>
        <p class="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {T('Live one life, then continue as your child. Your home, your heirlooms and your choices carry on.')}
        </p>
      </div>

      <button type="button" class="item" onClick={sano} style={{ border: '1px solid var(--accent)' }}>
        <Avatar id="p0Sano" gender="female" age={20} size={52} label="Sano Baba" />
        <div class="grow">
          <div class="item-title">Sano Baba</div>
          <div class="item-sub">{T('Test life · Zonguldak, Türkiye · 2 family heirlooms')}</div>
        </div>
        <span class="chip accent">{T('Play')}</span>
      </button>

      <div class="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div class="section-head">
          <h2 class="title-l">{T('Custom life')}</h2>
          <button type="button" class="btn small ghost" onClick={randomize}>
            {T('Randomize')}
          </button>
        </div>
        <div class="seg" role="group" aria-label={T('Gender')}>
          <button type="button" aria-pressed={gender === 'female'} onClick={() => setGender('female')}>
            {T('Female')}
          </button>
          <button type="button" aria-pressed={gender === 'male'} onClick={() => setGender('male')}>
            {T('Male')}
          </button>
        </div>
        <div class="row" style={{ alignItems: 'stretch' }}>
          <div class="field grow">
            <label for="first">{T('First name')}</label>
            <input id="first" value={first} placeholder={firstNames(countryId, gender)[0]} onInput={(e) => setFirst(e.currentTarget.value)} />
          </div>
          <div class="field grow">
            <label for="last">{T('Family name')}</label>
            <input id="last" value={last} placeholder={country.names.last[0]} onInput={(e) => setLast(e.currentTarget.value)} />
          </div>
        </div>
        <div class="row" style={{ alignItems: 'stretch' }}>
          <div class="field grow">
            <label for="country">{T('Country')}</label>
            <select
              id="country"
              value={countryId}
              onChange={(e) => {
                const id = e.currentTarget.value;
                setCountry(id);
                setCity(getCountry(id).cities[0]);
              }}
            >
              {COUNTRIES.map((c) => (
                <option value={c.id} key={c.id}>
                  {app.lang === 'tr' ? c.nameTr : c.name}
                </option>
              ))}
            </select>
          </div>
          <div class="field grow">
            <label for="city">{T('City')}</label>
            <select id="city" value={city} onChange={(e) => setCity(e.currentTarget.value)}>
              {country.cities.map((c) => (
                <option value={c} key={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" class="btn primary" onClick={begin}>
          {T('Be born')}
        </button>
      </div>
    </div>
  );
}
