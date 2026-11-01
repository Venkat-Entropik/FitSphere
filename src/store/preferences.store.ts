import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandAsyncStorage } from '@/services/storage/app-storage';

export type UnitSystem = 'metric' | 'imperial';

interface PreferencesState {
  units: UnitSystem;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  setUnits: (units: UnitSystem) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      units: 'metric',
      notificationsEnabled: false,
      onboardingComplete: false,
      setUnits: (units) => set({ units }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    { name: 'fitsphere.preferences', storage: zustandAsyncStorage },
  ),
);
