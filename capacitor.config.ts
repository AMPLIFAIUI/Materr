import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oldmate.mentalhealth',
  appName: 'Old Mate',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
