import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { AppHeader } from '@/components/ui/AppHeader';
import { useHydrated } from '@/hooks/useHydrated';
import { BottomTabBar } from '@/navigation/BottomTabBar';
import { usePreferencesStore } from '@/store/preferences.store';
import { colors } from '@/theme';

export default function TabsLayout() {
  const hydrated = useHydrated(usePreferencesStore);
  const onboarded = usePreferencesStore((s) => s.onboardingComplete || s.onboardingSkipped);

  // First launch: set up the profile before anything shows targets derived from it.
  if (!hydrated) return null;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: () => <AppHeader />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Routable, but not shown in the tab bar (BottomTabBar only renders its five known tabs). */}
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Tabs>
  );
}
