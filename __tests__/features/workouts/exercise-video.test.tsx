import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ExerciseVideoSheet } from '@/features/workouts/components/ExerciseVideoSheet';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { buildTodaySuggestion } from '@/features/workouts/utils/today-suggestion';
import {
  isYouTubeId,
  youtubeEmbedUrl,
  youtubeSearchUrl,
  youtubeWatchUrl,
} from '@/features/workouts/utils/youtube';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';

const NOW = new Date('2026-11-01T12:00:00Z').getTime();
const DAY = 86_400_000;

const record = (planId: string, title: string, daysAgo: number): WorkoutRecord => ({
  id: `r-${planId}-${daysAgo}`,
  planId,
  title,
  startedAt: NOW - daysAgo * DAY - 3_600_000,
  endedAt: NOW - daysAgo * DAY,
  durationSec: 3600,
  volumeKg: 1000,
  setsCompleted: 3,
  prCount: 0,
  kcal: 300,
  exercises: [],
  source: 'user',
});

describe('exercise videos', () => {
  it('gives every catalog exercise a well-formed YouTube id and form cues', () => {
    for (const exercise of EXERCISE_CATALOG) {
      expect(exercise.video).toBeDefined();
      expect(isYouTubeId(exercise.video!.youtubeId)).toBe(true);
      expect(exercise.video!.title.length).toBeGreaterThan(5);
      expect(exercise.cues?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('builds YouTube URLs and rejects malformed ids', () => {
    expect(youtubeEmbedUrl('awEEyL5zGvU')).toContain('youtube-nocookie.com/embed/awEEyL5zGvU');
    expect(youtubeWatchUrl('awEEyL5zGvU')).toBe('https://www.youtube.com/watch?v=awEEyL5zGvU');
    expect(youtubeSearchUrl('Back Squat')).toBe(
      'https://www.youtube.com/results?search_query=Back%20Squat%20proper%20form',
    );
    for (const bad of ['', 'short', 'has space!!', '"><script>x', 'waytoolongvideoid1']) {
      expect(isYouTubeId(bad)).toBe(false);
    }
  });
});

describe('ExerciseVideoSheet', () => {
  const squat = EXERCISE_CATALOG.find((e) => e.id === 'squat')!;

  it('shows the exercise, its cues and a link out to YouTube', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    await render(<ExerciseVideoSheet exercise={squat} onClose={jest.fn()} />);
    expect(screen.getByText('Back Squat')).toBeTruthy();
    expect(screen.getByText(squat.cues![0]!)).toBeTruthy();
    await fireEvent.press(screen.getByText('Watch on YouTube'));
    expect(open).toHaveBeenCalledWith(youtubeWatchUrl(squat.video!.youtubeId));
    open.mockRestore();
  });

  it('falls back to a YouTube search when an exercise has no video', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    await render(
      <ExerciseVideoSheet
        exercise={{ ...squat, video: undefined, cues: undefined }}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText(/no curated video/i)).toBeTruthy();
    await fireEvent.press(screen.getByText('Search YouTube'));
    expect(open).toHaveBeenCalledWith(youtubeSearchUrl('Back Squat'));
    open.mockRestore();
  });

  it('renders nothing visible when there is no exercise', async () => {
    await render(<ExerciseVideoSheet exercise={null} onClose={jest.fn()} />);
    expect(screen.queryByText('Watch on YouTube')).toBeNull();
  });
});

describe('buildTodaySuggestion', () => {
  const [push, pull] = WORKOUT_PLANS;
  const input = { plans: WORKOUT_PLANS, catalog: EXERCISE_CATALOG, now: NOW, autoOverload: true };

  it('starts a new athlete on the first plan with starting loads', () => {
    const s = buildTodaySuggestion({ ...input, plan: push!, records: [] });
    expect(s.plan.id).toBe(push!.id);
    expect(s.reason).toMatch(/good place to start/i);
    expect(s.items).toHaveLength(push!.exercises.length);
    const first = s.items[0]!;
    expect(first.kg).toBe(first.exercise.startKg);
    expect(first.note).toBe('Starting load');
    expect(first.exercise.video).toBeDefined();
  });

  it('explains the rotation and notes a long break', () => {
    const yesterday = buildTodaySuggestion({
      ...input,
      plan: pull!,
      records: [record(push!.id, 'Push Day – Chest', 1)],
    });
    expect(yesterday.reason).toMatch(/after Push Day yesterday/);
    const longAgo = buildTodaySuggestion({
      ...input,
      plan: pull!,
      records: [record(push!.id, 'Push Day – Chest', 5)],
    });
    expect(longAgo.reason).toMatch(/5 days since Push Day/);
  });

  it('treats a different pick as the athlete’s choice', () => {
    const s = buildTodaySuggestion({
      ...input,
      plan: WORKOUT_PLANS[2]!,
      records: [record(push!.id, 'Push Day – Chest', 1)],
    });
    expect(s.reason).toMatch(/your pick/i);
  });

  it('flags a second session on the same day', () => {
    const s = buildTodaySuggestion({
      ...input,
      plan: pull!,
      records: [record(push!.id, 'Push Day – Chest', 0)],
    });
    expect(s.reason).toMatch(/already trained today/i);
  });
});
