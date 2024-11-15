import { FlashList } from '@shopify/flash-list';
import { Link as ExpoLink } from 'expo-router';
import { Box } from './ui/Box';
import { Text } from './ui/Text';
import { Pressable } from 'react-native';
import ExerciseCard from './ExerciseCard';
import SetList from './SetList';
import { calculateExerciseStats } from '@/lib/utils';
import React from 'react';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ExerciseSessionWithSets } from '@/lib/zodSchemas';

type Props = {
  renderedInBottomSheet?: boolean;
  data: ExerciseSessionWithSets[];
};

export const renderSetsItem = ({
  exerciseName,
  sets
}: ExerciseSessionWithSets) => {
  return (
    <Box marginTop="s">
      <ExpoLink
        href={{
          pathname: `/`,
          params: {
            workoutDateId: ''
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
  return (
    <>
      {data.length ? (
        renderedInBottomSheet ? (
          <BottomSheetFlatList
            data={data}
            renderItem={({ item }) => renderSetsItem(item)}
          />
        ) : (
          <FlashList
            data={data}
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
