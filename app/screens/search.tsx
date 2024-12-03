import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Theme } from '@/lib/theme';
import { Exercise, TMenuItem, Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import Button from '@/components/ui/Button';
import { Radio } from '@/components/ui/Radio';
import Badge from '@/components/Badge';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { Modal, useModal } from '@/components/ui/Modal';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import MenuItem from '@/components/MenuItem';
import { showToast } from '@/lib/utils';

type SearchParams = { workoutDate?: string };

const exerciseMenuItems: TMenuItem[] = [
  {
    id: 'settings-statistics',
    href: '/screens/stats',
    label: 'Exercise statistics',
    icon: 'stats-chart-outline'
  }
];

export default function Search() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  let { workoutDate } = useLocalSearchParams<SearchParams>();

  const workoutTimestamp = workoutDate ? new Date(workoutDate) : new Date();
  const workoutDateId = toDateId(workoutTimestamp);

  const [searchTerm, setSearchTerm] = useState('');
  const [workout, setWorkout] = useState<Workout | undefined | null>(undefined);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<
    Map<number, Exercise>
  >(new Map());

  useEffect(() => {
    let isActive = true;
    const fetchWorkout = async () => {
      try {
        const existingWorkout = await db.getAllAsync<Workout>(
          'SELECT * from workouts WHERE DATE(start_time) = ? AND end_time IS NULL;',
          workoutDateId
        );

        if (existingWorkout.length) {
          setWorkout(existingWorkout.at(-1));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchWorkout();

    return () => {
      isActive = false;
    };
  }, [workoutDateId]);

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

  async function handleDeleteExercise(exerciseId: number) {
    setFilteredExercises(
      filteredExercises.filter(exercise => exercise.id !== exerciseId)
    );

    const result = await db.runAsync(
      `DELETE FROM exercises WHERE id = ?;`,
      exerciseId
    );

    if (result.changes) {
      showToast({ theme, title: 'Exercise deleted' });
    }
  }

  async function handleStartWorkout() {
    let workoutId = workout?.id;
    if (!workoutId) {
      const createWorkoutResult = await db.runAsync(
        `INSERT INTO workouts (start_time) VALUES (?);`,
        workoutTimestamp.toISOString()
      );

      workoutId = createWorkoutResult.lastInsertRowId;
    }

    let statements: string[] = [];

    for (const [_, exercise] of selectedExercises) {
      const createExerciseSessionResult = await db.runAsync(
        `INSERT INTO exercise_session (workout_id, exercise_id, start_time) VALUES (?, ?, ?)`,
        workoutId,
        exercise.id,
        workoutTimestamp.toISOString()
      );

      const exerciseSessionId = createExerciseSessionResult.lastInsertRowId;

      statements.push(
        `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, created_at) VALUES (${workoutId}, ${exercise.id}, ${exerciseSessionId}, 0, 0, '${dateISOString}');`
      );
    }

    await db.execAsync(statements.join(''));

    router.navigate({
      pathname: '/',
      params: { workoutDateId: workoutTimestamp.toISOString(), workoutId }
    });
  }

  async function handleStartNextWorkout() {
    // TODO: use last set's created_at OR current time as the ended_at
    const updateWorkoutResult = await db.runAsync(
      `UPDATE workouts SET ended_at = ? WHERE id = ?;`,
      new Date().toISOString(),
      workout?.id!
    );

    if (updateWorkoutResult.changes > 0) {
      setWorkout(null);

    }
  }
  useEffect(() => {
    if (workout === null) {
      handleStartWorkout();
      startNextWorkoutModal.dismiss();

      setWorkout(undefined);
    }
  }, [workout]);

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

  const exerciseModal = useModal();
  const dangerousActionModal = useModal();
  const startNextWorkoutModal = useModal();

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
                  iconRight={
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
                  onPress={() => {
                    handleExerciseChange(exercise.id, exercise);
                  }}
                >
                  <Box
                    borderBottomColor="border"
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
                      <Pressable
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        onPress={() => {
                          exerciseModal.present({
                            exerciseId: exercise.id,
                            exerciseName: exercise.name
                          });
                        }}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </Pressable>
                    </Box>
                  </Box>
                </Pressable>
              )}
            />
            {selectedExercises.size > 0 && (
              <Box gap="s">
                <Button
                  label={`Add ${selectedExercises.size} exercise(s)`}
                  onPress={() => handleStartWorkout()}
                />
                {workout?.id && (
                  <Button
                    label={`Start new workout`}
                    variant="secondary"
                    onPress={startNextWorkoutModal.present}
                  />
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
      <Modal
        ref={startNextWorkoutModal.ref}
        enableDynamicSizing
        snapPoints={[]}
        title={'Finish previous workout'}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m">
            <Text variant="body" color="mutedForeground">
              You must finish the previous workout before you start a new one.
            </Text>
            <Box flexDirection="row" gap="m">
              <Box flex={1}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={startNextWorkoutModal.dismiss}
                />
              </Box>
              <Box flex={1}>
                <Button
                  label="Finish workout"
                  variant="destructive"
                  onPress={handleStartNextWorkout}
                />
              </Box>
            </Box>
          </Box>
        </BottomSheetView>
      </Modal>
      <Modal
        ref={exerciseModal.ref}
        enableDynamicSizing
        snapPoints={[]}
        title={'Exercise details'}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({ data }) => (
          <BottomSheetView>
            <Box padding="m" gap="m" flex={1}>
              {exerciseMenuItems.map(({ href, label, icon }, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    exerciseModal.dismiss();

                    if (href) {
                      router.push(href);
                    }
                  }}
                >
                  <MenuItem
                    label={label}
                    iconLeft={
                      <Ionicons
                        name={icon}
                        size={20}
                        color={theme.colors.primary}
                      />
                    }
                  />
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  dangerousActionModal.present({
                    exerciseId: data.exerciseId
                  });
                }}
              >
                <MenuItem
                  label={'Delete exercise'}
                  iconLeft={
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  }
                />
              </Pressable>
            </Box>
          </BottomSheetView>
        )}
      </Modal>
      <Modal
        enableDynamicSizing
        title={`Delete exercise?`}
        ref={dangerousActionModal.ref}
        index={0}
        snapPoints={[]}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        {({ data }) => (
          <BottomSheetView>
            <Box padding="m" flexDirection="row" gap="m">
              <Box flex={1}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => {
                    dangerousActionModal.dismiss();
                  }}
                />
              </Box>
              <Box flex={1}>
                <Button
                  label="Delete"
                  variant="destructive"
                  onPress={() => {
                    exerciseModal.dismiss();
                    dangerousActionModal.dismiss();
                    handleDeleteExercise(data.exerciseId);
                  }}
                />
              </Box>
            </Box>
          </BottomSheetView>
        )}
      </Modal>
    </Box>
  );
}
