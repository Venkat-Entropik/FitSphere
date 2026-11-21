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
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      {trailing}
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
      title="Your targets"
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
            label="Goal"
            trailing={
              <AppText variant="labelCaps" color="primary" weight="bold">
                {trajectory.deltaText} kg
              </AppText>
            }
          >
            <AppText variant="bodyMd" weight="bold" numberOfLines={2}>
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
            label="Calories"
            trailing={
              <AppText variant="labelCaps" color="primary" weight="bold" numberOfLines={1}>
                {intake.left.toLocaleString('en-US')} left
              </AppText>
            }
          >
            <View>
              <AppText variant="headlineMd" tabular numberOfLines={1}>
                {intake.budgetKcal.toLocaleString('en-US')}
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                kcal / day
              </AppText>
            </View>
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
          <Tile label="Protein">
            <View>
              <AppText variant="headlineMd" tabular numberOfLines={1}>
                {proteinG}g
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                per day
              </AppText>
            </View>
            <Caption>{proteinNote}</Caption>
          </Tile>
          <Tile label="Training">
            <View>
              <AppText variant="headlineMd" tabular numberOfLines={1}>
                {cadence.days} {cadence.days === 1 ? 'day' : 'days'}
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant">
                per week
              </AppText>
            </View>
            <Caption>{`Split: ${cadence.split}`}</Caption>
          </Tile>
        </View>
      </View>
    </SettingsSection>
  );
}
