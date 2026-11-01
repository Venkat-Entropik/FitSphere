import { Image, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Sparkline } from '@/components/charts/Sparkline';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { BodySnapshot, ProgressOverview } from '../types/progress.types';
import type { PhotoStatus } from '../hooks/useProgressPhoto';
import { bodyDelta, signedDelta } from '../utils/progress.logic';

function PhotoPanel({
  caption,
  captionColor,
  highlighted,
  uri,
  badgeText,
  rows,
  labelIcon,
}: {
  caption: string;
  captionColor: ColorToken;
  highlighted?: boolean;
  uri?: string | null;
  badgeText: string;
  rows: { label: string; value: string; tone?: ColorToken }[];
  labelIcon: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceLowest,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <AppText
          variant="labelCaps"
          color={captionColor}
          uppercase
          weight={highlighted ? 'semibold' : 'semibold'}
          style={{ flexShrink: 1 }}
        >
          {caption}
        </AppText>
        <Icon name={labelIcon} size={16} color={highlighted ? 'primary' : 'onSurfaceVariant'} />
      </View>
      {/* Reference photos are remote assets in the Stitch export; the user's own photo is used when taken. */}
      <View
        style={{
          height: 144,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityLabel="Progress photo"
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Icon name="person" size={48} color="outline" />
        )}
        <View
          style={{
            position: 'absolute',
            left: 6,
            bottom: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.xs,
            backgroundColor: highlighted ? theme.colors.primary : 'rgba(12, 14, 16, 0.8)',
          }}
        >
          <AppText
            variant="labelCaps"
            color={highlighted ? 'onPrimary' : 'onSurface'}
            weight={highlighted ? 'bold' : 'semibold'}
          >
            {badgeText}
          </AppText>
        </View>
      </View>
      <View
        style={{
          marginTop: 12,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface,
          gap: 2,
        }}
      >
        {rows.map((row) => (
          <View
            key={row.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}
          >
            <AppText variant="bodySm" color="onSurfaceVariant">
              {row.label}
            </AppText>
            <AppText
              variant="bodySm"
              color={row.tone ?? 'onSurface'}
              weight="medium"
              tabular
              style={{ flexShrink: 1, textAlign: 'right' }}
            >
              {row.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export interface TransformationSectionProps {
  data: ProgressOverview['transformation'];
  photoUri: string | null;
  photoStatus: PhotoStatus;
  onLogPhoto: () => void;
}

export function TransformationSection({
  data,
  photoUri,
  photoStatus,
  onLogPhoto,
}: TransformationSectionProps) {
  const theme = useTheme();
  const delta = bodyDelta(data.baseline, data.current);
  const snapshotRows = (s: BodySnapshot, withDelta: boolean) => [
    {
      label: 'Body Fat',
      value: withDelta
        ? `${s.bodyFatPercent}% (${signedDelta(delta.bodyFatPercent)}%)`
        : `${s.bodyFatPercent}%`,
      tone: withDelta ? ('primary' as const) : undefined,
    },
    {
      label: 'Muscle Mass',
      value: withDelta ? `${s.muscleKg} kg (${signedDelta(delta.muscleKg)})` : `${s.muscleKg} kg`,
      tone: withDelta ? ('primary' as const) : undefined,
    },
  ];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="headlineMd" accessibilityRole="header" style={{ flexShrink: 1 }}>
          Biometric Transformation
        </AppText>
        <AppText variant="labelCaps" color="primary">
          Day {data.dayNumber} vs Day 1
        </AppText>
      </View>
      <Card style={{ padding: 20, gap: 16, backgroundColor: theme.colors.surfaceHigh }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PhotoPanel
            caption="Baseline · Day 1"
            captionColor="onSurfaceVariant"
            labelIcon="history"
            badgeText={`${data.baseline.kg} kg`}
            rows={snapshotRows(data.baseline, false)}
          />
          <PhotoPanel
            caption={`Current · Day ${data.dayNumber}`}
            captionColor="primary"
            highlighted
            labelIcon="verified"
            uri={photoUri}
            badgeText={`${data.current.kg} kg (${signedDelta(delta.weightKg)})`}
            rows={snapshotRows(data.current, true)}
          />
        </View>
        <View
          style={{
            padding: 14,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceLowest,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
                Bodyweight Trajectory
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                <AppText variant="metricLg" tabular numberOfLines={1}>
                  {data.current.kg} kg
                </AppText>
                <AppText variant="bodySm" color="primary">
                  {signedDelta(data.trajectory.weekDeltaKg)} kg this week
                </AppText>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', maxWidth: 96 }}>
              <AppText
                variant="labelCaps"
                color="onSurfaceVariant"
                uppercase
                style={{ textAlign: 'right' }}
              >
                Target (Macrocycle)
              </AppText>
              <AppText variant="headlineMd" color="secondary" tabular>
                {data.trajectory.targetKg.toFixed(1)} kg
              </AppText>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <Sparkline
              values={data.trajectory.points}
              height={96}
              accessibilityLabel="Bodyweight progression"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
              Day 1 ({data.baseline.kg} kg)
            </AppText>
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
              {data.trajectory.midLabel}
            </AppText>
            <AppText variant="labelCaps" color="primary" weight="bold">
              Today ({data.current.kg} kg)
            </AppText>
          </View>
        </View>
        {photoStatus === 'denied' ? (
          <AppText variant="bodySm" color="warning" accessibilityRole="alert">
            Camera access is off. Enable it in your device settings to log a progress photo.
          </AppText>
        ) : null}
        {photoStatus === 'error' ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            Couldn&apos;t open the camera or photo library on this device.
          </AppText>
        ) : null}
        <Button
          variant="secondary"
          label="Log Progress Photo & InBody Scan"
          onPress={onLogPhoto}
          leftIcon={<Icon name="photo_camera" size={20} color="primary" />}
        />
      </Card>
    </View>
  );
}
