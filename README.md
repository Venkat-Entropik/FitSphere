# FitSphere

AI-powered fitness and wellness app — Expo SDK 58, React Native, TypeScript (strict), Expo Router.

> **Status: Phase 2 complete for every screen in the Stitch export** — Dashboard, Workouts, Activity,
> AI Coach, Nutrition, Analytics, Progress, Onboarding. Not built: Login, Register and Profile (no
> Stitch design exists for them).

## Getting started

```bash
npm install
cp .env.example .env     # EXPO_PUBLIC_API_URL is required
npm start                # then press i / a, or scan with Expo Go
```

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run lint`      | ESLint (`eslint-config-expo` + Prettier) |
| `npm test`          | Jest + React Native Testing Library      |
| `npm run validate`  | typecheck + lint + tests                 |

Only `EXPO_PUBLIC_*` variables are bundled. **Never put secrets here** — AI requests must go through
a backend; `EXPO_PUBLIC_USE_MOCKS=true` selects in-app mock services until it exists.

## Architecture

```
app/            Expo Router routes — thin, each re-exports a feature screen
  (auth)/       login, register, onboarding
  (tabs)/       Home, Workouts, Activity, Coach, Profile
src/
  features/<name>/{components,hooks,services,types,screens}
  components/{ui,cards,charts,common}   shared, theme-driven primitives
  theme/        colors, typography, spacing, radius, shadows, theme, useTheme
  services/     api (axios client, endpoints, ApiError), storage, notifications
  store/        Zustand: auth (status only), preferences (persisted)
  navigation/   custom BottomTabBar
  providers/    QueryClient, gesture handler, safe area
  config/       zod-validated env
__tests__/      Jest tests
```

- **State**: Zustand for client state; TanStack Query for server state (retries only transient errors).
- **Auth tokens** live only in `expo-secure-store`; preferences use AsyncStorage.
- **API**: one axios client; request interceptor adds the bearer token, response interceptor
  normalizes every failure to `ApiError` and signs the user out on 401.
- **Styling**: `StyleSheet` + tokens from `src/theme`. Components never hardcode colors.

## Design

Source: the Stitch export (`stitch_fitsphere_fitness_wellness_platform/`, one folder per screen with
`screen.png` + `code.html`, plus `athletic_precision/DESIGN.md`). Tokens in `src/theme` were taken from
the Tailwind config embedded in each `code.html` (e.g. canvas `#121416`, lime `#c5f26a`, cyan
`#7bd0ff`, violet `#cebdff`; Plus Jakarta Sans + Inter). The design is **dark-only**.

Known, intentional deviations from the reference:

- Remote photos (brand mark, avatars, workout/meal imagery) are not part of the export; neutral
  tonal placeholders are used.
- The activity map is _not_ faked. Real GPS routes are drawn from recorded fixes; the Stitch values
  appear only behind a clearly labelled **sample data** banner.
- Map compass/recenter buttons, chat attach/voice, meal editing and barcode scanning are omitted or shown inactive because they have no function yet.
- The progress heat map is laid out as two rows of 7 (the reference used a non-existent Tailwind class and collapsed to one column); the weight-trend line follows its own delta rather than the reference's contradictory rising line.
- Nutrition totals are derived from the logged meals, so they differ from the reference's hard-coded numbers.
- Pacer and coach copy is rule-based/mock until a backend exists; guidance carries a not-medical-advice note.

## Development notes

- Verify UI on the web target (`npx expo start --web`, phone-width viewport) when no simulator is
  available. Metro's file watcher can miss edits on this machine: restart with `-c` if a change
  doesn't show.
- `/` opens the dashboard (no auth gate yet — sign-in has no design).

## Notes

- Expo SDK 58 / TypeScript 6: `@types/jest` is enabled via `tsconfig` `types`; the tab bar uses
  `expo-router/js-tabs` (the root `Tabs` export is deprecated).
- `react-test-renderer` is pinned to 19.3.0 to match React.
- iOS Simulator verification needs full Xcode; Phase 1 was verified via typecheck, lint, tests,
  `expo export` for iOS + Android, and a live Metro bundle.
