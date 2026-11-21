import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { ActivityDashboard } from '../components/ActivityDashboard';
import { useActivityHistory } from '../hooks/useActivityHistory';
import { recordToSnapshot } from '../utils/activity-history.logic';
import { KIND_OPTIONS } from '../utils/activity.logic';

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** A finished activity reopened from the list: the recorded route, distance, pace, splits and more. */
export function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const history = useActivityHistory();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/activity'));

  if (history.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading activity" />
      </Screen>
    );
  }
  if (history.error) {
    return (
      <Screen>
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      </Screen>
    );
  }
  const record = history.data?.find((r) => r.id === id);
  if (!record) {
    return (
      <Screen>
        <EmptyState title="Activity not found" />
        <SecondaryButton label="Back" onPress={back} />
      </Screen>
    );
  }

  const kind = KIND_OPTIONS.find((o) => o.kind === record.kind);
  return (
    <Screen scroll>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to activities"
        onPress={back}
        hitSlop={10}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, minHeight: 36 }}
      >
        <Icon name="arrow_back" size={20} />
        <AppText variant="labelUi" weight="semibold">
          Activities
        </AppText>
      </Pressable>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={kind?.icon ?? 'directions_run'} size={20} color="primary" />
          <AppText variant="labelCaps" color="primary" uppercase>
            {kind?.label ?? 'Activity'}
          </AppText>
        </View>
        <AppText variant="headlineLgMobile" accessibilityRole="header">
          {record.title}
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          {when(record.startedAt)}
        </AppText>
      </View>
      <ActivityDashboard snapshot={recordToSnapshot(record)} finished />
    </Screen>
  );
}
