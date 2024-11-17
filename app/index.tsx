import MenuItem from '@/components/MenuItem';
import { Link as ExpoLink } from 'expo-router';
import { Box } from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { groupSetsByExerciseSessionId, showToast } from '@/lib/utils';
import { type TMenuItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { addDays, format, isToday, subDays } from 'date-fns';
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams
} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Keyboard, Pressable, ScrollView } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  WorkoutSession,
  Set,
  ExerciseSessionWithExercise,
  WorkoutSessionWithExercises,
  workoutSessionWithExercisesSchema
} from '@/lib/zodSchemas';
import ExerciseSession from './ExerciseSession';

const menuItems: TMenuItem[] = [
  {
    id: 'settings-statistics',
    href: '/screens/stats',
    label: 'Statistics',
    icon: 'stats-chart-outline'
  },
  {
    id: 'settings-tracker',
    href: '/screens/settings',
    label: 'Body tracker',
    icon: 'body-outline'
  },
  {
    id: 'settings-share',
    href: '/screens/settings',
    label: 'Share workout',
    icon: 'share-social-outline'
  },
  {
    id: 'settings',
    href: '/screens/settings',
    label: 'Copy workout',
    icon: 'copy-outline'
  },
  {
    id: 'settings',
    href: '/screens/settings',
    label: 'Settings',
    icon: 'settings-outline'
  }
];

type SearchParams = {
  workoutDateId: string;
  workoutId: string;
};

