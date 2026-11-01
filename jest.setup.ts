process.env.EXPO_PUBLIC_API_URL = 'http://api.test.local';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Reanimated/worklets need native runtimes that don't exist in Jest; animations are cosmetic here.
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const identity = <T>(value: T) => value;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: identity,
    withSpring: identity,
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: identity,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    cancelAnimation: () => undefined,
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) => fn(...args),
}));

// Icon fonts load through native asset modules; render the glyph name as text instead.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const makeIcon = () => {
    const Icon = ({ name }: { name: string }) => React.createElement(Text, null, name);
    return Icon;
  };
  return { MaterialIcons: makeIcon(), MaterialCommunityIcons: makeIcon() };
});
/* eslint-enable @typescript-eslint/no-require-imports */

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
