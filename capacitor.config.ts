import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mia.biomechanics',
  appName: 'MIA Biomecánica',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
