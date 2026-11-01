import { ScrollView, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { PersonalRecord, ProgressOverview } from '../types/progress.types';
import { TONE_BG, TONE_COLOR } from './tone';

function RecordCard({ record }: { record: PersonalRecord }) {
  const theme = useTheme();
  return (
    <Card
      accessibilityLabel={`${record.exercise}, ${record.value} ${record.detail}`}
      style={{ width: 256, padding: 16, backgroundColor: theme.colors.surfaceHigh }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor:
              TONE_BG[record.chip.tone] === '#1e2022'
                ? theme.colors.surface
                : TONE_BG[record.chip.tone],
          }}
        >
          {record.chip.icon ? (
            <Icon name={record.chip.icon} size={12} color={TONE_COLOR[record.chip.tone]} />
          ) : null}
          <AppText variant="labelCaps" color={TONE_COLOR[record.chip.tone]}>
            {record.chip.label}
          </AppText>
        </View>
        <Icon name={record.icon} size={18} color={TONE_COLOR[record.iconTone]} />
      </View>
      <AppText variant="bodyMd" weight="semibold" numberOfLines={1}>
        {record.exercise}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <AppText variant="metricLg" tabular>
          {record.value}
        </AppText>
        {record.detail ? (
          <AppText variant="bodyMd" color="onSurfaceVariant">
            {record.detail}
          </AppText>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface,
          gap: 8,
        }}
      >
        <AppText
          variant="labelCaps"
          color={TONE_COLOR[record.footLeft.tone]}
          style={{ flexShrink: 1 }}
        >
          {record.footLeft.text}
        </AppText>
        {record.footRight ? (
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
            {record.footRight}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

export function PersonalRecordsSection({
  records,
}: {
  records: ProgressOverview['personalRecords'];
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="headlineMd" accessibilityRole="header">
            Personal Records
          </AppText>
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary }}
          />
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant">
            All-Time ({records.totalCount})
          </AppText>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 12 }}
      >
        {records.items.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </ScrollView>
    </View>
  );
}
