import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';

export interface PacerCardProps {
  headline: string;
  detail: string;
  /** Marks the cue as coming from the sample activity. */
  caption?: string;
}

export function PacerCard({ headline, detail, caption = 'Just now' }: PacerCardProps) {
  return (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#282a2c',
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginTop: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(123, 208, 255, 0.15)',
        }}
      >
        <Icon name="auto_awesome" size={18} color="secondary" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText variant="labelCaps" color="secondary" uppercase>
            Pacer • Audio Cue
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant">
            {caption}
          </AppText>
        </View>
        <AppText variant="bodyMd" style={{ lineHeight: 21 }}>
          You&apos;re{' '}
          <AppText variant="bodyMd" color="primary" weight="semibold">
            {headline}
          </AppText>
          . {detail}
        </AppText>
      </View>
    </Card>
  );
}
