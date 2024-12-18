import { Exercise, ExerciseSession, Set } from '@/lib/zodSchemas';
import Separator from './Separator';
import { Box } from './ui/Box';
import { Text } from './ui/Text';

type Props<T extends Exercise> = { exercises: T[] };

export default function ExerciseList<
  T extends Exercise & ExerciseSession & { sets: Set[] }
>({ exercises }: Props<T>) {
  return (
    <>
      {exercises.map((exercise, idx) => (
        <Box key={idx}>
          <Box flexDirection="row" gap="s">
            <Box flex={1}>
              <Text variant="body" color="primary" numberOfLines={1}>
                {exercise.exerciseName}
              </Text>
            </Box>
            <Box flex={1}>
              <Text variant="body" color="primary" numberOfLines={1}>
                {exercise.sets
                  .map(
                    set =>
                      `${set.weight}${exercise.exerciseSessionWeightUnit} x ${set.reps}`
                  )
                  .join(', ')}
              </Text>
            </Box>
          </Box>
          {idx + 1 < exercises.length && <Separator marginHorizontal="none" />}
        </Box>
      ))}
    </>
  );
}
