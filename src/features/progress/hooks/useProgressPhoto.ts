import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

export type PhotoStatus = 'idle' | 'denied' | 'error';

/**
 * Picks a progress photo: camera first (with permission handling), library as a fallback where a
 * camera isn't available. The photo stays on-device in memory until an upload endpoint exists.
 */
export function useProgressPhoto() {
  const [uri, setUri] = useState<string | null>(null);
  const [status, setStatus] = useState<PhotoStatus>('idle');

  const capture = useCallback(async () => {
    setStatus('idle');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
    } catch {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
      } catch {
        setStatus('error');
      }
    }
  }, []);

  return { uri, status, capture };
}
