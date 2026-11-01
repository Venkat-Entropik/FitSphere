import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme, type ColorToken } from '@/theme';

import { SettingsSection } from './SettingsSection';

export interface BaselineCardProps {
  trajectory: { label: string; deltaText: string; progress: number; targetText: string };
  intake: {
    left: number;
    logged: number;
    percentMet: number;
    progress: number;
    budgetKcal: number;
  };
  proteinG: number;
  proteinNote: string;
  cadence: { days: number; split: string };
  onEdit: () => void;
}

function Tile({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        gap: 6,
        padding: 14,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceLow,
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase style={{ flexShrink: 1 }}>
          {label}
        </AppText>
        {trailing}
      </View>
      {children}
    </View>
  );
}

const Caption = ({
  children,
  color = 'onSurfaceVariant',
}: {
  children: string;
  color?: ColorToken;
}) => (
  <AppText variant="bodySm" color={color} style={{ fontSize: 11, lineHeight: 15 }}>
    {children}
  </AppText>
);

export function BaselineCard({
  trajectory,
  intake,
  proteinG,
  proteinNote,
  cadence,
  onEdit,
}: BaselineCardProps) {
  return (
    <SettingsSection
      title="Biometric Baseline & Targets"
      icon="monitoring"
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit baseline"
          onPress={onEdit}
          hitSlop={10}
        >
          <AppText variant="labelUi" color="primary" weight="semibold">
            Edit
          </AppText>
        </Pressable>
      }
    >
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile
            label="Goal trajectory"
            trailing={
              <AppText variant="labelCaps" color="primary" weight="bold">
                {trajectory.deltaText} kg
              </AppText>
            }
          >
            <AppText variant="bodyLg" weight="bold">
              {trajectory.label}
            </AppText>
            <ProgressBar
              progress={trajectory.progress}
              height={6}
              withGlow
              accessibilityLabel="Progress to target weight"
            />
            <Caption>{trajectory.targetText}</Caption>
          </Tile>
          <Tile
            label="Daily intake"
            trailing={
              <AppText variant="labelCaps" color="primary" weight="bold">
                {intake.left.toLocaleString('en-US')} left
              </AppText>
            }
          >
            <AppText variant="headlineMd" tabular>
              {intake.budgetKcal.toLocaleString('en-US')}{' '}
              <AppText variant="bodySm" color="onSurfaceVariant" weight="regular">
                kcal / day
              </AppText>
            </AppText>
            <ProgressBar
              progress={intake.progress}
              color="secondary"
              height={6}
              accessibilityLabel="Calories logged today"
            />
            <Caption>{`${intake.logged.toLocaleString('en-US')} logged • ${intake.percentMet}% met`}</Caption>
          </Tile>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile label="Protein target">
            <AppText variant="headlineMd" tabular>
              {proteinG}g{' '}
              <AppText variant="bodySm" color="onSurfaceVariant" weight="regular">
                / day
              </AppText>
            </AppText>
            <Caption>{proteinNote}</Caption>
          </Tile>
          <Tile label="Weekly cadence">
            <AppText variant="headlineMd" tabular>
              {cadence.days}{' '}
              <AppText variant="bodySm" color="onSurfaceVariant" weight="regular">
                {cadence.days === 1 ? 'Day' : 'Days'} / week
              </AppText>
            </AppText>
            <Caption>{`Split: ${cadence.split}`}</Caption>
          </Tile>
        </View>
      </View>
    </SettingsSection>
  );
}
