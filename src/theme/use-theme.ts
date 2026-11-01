import { theme, type Theme } from './theme';

/** Single dark theme today; kept as a hook so components don't change if light mode is added. */
export function useTheme(): Theme {
  return theme;
}
