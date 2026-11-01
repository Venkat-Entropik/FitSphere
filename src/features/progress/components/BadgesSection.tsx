import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { glow, useTheme } from '@/theme';

import type { Badge, ProgressOverview } from '../types/progress.types';
import { badgeProgressLabel, badgeProgressRatio } from '../utils/progress.logic';
import { TONE_COLOR } from './tone';

const EARNED_BG: Record<Badge['tone'], string> = {
  primary: 'rgba(197, 242, 106, 0.2)',
  secondary: 'rgba(123, 208, 255, 0.2)',
  tertiary: 'rgba(206, 189, 255, 0.2)',
  neutral: 'rgba(196, 231, 255, 0.2)',
};

function BadgeRow({ badge }: { badge: Badge }) {
  const theme = useTheme();
  const earned = badge.status === 'earned';
  const tint =
    badge.tone === 'neutral' ? theme.colors.secondary : theme.colors[TONE_COLOR[badge.tone]];
  return (
    <Card
      tone={earned ? 'default' : 'low'}
      accessibilityLabel={`${badge.title}, ${earned ? 'earned' : badgeProgressLabel(badge)}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        backgroundColor: earned ? theme.colors.surfaceHigh : theme.colors.surfaceLow,
        opacity: earned ? 1 : 0.85,
      }}
    >
      <View
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: earned ? EARNED_BG[badge.tone] : theme.colors.surface,
          },
          earned && glow(tint, 0.35, 18),
        ]}
      >
        <Icon
          name={badge.icon}
          size={earned ? 26 : 24}
          color={
            earned
              ? badge.tone === 'neutral'
                ? 'secondary'
                : TONE_COLOR[badge.tone]
              : 'onSurfaceVariant'
          }
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <AppText
            variant="bodyMd"
            weight={earned ? 'bold' : 'semibold'}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {badge.title}
          </AppText>
          {earned ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: theme.radius.pill,
                backgroundColor: 'rgba(197, 242, 106, 0.15)',
              }}
            >
              <AppText variant="labelCaps" color="primary" weight="bold" uppercase>
                Earned
              </AppText>
            </View>
          ) : (
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="medium">
              {badgeProgressLabel(badge)}
            </AppText>
          )}
        </View>
        <AppText
          variant="bodySm"
          color="onSurfaceVariant"
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {badge.description}
        </AppText>
        {!earned && badge.progress ? (
          <View style={{ marginTop: 8 }}>
            <ProgressBar
              progress={badgeProgressRatio(badge)}
              height={6}
              accessibilityLabel={`${badge.title} progress`}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export function BadgesSection({ badges }: { badges: ProgressOverview['badges'] }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="headlineMd" accessibilityRole="header">
          Unlocked Badges
        </AppText>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
          }}
        >
          <AppText variant="labelCaps" color="primary" weight="semibold">
            {badges.unlocked} / {badges.total} Unlocked
          </AppText>
        </View>
      </View>
      <View style={{ gap: 10 }}>
        {badges.items.map((badge) => (
          <BadgeRow key={badge.id} badge={badge} />
        ))}
      </View>
    </View>
  );
}
