import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme';

/** Always shown above sample data so it can never be mistaken for a recorded activity. */
export function SampleBanner({ onExit }: { onExit: () => void }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: 8,
        padding: 12,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        backgroundColor: 'rgba(244, 190, 98, 0.08)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="science" size={18} color="warning" />
        <AppText variant="labelCaps" color="warning" uppercase>
          Sample data — not a recorded activity
        </AppText>
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        This preview shows how a finished run looks. Nothing here came from your device.
      </AppText>
      <SecondaryButton label="Exit sample" onPress={onExit} size="md" />
    </View>
  );
}
