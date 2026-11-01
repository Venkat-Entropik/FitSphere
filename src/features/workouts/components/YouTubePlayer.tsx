import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { isYouTubeId, youtubeEmbedUrl } from '../utils/youtube';

export interface YouTubePlayerProps {
  videoId: string;
  title: string;
}

/** Native player: the YouTube embed inside a WebView, with a 16:9 frame. */
export function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  if (!isYouTubeId(videoId)) return null;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${youtubeEmbedUrl(videoId)}" title="${title.replace(/[^\w .,:'-]/g, '')}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></body></html>`;
  return (
    <View
      accessible
      accessibilityLabel={title}
      style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' }}
    >
      <WebView
        // The base URL gives the embed a valid origin, which YouTube requires.
        source={{ html, baseUrl: 'https://www.youtube-nocookie.com' }}
        originWhitelist={['https://*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        javaScriptEnabled
        setSupportMultipleWindows={false}
        style={{ backgroundColor: '#000' }}
      />
    </View>
  );
}
