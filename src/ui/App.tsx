import { useApp, type Tab } from './app-state';
import { Icon } from './icons';
import { NewLife } from './screens/NewLife';
import { Life } from './screens/Life';
import { Activities } from './screens/Activities';
import { Home } from './screens/Home';
import { Family } from './screens/Family';
import { Summary } from './screens/Summary';
import { Store } from './screens/Store';
import { Settings } from './screens/Settings';
import { AdOverlay } from './AdOverlay';
import { T } from '../i18n/ui';

const NAV: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'life', label: 'Life', icon: 'life' },
  { tab: 'home', label: 'Home', icon: 'home' },
  { tab: 'family', label: 'Family', icon: 'family' },
  { tab: 'activities', label: 'Activities', icon: 'bolt' },
  { tab: 'store', label: 'Store', icon: 'bag' },
];

export function App() {
  const app = useApp();
  const g = app.game;

  let body;
  if (!g) body = app.tab === 'store' ? <Store app={app} /> : app.tab === 'settings' ? <Settings app={app} /> : <NewLife app={app} />;
  else if (g.dead && app.tab !== 'store' && app.tab !== 'settings') body = <Summary app={app} />;
  else {
    const screens: Record<Tab, () => preact.JSX.Element> = {
      life: () => <Life app={app} />,
      activities: () => <Activities app={app} />,
      home: () => <Home app={app} />,
      family: () => <Family app={app} />,
      store: () => <Store app={app} />,
      settings: () => <Settings app={app} />,
    };
    body = screens[app.tab]();
  }
  const showNav = !!g && !g.dead;

  return (
    <div class="shell">
      {body}
      {showNav && (
        <nav class="nav" aria-label={T('Main')}>
          {NAV.map((n) => (
            <button type="button" key={n.tab} aria-current={app.tab === n.tab ? 'page' : undefined} onClick={() => app.go(n.tab)}>
              <Icon name={n.icon} />
              {T(n.label)}
            </button>
          ))}
        </nav>
      )}
      {!showNav && (app.tab === 'store' || app.tab === 'settings') && (
        <nav class="nav" aria-label={T('Main')}>
          <button type="button" onClick={() => app.go('life')}>
            <Icon name="life" />
            {T('Back')}
          </button>
        </nav>
      )}
      {app.ad && <AdOverlay app={app} />}
      {app.toastMsg && (
        <div class="toast" role="status">
          {app.toastMsg}
        </div>
      )}
    </div>
  );
}
