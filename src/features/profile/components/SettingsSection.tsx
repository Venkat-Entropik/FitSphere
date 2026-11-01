import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';

export interface SettingsSectionProps {
  title: string;
  icon?: IconName;
  /** Right-aligned header element (a chip or an action). */
  trailing?: React.ReactNode;
  children: React.ReactNode;
  style?: React.ComponentProps<typeof Card>['style'];
}

/** Titled card shared by every Profile section. */
export function SettingsSection({ title, icon, trailing, children, style }: SettingsSectionProps) {
  return (
    <Card style={[{ gap: 12 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          {icon ? <Icon name={icon} size={20} color="primary" /> : null}
          <AppText
            variant="bodyLg"
            weight="semibold"
            accessibilityRole="header"
            style={{ flexShrink: 1 }}
          >
            {title}
          </AppText>
        </View>
        {trailing}
      </View>
      {children}
    </Card>
  );
}

/** Small pill used in section headers ("SAMPLE", "ACTIVE", …). */
export function SectionChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'lime' | 'warning';
}) {
  const palette = {
    neutral: { bg: '#282a2c', color: 'onSurfaceVariant' as const },
    lime: { bg: 'rgba(197, 242, 106, 0.2)', color: 'primary' as const },
    warning: { bg: 'rgba(244, 190, 98, 0.15)', color: 'warning' as const },
  }[tone];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 9999,
        backgroundColor: palette.bg,
      }}
    >
      <AppText variant="labelCaps" color={palette.color} uppercase>
        {label}
      </AppText>
    </View>
  );
}
