import { ScrollView } from 'react-native';

import { Chip } from '@/components/common/Chip';

import type { WorkoutCategory } from '../types/workout.types';

export interface WorkoutCategoryChipsProps {
  categories: readonly WorkoutCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** One row that scrolls sideways only, bleeding to the screen edges. */
export function WorkoutCategoryChips({
  categories,
  selectedId,
  onSelect,
}: WorkoutCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      directionalLockEnabled
      alwaysBounceVertical={false}
      style={{ marginHorizontal: -20, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 8 }}
    >
      {categories.map((category) => (
        <Chip
          key={category.id}
          size="lg"
          uppercase
          label={category.label}
          icon={category.icon}
          selected={category.id === selectedId}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}
