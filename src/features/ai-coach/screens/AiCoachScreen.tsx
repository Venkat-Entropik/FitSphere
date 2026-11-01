import { useRef, useState, type ComponentRef } from 'react';
import type { ScrollView } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useStartWorkout } from '@/features/workouts/hooks/useStartWorkout';

import { AnalysisCard } from '../components/AnalysisCard';
import { ChatComposer } from '../components/ChatComposer';
import { CoachStatusCard } from '../components/CoachStatusCard';
import { ContextChips } from '../components/ContextChips';
import { AssistantMessage, UserMessage } from '../components/MessageBubbles';
import { StrainChartCard } from '../components/StrainChartCard';
import { SuggestedPrompts } from '../components/SuggestedPrompts';
import { TypingIndicator } from '../components/TypingIndicator';
import {
  useCoachMessages,
  useCoachOverview,
  useCoachSuggestions,
  useSendCoachMessage,
} from '../hooks/useCoach';
import { normalizeMessage } from '../utils/text';

export function AiCoachScreen() {
  const overview = useCoachOverview();
  const suggestions = useCoachSuggestions();
  const messages = useCoachMessages();
  const send = useSendCoachMessage();
  const startWorkout = useStartWorkout();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const submit = (raw: string) => {
    const text = normalizeMessage(raw);
    if (!text || send.isPending) return;
    setDraft('');
    send.mutate(text);
  };

  if (overview.isPending || messages.isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Connecting to your coach" />
      </Screen>
    );
  }
  if (overview.error || !overview.data) {
    return (
      <Screen>
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      </Screen>
    );
  }

  const { data } = overview;
  return (
    <Screen
      scroll
      scrollRef={scrollRef}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      footer={
        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={() => submit(draft)}
          sending={send.isPending}
        />
      }
    >
      <CoachStatusCard statusLabel={data.statusLabel} syncLabel={data.syncLabel} />
      <ContextChips chips={data.contextChips} />
      <AnalysisCard analysis={data.analysis} />
      {(messages.data ?? []).map((message) =>
        message.role === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage
            key={message.id}
            message={message}
            onLoadPlan={() => void startWorkout()}
            onModifyPlan={() => setDraft('Modify today’s plan: ')}
          />
        ),
      )}
      {send.isPending ? <TypingIndicator /> : null}
      <StrainChartCard
        title={data.strain.title}
        caption={data.strain.caption}
        days={data.strain.days}
      />
      <SuggestedPrompts
        prompts={suggestions.data ?? []}
        onSelect={submit}
        disabled={send.isPending}
      />
    </Screen>
  );
}
