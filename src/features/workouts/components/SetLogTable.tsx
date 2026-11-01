import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { WorkoutSet } from '../types/workout.types';
import { formatKg } from '../utils/workout.logic';

const COLS = { set: 2, load: 4, reps: 3, status: 3 } as const;

function HeaderCell({
  label,
  flex,
  align,
}: {
  label: string;
  flex: number;
  align: 'left' | 'center' | 'right';
}) {
  return (
    <AppText
      variant="labelCaps"
      color="onSurfaceVariant"
      uppercase
      style={{ flex, textAlign: align, letterSpacing: 0.9 }}
    >
      {label}
    </AppText>
  );
}

function SetRow({ set }: { set: WorkoutSet }) {
  const theme = useTheme();
  const done = set.status === 'done';
  const active = set.status === 'active';
  const upcoming = set.status === 'upcoming';
  const textColor = upcoming ? 'onSurfaceVariant' : 'onSurface';
  const weight = active ? 'bold' : 'semibold';

  return (
    <View
      accessibilityLabel={`Set ${set.number}, ${formatKg(set.kg)} kilograms, ${set.reps} reps, ${set.status}${set.isPersonalRecord ? ', personal record' : ''}`}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: active ? 12 : 10,
          borderRadius: theme.radius.sm,
          backgroundColor: active
            ? theme.colors.surfaceHigh
            : upcoming
              ? 'rgba(30, 32, 34, 0.5)'
              : theme.colors.surface,
          opacity: upcoming ? 0.75 : 1,
        },
        active && {
          borderWidth: 2,
          borderColor: theme.colors.primary,
          ...glow(theme.colors.primary, 0.18, 20),
        },
      ]}
    >
      <View style={{ flex: COLS.set, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AppText
          variant="headlineMd"
          color={active ? 'primary' : 'onSurfaceVariant'}
          weight={active ? 'bold' : 'bold'}
          tabular
        >
          {set.number}
        </AppText>
        {set.isPersonalRecord ? (
          <AppText accessibilityLabel="Personal record" style={{ fontSize: 12 }}>
            🏆
          </AppText>
        ) : null}
        {active ? (
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }}
          />
        ) : null}
      </View>
      <View
        style={{
          flex: COLS.load,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <AppText variant="headlineMd" color={textColor} weight={weight} tabular>
          {formatKg(set.kg)}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          kg
        </AppText>
      </View>
      <View style={{ flex: COLS.reps, alignItems: 'center' }}>
        <AppText variant="headlineMd" color={textColor} weight={weight} tabular>
          {set.reps}
        </AppText>
      </View>
      <View
        style={{
          flex: COLS.status,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {done && set.isPersonalRecord ? (
          <AppText variant="labelCaps" color="primary" uppercase>
            PR
          </AppText>
        ) : null}
        {done ? (
          <View
            style={[
              {
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(197, 242, 106, 0.2)',
              },
              glow(theme.colors.primary, 0.2, 10),
            ]}
          >
            <Icon name="check" size={18} color="primary" />
          </View>
        ) : active ? (
          <View
            style={[
              {
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
              },
              glow(theme.colors.primary, 0.4, 12),
            ]}
          >
            <Icon name="play_arrow" size={18} color="onPrimary" />
          </View>
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surface,
            }}
          >
            <Icon name="hourglass_empty" size={16} color="onSurfaceVariant" />
          </View>
        )}
      </View>
    </View>
  );
}

export function SetLogTable({ sets }: { sets: readonly WorkoutSet[] }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4 }}>
        <HeaderCell label="Set" flex={COLS.set} align="left" />
        <HeaderCell label="Load" flex={COLS.load} align="center" />
        <HeaderCell label="Reps" flex={COLS.reps} align="center" />
        <HeaderCell label="Status" flex={COLS.status} align="right" />
      </View>
      {sets.map((set) => (
        <SetRow key={set.number} set={set} />
      ))}
    </View>
  );
}
