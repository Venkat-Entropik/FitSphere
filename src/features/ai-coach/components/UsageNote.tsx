import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';

import type { CoachUsage } from '../types/coach.types';

/** "7 of 10 messages left today", or when it resets once they are gone. */
export function usageLabel(usage: CoachUsage, now = Date.now()): string {
  if (usage.remaining > 0) {
    return `${usage.remaining} of ${usage.limit} coach messages left today`;
  }
  const hours = Math.max(1, Math.ceil((usage.resetsAt - now) / 3_600_000));
  return `Daily limit reached. More messages in about ${hours} ${hours === 1 ? 'hour' : 'hours'}.`;
}

export function UsageNote({ usage }: { usage: CoachUsage }) {
  const out = usage.remaining === 0;
  return (
    <View
      accessibilityRole="text"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}
    >
      <Icon name="chat" size={14} color={out ? 'error' : 'onSurfaceVariant'} />
      <AppText
        variant="bodySm"
        color={out ? 'error' : 'onSurfaceVariant'}
        style={{ flexShrink: 1 }}
      >
        {usageLabel(usage)}
      </AppText>
    </View>
  );
}
