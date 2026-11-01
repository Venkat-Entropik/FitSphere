import { Card } from '@/components/cards/Card';
import { WorkoutCard } from '@/components/cards/WorkoutCard';
import { SectionHeader } from '@/components/common/SectionHeader';

import type { RecentLog } from '../types/dashboard.types';

export interface RecentLogsCardProps {
  logs: readonly RecentLog[];
  onViewHistory: () => void;
}

export function RecentLogsCard({ logs, onViewHistory }: RecentLogsCardProps) {
  return (
    <Card style={{ gap: 12 }}>
      <SectionHeader title="Recent Logs" actionLabel="View History" onActionPress={onViewHistory} />
      {logs.map((log) => (
        <WorkoutCard
          key={log.id}
          title={log.title}
          subtitle={log.subtitle}
          trailingValue={`${log.kcal} kcal`}
          trailingCaption={log.caption}
        />
      ))}
    </Card>
  );
}
