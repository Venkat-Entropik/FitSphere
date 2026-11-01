import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandAsyncStorage } from '@/services/storage/app-storage';

export type UnitSystem = 'metric' | 'imperial';

interface PreferencesState {
  units: UnitSystem;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  onboardingSkipped: boolean;
  setUnits: (units: UnitSystem) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      units: 'metric',
      notificationsEnabled: false,
      onboardingComplete: false,
      onboardingSkipped: false,
      setUnits: (units) => set({ units }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      skipOnboarding: () => set({ onboardingSkipped: true }),
    }),
    { name: 'fitsphere.preferences', storage: zustandAsyncStorage },
  ),
);
