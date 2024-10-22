import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Theme } from '@/lib/theme';
import { Exercise, Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Vibration } from 'react-native';
import Button from '@/components/ui/Button';
import { Radio } from '@/components/ui/Radio';
import Badge from '@/components/Badge';
import { toDateId } from '@marceloterreiro/flash-calendar';

type SearchParams = { workoutDate?: string };

export default function Search() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  let { workoutDate } = useLocalSearchParams<SearchParams>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    Map<number, Exercise>
  >(new Map());

  function handleExerciseChange(exerciseId: number, exercise: Exercise) {
    setSelectedExercises(prevSelected => {
      const newSelected = new Map(prevSelected);
      if (newSelected.has(exerciseId)) {
        newSelected.delete(exerciseId);
      } else {
        newSelected.set(exerciseId, exercise);
      }
      return newSelected;
    });
  }

  async function handleStartWorkout(exercise?: Exercise) {
    const dateISOString = workoutDate ?? new Date().toISOString();

    const existingWorkout = await db.getFirstAsync<Workout>(
      'SELECT * from workouts WHERE created_at = ?;',
      toDateId(new Date(dateISOString))
    );

    let workoutId = existingWorkout?.id;

    const exercisesToCreate = exercise
      ? [exercise]
      : [...selectedExercises.entries()].map(([_, exercise]) => exercise);

    if (!existingWorkout) {
      const createWorkoutResult = await db.runAsync(
        `INSERT INTO workouts (created_at) VALUES (?);`,
        dateISOString
      );

      workoutId = createWorkoutResult.lastInsertRowId;
    }

    if (!workoutId) {
      return;
    }

    let statements: string[] = [];

    for (const exercise of exercisesToCreate) {
      const createExerciseSessionResult = await db.runAsync(
        `INSERT INTO exercise_session (workout_id, exercise_id, start_time) VALUES (?, ?, ?)`,
        workoutId,
        exercise.id,
        dateISOString
      );

      const exerciseSessionId = createExerciseSessionResult.lastInsertRowId;

      statements.push(
        `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, created_at) VALUES (${workoutId}, ${exercise.id}, ${exerciseSessionId}, 0, 0, '${dateISOString}');`
      );
    }

    await db.execAsync(statements.join(''));

    router.navigate({
      pathname: '/',
      params: { workoutDateId: dateISOString, workoutId }
    });
  }

  function searchExercises(searchTerm: string): Promise<Exercise[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const exercises = await db.getAllAsync<Exercise>(
          `SELECT exercises.* 
           FROM exercises 
           JOIN exercise_categories ON exercises.category_id = exercise_categories.id
           ${searchTerm ? `WHERE exercises.name LIKE ? OR exercise_categories.name LIKE ?` : ''}`,
          ...(searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [])
        );

        resolve(exercises);
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    searchExercises(searchTerm)
      .then(results => setFilteredExercises(results))
      .catch(error => console.error('Error fetching exercises:', error));
  }, [searchTerm]);

  return (
    <Box flex={1} padding="m" backgroundColor="background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Search',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Pressable
                onPress={() => handleStartWorkout()}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
              <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons
                  name="ellipsis-vertical-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </Box>
          )
        }}
      />
      <Box flex={1} gap={'l'}>
        <Input
          autoFocus
          onChangeText={text => setSearchTerm(text)}
          placeholder="Search exercises by name or category..."
          value={searchTerm}
          height={40}
          iconLeft={
            <Ionicons
              name="search-outline"
              color={theme.colors.mutedForeground}
              size={20}
            />
          }
          iconRight={
            searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')}>
                <Ionicons
                  name="close-circle-outline"
                  color={theme.colors.mutedForeground}
                  size={20}
                />
              </Pressable>
            ) : undefined
          }
        />
        {selectedExercises.size > 0 && (
          <Box gap="s">
            <Text color="mutedForeground">Selected exercises</Text>
            <Box flexDirection="row" gap="xs" flexWrap="wrap">
              {[...selectedExercises.entries()].map(([_, exercise]) => (
                <Badge
                  key={exercise.id}
                  label={exercise.name}
                  icon={
                    <Pressable
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      onPress={() =>
                        handleExerciseChange(exercise.id, exercise)
                      }
                    >
                      <Ionicons
                        name={'close'}
                        color={theme.colors.primaryForeground}
                      />
                    </Pressable>
                  }
                />
              ))}
            </Box>
          </Box>
        )}
        {filteredExercises.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" gap="m">
            <Text color="primary" variant="header3">
              No exercises found
            </Text>
            <Button label="Create exercise" paddingHorizontal="m" />
          </Box>
        ) : (
          <Box flex={1} gap={'s'}>
            <Text color="mutedForeground">
              {searchTerm ? 'Search results' : 'All exercises'}
            </Text>
            <FlatList
              data={filteredExercises}
              keyExtractor={item => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: exercise }) => (
                <Pressable
                  delayLongPress={250}
                  onPress={() => handleStartWorkout(exercise)}
                  onLongPress={() => {
                    handleExerciseChange(exercise.id, exercise);
                    Vibration.vibrate(10);
                  }}
                >
                  <Box
                    borderBottomColor="secondary"
                    borderBottomWidth={1}
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="m"
                    paddingHorizontal="s"
                    bg={
                      selectedExercises.has(exercise.id)
                        ? 'secondary'
                        : 'background'
                    }
                  >
                    <Box flexDirection="row" alignItems="center" gap="s">
                      {selectedExercises.size > 0 ? (
                        <Radio.Root
                          hitSlop={{
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                          }}
                          checked={selectedExercises.has(exercise.id)}
                          onChange={() =>
                            handleExerciseChange(exercise.id, exercise)
                          }
                          flexDirection="row"
                          justifyContent="space-between"
                          accessibilityLabel="radio button"
                        >
                          <Radio.Icon
                            size={18}
                            checked={selectedExercises.has(exercise.id)}
                            checkedIcon="checkbox-outline"
                            uncheckedIcon="square-outline"
                          />
                        </Radio.Root>
                      ) : null}
                      <Text
                        color="primary"
                        fontSize={20}
                        numberOfLines={1}
                        flex={1}
                      >
                        {exercise.name}
                      </Text>
                    </Box>
                    <Pressable
                      // onPress={() => presentEditExerciseModal(exercise)}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <Box paddingHorizontal="s">
                        <Ionicons
                          name="ellipsis-vertical"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </Box>
                    </Pressable>
                  </Box>
                </Pressable>
              )}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
