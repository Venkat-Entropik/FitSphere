import { Pressable, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

export interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Shared frame for Sign in / Sign up: brand mark, headline, the form, and an alternate-route footer. */
export function AuthScaffold({ title, subtitle, children, footer }: AuthScaffoldProps) {
  const theme = useTheme();
  return (
    <Screen scroll>
      <View style={{ gap: 24, paddingTop: 32, paddingBottom: 16 }}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={[
                {
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.primary,
                },
                glow(theme.colors.primary, 0.35, 14),
              ]}
            >
              <Icon name="fitness_center" size={20} color="onPrimary" />
            </View>
            <AppText variant="headlineMd">FitSphere</AppText>
          </View>
          <AppText variant="headlineLgMobile" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="bodyMd" color="onSurfaceVariant">
            {subtitle}
          </AppText>
        </View>
        <View style={{ gap: 16 }}>{children}</View>
        <View style={{ alignItems: 'center', gap: 12 }}>{footer}</View>
      </View>
    </Screen>
  );
}

export function AuthLink({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <AppText variant="bodyMd" color="onSurfaceVariant">
        {prompt}
      </AppText>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={action}
        onPress={onPress}
        hitSlop={10}
      >
        <AppText variant="bodyMd" color="primary" weight="semibold">
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(147, 0, 10, 0.25)',
        borderWidth: 1,
        borderColor: theme.colors.errorContainer,
      }}
    >
      <Icon name="error_outline" size={18} color="error" />
      <AppText variant="bodySm" color="onErrorContainer" style={{ flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}
