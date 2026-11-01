import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitSphere',
  slug: 'fitsphere',
  scheme: 'fitsphere',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  // Follow the user's theme preference at runtime (see src/theme/use-theme.ts).
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.fitsphere.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'FitSphere uses your location to record the route, distance and pace of your runs, walks and rides.',
      NSCameraUsageDescription: 'FitSphere uses the camera so you can take progress photos.',
      NSPhotoLibraryUsageDescription:
        'FitSphere lets you choose progress photos from your library.',
    },
  },
  android: {
    package: 'com.fitsphere.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
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
      { image: './assets/images/splash-icon.png', imageWidth: 200, backgroundColor: '#FFFFFF' },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'FitSphere uses your location to record your activity route.',
      },
    ],
    [
      'expo-camera',
      { cameraPermission: 'FitSphere uses the camera so you can take progress photos.' },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'FitSphere lets you choose progress photos from your library.' },
    ],
    'expo-notifications',
  ],
  experiments: { typedRoutes: true },
};

export default config;
