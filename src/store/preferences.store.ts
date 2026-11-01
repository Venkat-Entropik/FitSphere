import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandAsyncStorage } from '@/services/storage/app-storage';

export type UnitSystem = 'metric' | 'imperial';

interface PreferencesState {
  units: UnitSystem;
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  onboardingSkipped: boolean;
  /** Whose data the on-device mock backend currently holds; a different user starts from a clean copy. */
  lastUserId: string | null;
  /** Raise loads automatically when every set hits the top of the rep range. */
  autoProgressiveOverload: boolean;
  /** Haptic tap when a set is logged. */
  restHaptics: boolean;
  setUnits: (units: UnitSystem) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  setLastUserId: (id: string | null) => void;
  setAutoProgressiveOverload: (on: boolean) => void;
  setRestHaptics: (on: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      units: 'metric',
      notificationsEnabled: false,
      onboardingComplete: false,
      onboardingSkipped: false,
      lastUserId: null,
      autoProgressiveOverload: true,
      restHaptics: true,
      setUnits: (units) => set({ units }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      skipOnboarding: () => set({ onboardingSkipped: true }),
      setLastUserId: (lastUserId) => set({ lastUserId }),
      setAutoProgressiveOverload: (autoProgressiveOverload) => set({ autoProgressiveOverload }),
      setRestHaptics: (restHaptics) => set({ restHaptics }),
    }),
    { name: 'fitsphere.preferences', storage: zustandAsyncStorage },
  ),
);
