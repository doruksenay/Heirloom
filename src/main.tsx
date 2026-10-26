import { render } from 'preact';
import { App } from './ui/App';
import { applyTheme, getTheme } from './themes/registry';
import { initStorage, loadProfile } from './platform/storage';
import { configureAnalytics, installGlobalHandlers, track } from './platform/analytics';
import './ui/fonts/bloom.css'; // brand fonts: Fredoka + Nunito (also used by the Bloom theme)
import './ui/styles.css';

initStorage().finally(() => {
  const profile = loadProfile();
  applyTheme(getTheme(profile.settings.themeId)); // paint the right colors on the very first frame
  configureAnalytics({ consent: profile.settings.analytics, lang: profile.settings.language ?? 'en' });
  installGlobalHandlers();
  track('app_open', { has_save: !!localStorage.getItem('heirloom.save.v1') });
  render(<App />, document.getElementById('app')!);
});
