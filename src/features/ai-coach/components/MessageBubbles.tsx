import { View } from 'react-native';

import { RichText } from '@/components/common/RichText';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { CoachMessage } from '../types/coach.types';
import { formatClockTime } from '../utils/text';
import { WorkoutPlanCard } from './WorkoutPlanCard';

export function UserMessage({ message }: { message: CoachMessage }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'flex-end', paddingLeft: 32 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
          marginRight: 4,
        }}
      >
        <AppText variant="labelCaps" color="onSurfaceVariant">
          You
        </AppText>
        <AppText
          variant="labelCaps"
          color="onSurfaceVariant"
          weight="regular"
          style={{ fontSize: 10 }}
        >
          {formatClockTime(message.createdAt)}
        </AppText>
      </View>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.colors.surfaceHigh,
          borderRadius: 16,
          borderTopRightRadius: 4,
          ...theme.shadows.sm,
        }}
      >
        <AppText variant="bodyMd">{message.text}</AppText>
      </View>
    </View>
  );
}

export interface AssistantMessageProps {
  message: CoachMessage;
  onLoadPlan: () => void;
  onModifyPlan: () => void;
}

export function AssistantMessage({ message, onLoadPlan, onModifyPlan }: AssistantMessageProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'flex-start', paddingRight: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          marginLeft: 4,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(197, 242, 106, 0.2)',
          }}
        >
          <Icon name="auto_awesome" size={13} color="primary" />
        </View>
        <AppText variant="labelCaps" color="primary" weight="semibold">
          FitSphere Engine
        </AppText>
        <AppText
          variant="labelCaps"
          color="onSurfaceVariant"
          weight="regular"
          style={{ fontSize: 10 }}
        >
          {formatClockTime(message.createdAt)}
        </AppText>
      </View>
      <View
        style={{
          alignSelf: 'stretch',
          gap: 12,
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          borderTopLeftRadius: 4,
          ...theme.shadows.md,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 4,
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
            backgroundColor: theme.colors.primary,
          }}
        />
        <RichText
          text={message.text}
          variant="bodyMd"
          emphasisColor="primary"
          style={{ lineHeight: 23, paddingLeft: 8 }}
        />
        {message.plan ? (
          <WorkoutPlanCard plan={message.plan} onLoad={onLoadPlan} onModify={onModifyPlan} />
        ) : null}
        {message.showDisclaimer ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 8,
              padding: 8,
              marginLeft: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: 'rgba(12, 14, 16, 0.8)',
            }}
          >
            <Icon name="warning" size={15} color="warning" />
            <AppText
              variant="bodySm"
              color="onSurfaceVariant"
              style={{ flex: 1, fontSize: 11, lineHeight: 16 }}
            >
              General fitness guidance based on your logged data — not medical advice. Prioritize
              strict joint alignment and adjust loads if fatigue exceeds baseline.
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}
