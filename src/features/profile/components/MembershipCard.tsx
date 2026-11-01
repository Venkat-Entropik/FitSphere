import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { SampleMembership } from '../services/sample-account.mock';
import { SectionChip } from './SettingsSection';

export function MembershipCard({ membership }: { membership: SampleMembership }) {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={['rgba(197, 242, 106, 0.14)', theme.colors.surface, theme.colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: theme.radius.md, padding: 16, gap: 8 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <Icon name="verified" size={22} color="primary" />
          <AppText
            variant="bodyLg"
            weight="bold"
            accessibilityRole="header"
            style={{ flexShrink: 1 }}
          >
            {membership.title}
          </AppText>
        </View>
        <SectionChip label="Sample" tone="warning" />
      </View>
      <AppText variant="bodyMd" color="onSurfaceVariant" style={{ lineHeight: 20 }}>
        {membership.description}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <AppText variant="bodySm" color="onSurfaceVariant">
          {membership.renewsLabel}
        </AppText>
        <AppText variant="labelUi" color="onSurfaceVariant" weight="semibold">
          Billing isn&apos;t connected
        </AppText>
      </View>
    </LinearGradient>
  );
}
