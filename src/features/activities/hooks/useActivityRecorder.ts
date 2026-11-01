import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { useNow } from '@/hooks/useNow';
import { elapsedSeconds, useActivityRecordingStore } from '@/store/activity-recording.store';

import { areLocationServicesEnabled, watchPositions } from '../services/location.service';
import { buildSnapshot, kindUsesGps, KIND_OPTIONS } from '../utils/activity.logic';

/** Body weight and pace target are placeholders until the profile feature supplies them. */
const DEFAULT_WEIGHT_KG = 70;
const DEFAULT_TARGET_PACE_SEC_PER_KM = 300;

export type GpsAvailability =
  'not-needed' | 'checking' | 'ready' | 'needs-permission' | 'denied' | 'services-off' | 'error';

export function useActivityRecorder() {
  const store = useActivityRecordingStore();
  const { status, kind, points, lapCount } = store;
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);
  const usesGps = kindUsesGps(kind);
  const active = status !== 'idle';
  const now = useNow(active);

  // Re-check OS location services whenever the permission changes (e.g. after returning from Settings).
  useEffect(() => {
    let cancelled = false;
    void areLocationServicesEnabled().then((enabled) => {
      if (!cancelled) setServicesEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, [permission?.granted]);

  const recordingGps = status === 'recording' && usesGps && permission?.granted === true;
  useEffect(() => {
    if (!recordingGps) return;
    let removed = false;
    let subscription: { remove: () => void } | null = null;
    watchPositions(useActivityRecordingStore.getState().addPoint, setWatchError)
      .then((sub) => {
        if (removed) sub.remove();
        else subscription = sub;
      })
      .catch(() => undefined);
    return () => {
      removed = true;
      subscription?.remove();
    };
  }, [recordingGps]);

  let availability: GpsAvailability;
  if (!usesGps) availability = 'not-needed';
  else if (watchError) availability = 'error';
  else if (!permission) availability = 'checking';
  else if (!permission.granted)
    availability = permission.canAskAgain ? 'needs-permission' : 'denied';
  else if (servicesEnabled === false) availability = 'services-off';
  else availability = servicesEnabled === null ? 'checking' : 'ready';

  const durationSec = elapsedSeconds(store, now);
  const snapshot = active
    ? buildSnapshot({
        kind,
        title: KIND_OPTIONS.find((o) => o.kind === kind)?.label ?? 'Activity',
        points,
        durationSec,
        weightKg: DEFAULT_WEIGHT_KG,
        targetPaceSecPerKm: usesGps ? DEFAULT_TARGET_PACE_SEC_PER_KM : null,
        lapCount,
      })
    : null;

  const begin = useCallback(() => {
    setWatchError(null);
    store.start();
  }, [store]);

  const finish = useCallback(() => {
    if (snapshot) store.finish(snapshot);
  }, [snapshot, store]);

  return {
    status,
    kind,
    usesGps,
    availability,
    snapshot,
    lastSummary: store.lastSummary,
    setKind: store.setKind,
    requestPermission,
    begin,
    pause: () => store.pause(),
    resume: () => store.resume(),
    markLap: store.markLap,
    finish,
  };
}
