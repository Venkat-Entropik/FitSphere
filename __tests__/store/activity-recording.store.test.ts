import { elapsedSeconds, useActivityRecordingStore } from '@/store/activity-recording.store';
import type { GpsPoint } from '@/features/activities/types/activity.types';
import { sampleActivity } from '@/features/activities/services/activity.mock';

const point = (t: number): GpsPoint => ({ lat: 1, lng: 1, altitude: 0, accuracy: 5, timestamp: t });
const reset = () =>
  useActivityRecordingStore.setState({
    status: 'idle',
    kind: 'run',
    startedAt: null,
    pausedMs: 0,
    pausedAt: null,
    points: [],
    lapCount: 0,
    lastSummary: null,
  });

describe('activity recording store', () => {
  beforeEach(reset);

  it('excludes paused time from elapsed seconds', () => {
    const s = useActivityRecordingStore.getState();
    s.start(0);
    s.pause(60_000);
    expect(elapsedSeconds(useActivityRecordingStore.getState(), 90_000)).toBe(60);
    useActivityRecordingStore.getState().resume(90_000);
    expect(elapsedSeconds(useActivityRecordingStore.getState(), 120_000)).toBe(90);
  });

  it('only records points and laps while recording', () => {
    const s = useActivityRecordingStore.getState();
    s.addPoint(point(1));
    expect(useActivityRecordingStore.getState().points).toHaveLength(0);

    s.start(0);
    s.addPoint(point(1));
    s.markLap();
    s.pause(10);
    s.addPoint(point(2));
    s.markLap();
    const state = useActivityRecordingStore.getState();
    expect(state.points).toHaveLength(1);
    expect(state.lapCount).toBe(1);
  });

  it('changes kind only when idle', () => {
    const s = useActivityRecordingStore.getState();
    s.start(0);
    s.setKind('cycle');
    expect(useActivityRecordingStore.getState().kind).toBe('run');
  });

  it('finish stores the summary and returns to idle', () => {
    const s = useActivityRecordingStore.getState();
    s.start(0);
    s.finish({ ...sampleActivity, isDemo: false });
    const state = useActivityRecordingStore.getState();
    expect(state.status).toBe('idle');
    expect(state.points).toEqual([]);
    expect(state.lastSummary?.isDemo).toBe(false);
  });
});
