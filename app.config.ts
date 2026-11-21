import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitSphere',
  slug: 'fitsphere',
  scheme: 'fitsphere',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  // The design is dark-only today (see src/theme/use-theme.ts).
  userInterfaceStyle: 'dark',
  backgroundColor: '#121416',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.fitsphere.app',
    infoPlist: {
      // The app only uses the platform's HTTPS; this skips the export-compliance questionnaire on each upload.
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        'FitSphere uses your location to record the route, distance and pace of your runs, walks and rides.',
      NSCameraUsageDescription:
        'FitSphere uses the camera to take progress photos and to scan food barcodes.',
      NSPhotoLibraryUsageDescription:
        'FitSphere lets you choose progress photos from your library.',
    },
  },
  android: {
    package: 'com.fitsphere.app',
    adaptiveIcon: {
      backgroundColor: '#121416',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'CAMERA'],
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      { image: './assets/images/splash-icon.png', imageWidth: 200, backgroundColor: '#121416' },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'FitSphere uses your location to record your activity route.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'FitSphere uses the camera to take progress photos and to scan food barcodes.',
      },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'FitSphere lets you choose progress photos from your library.' },
    ],
    'expo-notifications',
  ],
  experiments: { typedRoutes: true },
  // Links this app to its EAS project (not a secret; it ships in the app's public config).
  extra: { eas: { projectId: '9518525c-6640-419e-8afa-8f4adc70d324' } },
};

export default config;
