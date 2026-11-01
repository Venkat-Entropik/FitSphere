import { ScrollView } from 'react-native';

import { Chip } from '@/components/common/Chip';

import type { WorkoutCategory } from '../types/workout.types';

export interface WorkoutCategoryChipsProps {
  categories: readonly WorkoutCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Horizontally scrolling filter pills; bleeds to the screen edges like the Stitch layout. */
export function WorkoutCategoryChips({
  categories,
  selectedId,
  onSelect,
}: WorkoutCategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 8 }}
    >
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Chip
            key={category.id}
            size="lg"
            uppercase
            label={category.label}
            icon={category.icon}
            selected={selected}
            trailingDot={selected}
            onPress={() => onSelect(category.id)}
          />
        );
      })}
    </ScrollView>
  );
}
