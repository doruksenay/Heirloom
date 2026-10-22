import { render } from 'preact';
import { App } from './ui/App';
import { applyTheme, getTheme } from './themes/registry';
import { initStorage, loadProfile } from './platform/storage';
import './ui/fonts/base.css';
import './ui/styles.css';

initStorage().finally(() => {
  applyTheme(getTheme(loadProfile().settings.themeId)); // paint the right colors on the very first frame
  render(<App />, document.getElementById('app')!);
});
