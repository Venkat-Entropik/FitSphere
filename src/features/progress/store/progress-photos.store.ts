import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandAsyncStorage } from '@/services/storage/app-storage';
import { dateKey } from '@/utils/date';

export interface ProgressPhoto {
  id: string;
  /** A file inside the app's own storage, so it is still there after the camera cache is cleared. */
  uri: string;
  takenAt: number;
  dateKey: string;
  /** Whose photo this is; photos never show up for another account on the same phone. */
  ownerId: string | null;
}

interface PhotoState {
  photos: ProgressPhoto[];
  add: (photo: Omit<ProgressPhoto, 'id' | 'dateKey'>) => ProgressPhoto;
  remove: (id: string) => void;
}

const isNative = Platform.OS !== 'web';

/**
 * Camera and picker results live in a cache the system may empty, which is why photos used to vanish
 * after a while. Native copies them into app storage; the web has no such storage, so a web photo
 * lasts only for the visit.
 */
export async function keepPhotoFile(sourceUri: string, takenAt: number): Promise<string> {
  if (!isNative) return sourceUri;
  const dir = new Directory(Paths.document, 'progress-photos');
  dir.create({ intermediates: true, idempotent: true });
  const target = new File(dir, `photo-${takenAt}.jpg`);
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function deletePhotoFile(uri: string): void {
  if (!isNative) return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}

export const useProgressPhotoStore = create<PhotoState>()(
  persist(
    (set) => ({
      photos: [],
      add: (photo) => {
        const entry: ProgressPhoto = {
          ...photo,
          id: `photo-${photo.takenAt}`,
          dateKey: dateKey(photo.takenAt),
        };
        set((s) => ({ photos: [...s.photos, entry].sort((a, b) => a.takenAt - b.takenAt) }));
        return entry;
      },
      remove: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
    }),
    {
      name: 'fitsphere.progress-photos',
      storage: zustandAsyncStorage,
      version: 1,
      // A web blob address is dead after a reload, so only native photos are saved.
      partialize: (s) => ({ photos: isNative ? s.photos : [] }),
    },
  ),
);
