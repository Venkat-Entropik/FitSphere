import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Sparkline } from '@/components/charts/Sparkline';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Icon } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { PhotoStatus } from '../hooks/useProgressPhoto';
import type { ProgressPhoto } from '../store/progress-photos.store';
import type { ProgressOverview } from '../types/progress.types';
import { bodyDelta, signedDelta } from '../utils/progress.logic';
import { shortDate } from '../utils/weight-history.logic';

function PhotoPanel({
  caption,
  highlighted,
  uri,
  weightText,
}: {
  caption: string;
  highlighted?: boolean;
  uri?: string | null;
  weightText: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <AppText
        variant="labelCaps"
        color={highlighted ? 'primary' : 'onSurfaceVariant'}
        uppercase
        numberOfLines={1}
      >
        {caption}
      </AppText>
      <View
        style={{
          height: 150,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceLow,
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
          <Icon name="person" size={44} color="outline" />
        )}
        <View
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: theme.radius.pill,
            backgroundColor: highlighted ? theme.colors.primary : 'rgba(12, 14, 16, 0.8)',
          }}
        >
          <AppText
            variant="labelUi"
            color={highlighted ? 'onPrimary' : 'onSurface'}
            weight="bold"
            numberOfLines={1}
          >
            {weightText}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function CompositionRow({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string | null;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <AppText variant="bodyMd" color="onSurfaceVariant">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <AppText variant="labelUi" weight="semibold" tabular>
          {value}
        </AppText>
        {change ? (
          <AppText variant="bodySm" color="primary" tabular>
            {change}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function Figure({
  label,
  value,
  color = 'onSurface',
  align = 'flex-start',
}: {
  label: string;
  value: string;
  color?: ColorToken;
  align?: 'flex-start' | 'flex-end';
}) {
  return (
    <View style={{ flex: 1, alignItems: align, gap: 2 }}>
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="metricLg" color={color} tabular numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export interface TransformationSectionProps {
  data: ProgressOverview['transformation'];
  /** Oldest first. */
  photos: readonly ProgressPhoto[];
  photoStatus: PhotoStatus;
  onLogPhoto: () => void;
  onRemovePhoto: (photo: ProgressPhoto) => void;
  onLogWeighIn: () => void;
}

export function TransformationSection({
  data,
  photos,
  photoStatus,
  onLogPhoto,
  onRemovePhoto,
  onLogWeighIn,
}: TransformationSectionProps) {
  const theme = useTheme();
  const [toRemove, setToRemove] = useState<ProgressPhoto | null>(null);
  const first = photos[0];
  const latest = photos.length > 1 ? photos.at(-1) : undefined;
  const delta = bodyDelta(data.baseline, data.current);
  // A zero means "never entered", not a real reading, so it is left out rather than shown as 0.
  const hasBodyFat = data.current.bodyFatPercent > 0;
  const hasMuscle = data.current.muscleKg > 0;
  const weekChange = data.trajectory.weekDeltaKg;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <AppText variant="headlineMd" accessibilityRole="header" style={{ flexShrink: 1 }}>
          Body progress
        </AppText>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <AppText variant="labelCaps" color="primary" numberOfLines={1}>
            Day {data.dayNumber}
          </AppText>
        </View>
      </View>

      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Figure label="Now" value={`${data.current.kg} kg`} />
          <Figure
            label="Target"
            value={`${data.trajectory.targetKg.toFixed(1)} kg`}
            color="secondary"
            align="flex-end"
          />
        </View>
        <View style={{ gap: 4 }}>
          {data.trajectory.points.length >= 2 ? (
            <Sparkline
              values={data.trajectory.points}
              height={96}
              accessibilityLabel="Bodyweight progression"
            />
          ) : (
            <AppText variant="bodySm" color="onSurfaceVariant">
              Log a weigh-in on another day and your trend appears here.
            </AppText>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
              Start {data.baseline.kg} kg
            </AppText>
            <AppText variant="bodySm" color={weekChange === 0 ? 'onSurfaceVariant' : 'primary'}>
              {weekChange === 0 ? 'No change this week' : `${signedDelta(weekChange)} kg this week`}
            </AppText>
          </View>
        </View>
      </Card>

      {hasBodyFat || hasMuscle ? (
        <Card style={{ gap: 10 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Body composition
          </AppText>
          {hasBodyFat ? (
            <CompositionRow
              label="Body fat"
              value={`${data.current.bodyFatPercent}%`}
              change={delta.bodyFatPercent !== 0 ? `${signedDelta(delta.bodyFatPercent)}%` : null}
            />
          ) : null}
          {hasMuscle ? (
            <CompositionRow
              label="Muscle mass"
              value={`${data.current.muscleKg} kg`}
              change={delta.muscleKg !== 0 ? `${signedDelta(delta.muscleKg)} kg` : null}
            />
          ) : null}
        </Card>
      ) : null}

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PhotoPanel
            caption={first ? 'First photo' : 'Day 1'}
            uri={first?.uri}
            weightText={first ? shortDate(first.dateKey) : `${data.baseline.kg} kg`}
          />
          <PhotoPanel
            caption={latest ? 'Latest' : `Day ${data.dayNumber}`}
            highlighted
            uri={latest?.uri}
            weightText={latest ? shortDate(latest.dateKey) : `${data.current.kg} kg`}
          />
        </View>
        {photos.length === 1 ? (
          <AppText variant="bodySm" color="onSurfaceVariant">
            Take another photo later to see the two side by side.
          </AppText>
        ) : null}
        {photos.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Your photos ({photos.length}) · saved on this phone
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {[...photos].reverse().map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo from ${shortDate(p.dateKey)}. Hold to remove`}
                  onLongPress={() => setToRemove(p)}
                  style={{ width: 84, gap: 4 }}
                >
                  <Image
                    source={{ uri: p.uri }}
                    style={{ width: 84, height: 108, borderRadius: theme.radius.sm }}
                    resizeMode="cover"
                  />
                  <AppText variant="labelCaps" color="onSurfaceVariant" numberOfLines={1}>
                    {shortDate(p.dateKey)}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
            <AppText variant="bodySm" color="onSurfaceVariant">
              Touch and hold a photo to remove it.
            </AppText>
          </View>
        ) : null}
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
          label="Log Weigh-in"
          onPress={onLogWeighIn}
          leftIcon={<Icon name="monitor_weight" size={20} color="onPrimary" />}
        />
        <Button
          variant="secondary"
          label="Add Photo"
          accessibilityLabel="Take Progress Photo"
          onPress={onLogPhoto}
          leftIcon={<Icon name="photo_camera" size={20} color="primary" />}
        />
      </Card>
      <ConfirmationModal
        visible={toRemove !== null}
        title="Remove this photo?"
        message="It will be deleted from this phone. This cannot be undone."
        confirmLabel="Remove Photo"
        cancelLabel="Keep It"
        destructive
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) onRemovePhoto(toRemove);
          setToRemove(null);
        }}
      />
    </View>
  );
}
