import type { CapacitorConfig } from '@capacitor/cli';

// appId must be unique on the stores. Change it to your own reverse domain before the first upload
// (e.g. com.yourcompany.heirloom); it cannot be changed after the app is published.
const config: CapacitorConfig = {
  appId: 'com.heirloomgame.lifesim',
  appName: 'Heirloom',
  webDir: 'dist',
  backgroundColor: '#1C1622',
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#1C1622',
      showSpinner: false,
    },
  },
};

export default config;
