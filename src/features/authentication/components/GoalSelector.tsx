import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme, type ColorToken } from '@/theme';

import type { GoalId, GoalOption } from '../types/onboarding.types';

const ICON_TINT: Record<GoalId, ColorToken> = {
  muscle: 'onPrimary',
  fat_loss: 'secondary',
  endurance: 'secondary',
  athletic: 'tertiary',
};

export interface GoalSelectorProps {
  goals: readonly GoalOption[];
  value: GoalId;
  recommended: GoalId;
  onChange: (id: GoalId) => void;
}

export function GoalSelector({ goals, value, recommended, onChange }: GoalSelectorProps) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
      {goals.map((goal) => {
        const selected = goal.id === value;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="radio"
            accessibilityLabel={goal.title}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(goal.id)}
            style={{ opacity: selected ? 1 : 0.85 }}
          >
            <LinearGradient
              colors={
                selected
                  ? [theme.colors.surface, theme.colors.surfaceHigh, theme.colors.surface]
                  : [theme.colors.surface, theme.colors.surface]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[{ borderRadius: theme.radius.md, padding: 16 }, theme.shadows.md]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View
                    style={[
                      {
                        width: 40,
                        height: 40,
                        borderRadius: theme.radius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surfaceHighest,
                      },
                      selected && glow(theme.colors.primary, 0.3, 16),
                    ]}
                  >
                    <Icon
                      name={goal.icon}
                      size={20}
                      color={selected ? 'onPrimary' : ICON_TINT[goal.id]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <AppText
                        variant="headlineMd"
                        color={selected ? 'onSurface' : 'onSurface'}
                        style={{ flexShrink: 1 }}
                      >
                        {goal.title}
                      </AppText>
                      {goal.id === recommended ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: theme.radius.pill,
                            backgroundColor: theme.colors.primary,
                          }}
                        >
                          <AppText variant="labelCaps" color="onPrimary" uppercase>
                            Recommended
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="bodySm" color="onSurfaceVariant">
                      {goal.subtitle}
                    </AppText>
                  </View>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceHighest,
                  }}
                >
                  {selected ? <Icon name="check" size={16} color="onPrimary" /> : null}
                </View>
              </View>
              <AppText
                variant="bodySm"
                color={selected ? 'onSurface' : 'onSurfaceVariant'}
                style={{ marginTop: 12, lineHeight: 17 }}
              >
                {goal.description}
              </AppText>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
}
