import { Platform, type TextStyle } from 'react-native';

/**
 * Browsers draw their own outline around a focused text input, which clashes with our rounded
 * field containers. Fields show focus with their own border instead; native has no such outline.
 */
export const noFocusRing: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle) : {};