export default function MainScreen() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { workoutDateId } = useLocalSearchParams<SearchParams>();

  const todayDateId = new Date().toISOString();

  const [isWorkoutSynched, setIsWorkoutSynched] = useState(true);
  const [currentDate, setCurrentDate] = useState(workoutDateId || todayDateId);

  const {
    present: presentMore,
    dismiss: dismissMore,
    ref: refMore
  } = useModal();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    formState: { isDirty }
  } = useForm<WorkoutSessionWithExercises>({
    resolver: zodResolver(workoutSessionWithExercisesSchema),
    defaultValues: {
      exercises: []
    }
  });

  const { fields: exerciseFields, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises'
  });

  useEffect(() => {
    if (isDirty) {
      setIsWorkoutSynched(false);
    }
  }, [isDirty]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function fetchSets() {
        const result = await db.getAllAsync<
          WorkoutSession & ExerciseSessionWithExercise & Set
        >(
          `
            SELECT
                w.id as workoutId,
                w.created_at as workoutStart,
                es.id as exerciseSessionId,
                es.notes as exerciseSessionNotes,
                es.weight_unit as exerciseSessionWeightUnit,
                s.id,
                s.weight,
                s.reps,
                s.rpe,
                s.created_at as createdAt,
                s.exercise_id as exerciseId,
                s.workout_id as workoutId,
                e.name as exerciseName
            FROM
                workouts w
            JOIN
                exercises e
                ON s.exercise_id = e.id
            JOIN
                sets s
                ON w.id = s.workout_id
            JOIN
                exercise_session es
                ON s.exercise_session_id = es.id
            WHERE
                DATE(w.created_at) = ?
            ORDER BY
                w.id,
                es.id,
                s.id;
      `,
          toDateId(new Date(currentDate))
        );

        const groupedExercises = groupSetsByExerciseSessionId(result);

        reset(
          result.length > 0
            ? {
                workoutId: result[0].workoutId,
                workoutStart: result[0].workoutStart,
                exercises: groupedExercises
              }
            : {
                exercises: []
              }
        );
      }

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [currentDate])
  );

  async function handleDeleteExercise(exerciseIndex: number) {
    removeExercise(exerciseIndex);

    const { exerciseSessionId } = exerciseFields[exerciseIndex];

    const updatedExercises = exerciseFields.filter(
      (_, i) => i !== exerciseIndex
    );

    reset({
      ...getValues(),
      exercises: updatedExercises
    });

    const result = await db.runAsync(
      `DELETE FROM exercise_session WHERE id = ?;`,
      exerciseSessionId
    );

    if (result.changes) {
      showToast({ theme, title: 'Exercise deleted' });
    }
  }

  async function handleDeleteWorkout() {
    reset({ exercises: [] });

    const workoutId = getValues('workoutId');

    if (workoutId) {
      const result = await db.runAsync(
        `DELETE FROM workouts WHERE id = ?;`,
        workoutId
      );

      if (result.changes) {
        showToast({ theme, title: 'Workout deleted' });
      }
    }
  }

  async function onSubmit(formData: WorkoutSessionWithExercises) {
    const { success, data, error } =
      await workoutSessionWithExercisesSchema.safeParseAsync(formData);

    if (error) {
      console.error(error);
    }

    if (success) {
      const { workoutId, exercises } = data;

      await db.withTransactionAsync(async () => {
        for (const exercise of exercises) {
          const {
            sets,
            exerciseSessionId,
            exerciseSessionNotes,
            exerciseSessionWeightUnit
          } = exercise;

          // Update exercise session
          await db.runAsync(
            `UPDATE exercise_session SET notes = ?, weight_unit = ? WHERE id = ?;`,
            [exerciseSessionNotes, exerciseSessionWeightUnit, exerciseSessionId]
          );

          for (const set of sets) {
            const {
              weight,
              reps,
              addedResistance,
              rpe,
              createdAt,
              exerciseId,
              id: setId
            } = set;

            if (setId) {
              // Update existing set
              await db.runAsync(
                `UPDATE sets SET weight = ?, reps = ?, added_resistance = ?, rpe = ? WHERE id = ?;`,
                [weight, reps, addedResistance, rpe, setId]
              );
            } else {
              // Insert new set
              if (!exerciseId) {
                throw new Error(`No exerciseId found`);
              }

              await db.runAsync(
                `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, added_resistance, rpe, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  workoutId,
                  exerciseId,
                  exerciseSessionId,
                  weight,
                  reps,
                  addedResistance,
                  rpe,
                  createdAt
                ]
              );
            }
          }
        }
      });

      Keyboard.dismiss();
      showToast({ theme, title: 'Workout saved' });

      reset({ exercises }, { keepDirty: false });
      setIsWorkoutSynched(true);
    } else {
      showToast({ theme, title: 'Failed to save workout' });
    }
  }

  return (
    <Box bg="background" flex={1} justifyContent="center" padding="m" gap="l">
      <Stack.Screen
        options={{
          title: '',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary,
          headerLeft: () => (
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap="s"
            >
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => {
                  setCurrentDate(subDays(currentDate, 1).toISOString());
                  setIsWorkoutSynched(true);
                }}
              >
                <Ionicons
                  name="chevron-back"
                  color={theme.colors.primary}
                  size={24}
                />
              </Pressable>
              <Text variant="header2" color="primary">
                {isToday(currentDate)
                  ? 'Today'
                  : format(currentDate, 'MMM, dd')}
              </Text>
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => {
                  setCurrentDate(addDays(currentDate, 1).toISOString());
                  setIsWorkoutSynched(true);
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  color={theme.colors.primary}
                  size={24}
                />
              </Pressable>
            </Box>
          ),
          headerRight: () => (
            <Box flexDirection="row" gap="m">
              {exerciseFields.length > 0 && (
                <Pressable
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Ionicons
                    name={
                      isWorkoutSynched
                        ? 'checkmark-circle'
                        : 'checkmark-circle-outline'
                    }
                    color={theme.colors.green}
                    size={20}
                  />
                </Pressable>
              )}
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => setCurrentDate(todayDateId)}
              >
                <Ionicons
                  name="calendar-number-outline"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
              <ExpoLink href="/calendarView" asChild>
                <Pressable
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons
                    name="calendar"
                    color={theme.colors.primary}
                    size={20}
                  />
                </Pressable>
              </ExpoLink>
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={presentMore}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
            </Box>
          )
        }}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1
        }}
        style={{ backgroundColor: theme.colors.background }}
      >
        {exerciseFields.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text color="primary" variant="header3">
              No exercises recorded
            </Text>
          </Box>
        ) : (
          exerciseFields.map(
            ({ id: exerciseId, exerciseName }, exerciseIndex) => (
              <Box key={exerciseId} gap="m">
                <ExerciseSession
                  {...{
                    control,
                    watch,
                    reset,
                    getValues,
                    exerciseIndex,
                    exerciseName
                  }}
                  onRemoveExercise={() => handleDeleteExercise(exerciseIndex)}
                  onAddSet={() => setIsWorkoutSynched(false)}
                />
              </Box>
            )
          )
        )}
      </ScrollView>

      {exerciseFields.length > 0 ? (
        <Box
          position="absolute"
          aspectRatio={'1/1'}
          width={48}
          right={25}
          bottom={25}
        >
          <Link
            href={{
              pathname: '/screens/search',
              params: {
                workoutDate: isToday(currentDate) ? null : currentDate
              }
            }}
            flexGrow={1}
            asChild
          >
            <Pressable>
              <Ionicons
                name="add-outline"
                size={24}
                color={theme.colors.primaryForeground}
              />
            </Pressable>
          </Link>
        </Box>
      ) : (
        <Box flexDirection="row" gap="m">
          <Link
            href={{
              pathname: '/screens/search',
              params: {
                workoutDate: isToday(currentDate) ? null : currentDate
              }
            }}
            flexGrow={1}
            asChild
          >
            <Pressable>
              <Text variant="buttonLabel" color="primaryForeground">
                Start workout
              </Text>
            </Pressable>
          </Link>
          <Link
            href={{
              pathname: '/screens/template',
              params: { workoutDateId: currentDate }
            }}
            flexGrow={1}
            variant="secondary"
            asChild
          >
            <Pressable>
              <Text variant="buttonLabel" color="secondaryForeground">
                Use template
              </Text>
            </Pressable>
          </Link>
        </Box>
      )}
      <Modal
        ref={refMore}
        title="More"
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m" flex={1}>
            {menuItems.map(({ href, label, icon }, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  dismissMore();

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
                dismissMore();
                handleDeleteWorkout();
              }}
            >
              <MenuItem
                label={'Delete workout'}
                textColor="destructive"
                iconLeft={
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.destructive}
                  />
                }
              />
            </Pressable>
          </Box>
        </BottomSheetView>
      </Modal>
    </Box>
  );
}
