import { View } from 'react-native';

import { isYouTubeId, youtubeEmbedUrl } from '../utils/youtube';
import type { YouTubePlayerProps } from './YouTubePlayer';

/** Web player: a plain iframe (react-native-webview does not run on web). */
export function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  if (!isYouTubeId(videoId)) return null;
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' }}>
      <iframe
        src={youtubeEmbedUrl(videoId)}
        title={title}
        style={{ border: 0, width: '100%', height: '100%', backgroundColor: '#000' }}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </View>
  );
}
