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
import { Intro } from './screens/Intro';
import { Daily, DailyEnd } from './screens/Daily';
import { Component, type ComponentChildren } from 'preact';
import { reportError } from '../platform/analytics';

/** Shows a recovery card instead of a blank screen if a screen throws; the save is untouched. */
class Boundary extends Component<{ children: ComponentChildren; onReset: () => void }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch(err: unknown) {
    reportError(err, { source: 'render' });
    this.setState({ failed: true });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div class="screen" style={{ justifyContent: 'center' }}>
        <div class="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h1 class="title-l">{T('Something went wrong')}</h1>
          <p class="muted" style={{ margin: 0 }}>{T('Your family is safe. Tap below to go back to your life.')}</p>
          <button
            type="button"
            class="btn primary"
            onClick={() => {
              this.setState({ failed: false });
              this.props.onReset();
            }}
          >
            {T('Back to my life')}
          </button>
        </div>
      </div>
    );
  }
}

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
  if (app.tab === 'daily') body = <Daily app={app} />;
  else if (!g && !app.profile.introSeen && app.tab !== 'settings' && app.tab !== 'store') body = <Intro app={app} />;
  else if (!g) body = app.tab === 'store' ? <Store app={app} /> : app.tab === 'settings' ? <Settings app={app} /> : <NewLife app={app} />;
  else if (g.dead && g.daily && app.tab !== 'store' && app.tab !== 'settings') body = <DailyEnd app={app} />;
  else if (g.dead && app.tab !== 'store' && app.tab !== 'settings') body = <Summary app={app} />;
  else {
    const screens: Record<Tab, () => preact.JSX.Element> = {
      life: () => <Life app={app} />,
      activities: () => <Activities app={app} />,
      home: () => <Home app={app} />,
      family: () => <Family app={app} />,
      store: () => <Store app={app} />,
      settings: () => <Settings app={app} />,
      daily: () => <Daily app={app} />,
    };
    body = screens[app.tab]();
  }
  const showNav = !!g && !g.dead && app.tab !== 'daily';

  return (
    <div class="shell">
      <Boundary onReset={() => app.go('life')}>{body}</Boundary>
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
