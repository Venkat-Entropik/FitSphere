import { EmptyState } from '@/components/ui/EmptyState';

import { Screen } from './Screen';

/** Temporary body for screens that have no Stitch design yet. */
export function ScreenPlaceholder({ title, message }: { title: string; message?: string }) {
  return (
    <Screen>
      <EmptyState
        icon="construction"
        title={title}
        message={message ?? 'No design has been provided for this screen yet.'}
      />
    </Screen>
  );
}
