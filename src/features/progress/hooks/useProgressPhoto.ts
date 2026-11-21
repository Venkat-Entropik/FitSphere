import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/store/auth.store';

import {
  deletePhotoFile,
  keepPhotoFile,
  useProgressPhotoStore,
  type ProgressPhoto,
} from '../store/progress-photos.store';

export type PhotoStatus = 'idle' | 'denied' | 'error';

/**
 * Takes a progress photo (camera first, library as a fallback) and keeps it in app storage, so the
 * timeline survives restarts and the system clearing its caches. Photos stay on this phone.
 */
export function useProgressPhotos() {
  const ownerId = useAuthStore((s) => s.user?.id ?? null);
  const all = useProgressPhotoStore((s) => s.photos);
  const add = useProgressPhotoStore((s) => s.add);
  const removeFromStore = useProgressPhotoStore((s) => s.remove);
  const [status, setStatus] = useState<PhotoStatus>('idle');

  const photos = useMemo(() => all.filter((p) => p.ownerId === ownerId), [all, ownerId]);

  const save = useCallback(
    async (sourceUri: string) => {
      const takenAt = Date.now();
      try {
        const uri = await keepPhotoFile(sourceUri, takenAt);
        add({ uri, takenAt, ownerId });
      } catch {
        setStatus('error');
      }
    },
    [add, ownerId],
  );

  const capture = useCallback(async () => {
    setStatus('idle');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets[0]) await save(result.assets[0].uri);
    } catch {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) await save(result.assets[0].uri);
      } catch {
        setStatus('error');
      }
    }
  }, [save]);

  const remove = useCallback(
    (photo: ProgressPhoto) => {
      deletePhotoFile(photo.uri);
      removeFromStore(photo.id);
    },
    [removeFromStore],
  );

  return { photos, status, capture, remove };
}
