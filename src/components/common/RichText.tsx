import { AppText, type AppTextProps } from '@/components/ui/AppText';
import type { ColorToken } from '@/theme';

import { parseEmphasis } from '@/features/ai-coach/utils/text';

export interface RichTextProps extends Omit<AppTextProps, 'children'> {
  /** Text with `**bold**` emphasis. */
  text: string;
  emphasisColor?: ColorToken;
}

/** Renders `**bold**` segments with a heavier weight and optional accent color. */
export function RichText({ text, emphasisColor, ...rest }: RichTextProps) {
  return (
    <AppText {...rest}>
      {parseEmphasis(text).map((segment, i) =>
        segment.bold ? (
          <AppText
            key={i}
            variant={rest.variant}
            weight="semibold"
            color={emphasisColor ?? rest.color}
            style={rest.style}
          >
            {segment.text}
          </AppText>
        ) : (
          segment.text
        ),
      )}
    </AppText>
  );
}
