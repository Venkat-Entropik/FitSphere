import { View } from 'react-native';

import { DistanceHeroCard } from './DistanceHeroCard';
import { PacerCard } from './PacerCard';
import { RouteMapCard } from './RouteMapCard';
import { SplitsCard } from './SplitsCard';
import { TelemetryGrid } from './TelemetryGrid';
import type { ActivitySnapshot } from '../types/activity.types';
import { kindUsesGps, pacerCue } from '../utils/activity.logic';

/** Presentational layout shared by live recording and the sample preview. */
export function ActivityDashboard({
  snapshot,
  finished = false,
}: {
  snapshot: ActivitySnapshot;
  /** A saved activity: no live pacer cue, and the map says so when no route was recorded. */
  finished?: boolean;
}) {
  const usesGps = kindUsesGps(snapshot.kind);
  const cue = finished ? null : pacerCue(snapshot);
  return (
    <View style={{ gap: 16 }}>
      {usesGps ? (
        <RouteMapCard
          title={snapshot.title}
          route={snapshot.route}
          quality={snapshot.gpsQuality}
          emptyLabel={finished ? 'No GPS route was recorded for this activity.' : undefined}
        />
      ) : null}
      <View style={{ gap: 8 }}>
        {usesGps ? (
          <DistanceHeroCard distanceKm={snapshot.distanceKm} cadenceSpm={snapshot.cadenceSpm} />
        ) : null}
        <TelemetryGrid snapshot={snapshot} finished={finished} />
      </View>
      {cue ? (
        <PacerCard
          headline={cue.headline}
          detail={cue.detail}
          caption={snapshot.isDemo ? 'Sample' : 'Live'}
        />
      ) : null}
      {usesGps ? <SplitsCard splits={snapshot.splits} /> : null}
    </View>
  );
}
