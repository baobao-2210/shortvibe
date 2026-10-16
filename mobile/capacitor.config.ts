import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shortvibe.app',
  appName: 'ShortVibe',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    Camera: {
      permissionsType: 'prompt',
    },
  },
};

export default config;
