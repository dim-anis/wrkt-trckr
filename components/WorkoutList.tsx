import { FlashList } from '@shopify/flash-list';
import { Link as ExpoLink } from 'expo-router';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { SetWithExerciseData } from '@/types';
import { Pressable } from 'react-native';
import ExerciseCard from './ExerciseCard';
import SetList from './SetList';
import { calculateExerciseStats, groupSetsByExercise } from '@/lib/utils';
import React from 'react';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { toDateId } from '@marceloterreiro/flash-calendar';

type ListItem = [exerciseName: string, sets: SetWithExerciseData[]];

type Props = {
  renderedInBottomSheet?: boolean;
  data?: SetWithExerciseData[];
};

const renderSetsItem = ([exerciseName, sets]: ListItem) => {
  const [firstSet, ...restSets] = sets;

  return (
    <Box marginTop="s">
      <ExpoLink
        href={{
          pathname: `/screens/selected-exercise`,
          params: {
            categoryId: firstSet.category_id,
            exerciseId: firstSet.exercise_id,
            exerciseName: exerciseName,
            timestamp: toDateId(new Date(firstSet.created_at))
          }
        }}
        asChild
      >
        <Pressable>
          <ExerciseCard
            exerciseName={exerciseName}
            exerciseStats={calculateExerciseStats(sets)}
          >
            <SetList sets={sets} />
          </ExerciseCard>
        </Pressable>
      </ExpoLink>
    </Box>
  );
};

export default function WorkoutList({
  data = [],
  renderedInBottomSheet = false
}: Props) {
  const setsGroupedByExercise = groupSetsByExercise(data);
  const listData = [...setsGroupedByExercise.entries()];

  return (
    <>
      {data.length ? (
        renderedInBottomSheet ? (
          <BottomSheetFlatList
            data={listData}
            renderItem={({ item }) => renderSetsItem(item)}
          />
        ) : (
          <FlashList
            data={listData}
            estimatedItemSize={20}
            renderItem={({ item }) => renderSetsItem(item)}
          />
        )
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="primary" variant="header3">
            No sets recorded
          </Text>
        </Box>
      )}
    </>
  );
}
