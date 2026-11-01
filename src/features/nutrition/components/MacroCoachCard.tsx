import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export function MacroCoachCard({ shortfallG, text }: { shortfallG: number; text: string }) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginTop: 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
        }}
      >
        <Icon name="auto_awesome" size={20} color="primary" />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText variant="labelCaps" color="primary" uppercase>
            Macro Coach
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
            From logged meals
          </AppText>
        </View>
        <AppText variant="bodyMd" style={{ lineHeight: 20 }}>
          {shortfallG >= 10 ? (
            <>
              You are{' '}
              <AppText variant="bodyMd" color="primary" weight="semibold">
                {shortfallG}g short
              </AppText>{' '}
              of your daily protein target. {text}
            </>
          ) : (
            text
          )}
        </AppText>
      </View>
    </Card>
  );
}
