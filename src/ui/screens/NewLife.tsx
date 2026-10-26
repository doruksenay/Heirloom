import { useState } from 'preact/hooks';
import type { AppApi } from '../app-state';
import type { Gender } from '../../engine/types';
import { COUNTRIES, getCountry, firstNames } from '../../engine/world';
import { newGame } from '../../engine/game';
import { Logo, Scene, Wordmark } from '../brand/Brand';
import { T } from '../../i18n/ui';
import { DailyCard } from './Daily';

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

  /** One tap to a fresh random family: the quickest way into the game. */
  const quickStart = () => {
    const g: Gender = Math.random() < 0.5 ? 'female' : 'male';
    const c = app.lang === 'tr' && Math.random() < 0.6 ? getCountry('tr') : COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const fn = firstNames(c.id, g);
    app.start(
      newGame(
        {
          firstName: fn[Math.floor(Math.random() * fn.length)],
          lastName: c.names.last[Math.floor(Math.random() * c.names.last.length)],
          gender: g,
          countryId: c.id,
          city: c.cities[Math.floor(Math.random() * c.cities.length)],
        },
        app.profile,
      ),
    );
  };

  return (
    <div class="screen">
      <Scene height={290} id="nl">
        <Logo size={92} />
        <Wordmark size={44} />
        <div class="tagline">{T('Live a life. Leave a legacy.')}</div>
      </Scene>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h1 class="title-xl">{T('Begin a new family')}</h1>
        <p class="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {T('Live one life, then continue as your child. Your home, your heirlooms and your choices carry on.')}
        </p>
      </div>

      <button type="button" class="btn primary" onClick={quickStart} style={{ minHeight: '56px' }}>
        {T('Start a random life')}
      </button>

      <DailyCard app={app} />

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
