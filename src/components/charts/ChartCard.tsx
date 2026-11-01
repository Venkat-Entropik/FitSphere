import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useTheme, type ColorToken } from '@/theme';

export interface ChartCardProps {
  title: string;
  icon?: IconName;
  /** Right-aligned caption/badge text. */
  trailingText?: string;
  trailingColor?: ColorToken;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** When true, shows the empty state instead of the chart. */
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

/** Frames any chart with the Stitch card header and handles loading / error / empty states. */
export function ChartCard({
  title,
  icon,
  trailingText,
  trailingColor = 'onSurfaceVariant',
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = 'No data yet.',
  children,
}: ChartCardProps) {
  const theme = useTheme();
  let body = children;
  if (loading) body = <LoadingIndicator />;
  else if (error) body = <ErrorState error={error} onRetry={onRetry} />;
  else if (isEmpty) body = <EmptyState title={emptyMessage} />;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          {icon ? <Icon name={icon} size={18} color="onSurfaceVariant" /> : null}
          <AppText variant="labelUi" weight="semibold">
            {title}
          </AppText>
        </View>
        {trailingText ? (
          <AppText variant="labelCaps" color={trailingColor} weight="bold" uppercase>
            {trailingText}
          </AppText>
        ) : null}
      </View>
      {body}
    </Card>
  );
}
