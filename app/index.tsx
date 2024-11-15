import MenuItem from '@/components/MenuItem';
import { Link as ExpoLink } from 'expo-router';
import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import Link from '@/components/ui/Link';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { groupSetsByExerciseSessionId, showToast } from '@/lib/utils';
import { type TMenuItem } from '@/types';
import { getIconForFormFieldName } from '@/lib/utils';
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
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
  useFieldArray,
  useForm,
  useFormState
} from 'react-hook-form';
import { Keyboard, Pressable, ScrollView } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { ControlledSelect } from '@/components/ui/Select';
import FormError from '@/components/ui/FormError';
import {
  WorkoutSession,
  Set,
  ExerciseSessionWithExercise,
  WorkoutSessionWithExercises,
  workoutSessionWithExercisesSchema
} from '@/lib/zodSchemas';

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

      {exerciseFields.length === 0 && (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="primary" variant="header3">
            No exercises recorded
          </Text>
        </Box>
      )}

      <ScrollView keyboardShouldPersistTaps="handled">
        {exerciseFields.map((exercise, exerciseIndex) => (
          <Box key={exercise.id} gap="m">
            <ExerciseSets
              control={control}
              watch={watch}
              onRemoveExercise={() => handleDeleteExercise(exerciseIndex)}
              onAddSet={() => setIsWorkoutSynched(false)}
              reset={reset}
              getValues={getValues}
              exerciseIndex={exerciseIndex}
              exerciseName={exercise.exerciseName}
            />
          </Box>
        ))}
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

const ExerciseSets = ({
  control,
  watch,
  exerciseIndex,
  exerciseName,
  reset,
  getValues,
  onRemoveExercise,
  onAddSet
}: {
  control: Control<WorkoutSessionWithExercises>;
  watch: UseFormWatch<WorkoutSessionWithExercises>;
  exerciseIndex: number;
  exerciseName: string;
  onRemoveExercise: (exerciseIndex: number) => void;
  onAddSet: () => void;
  reset: UseFormReset<WorkoutSessionWithExercises>;
  getValues: UseFormGetValues<WorkoutSessionWithExercises>;
}) => {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet
  } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
    keyName: 'rfcId'
  });

  const { errors } = useFormState({ control });

  const { ref: refExerciseModal, present: presentExerciseModal } = useModal();

  const {
    ref: refDangerous,
    present: presentDangerous,
    dismiss: dismissDangerous
  } = useModal();

  function handleAppendSet() {
    const exerciseSets = watch(`exercises.${exerciseIndex}.sets`);
    const emptySet: Set = {
      id: undefined,
      weight: 0,
      reps: 0,
      rpe: null,
      addedResistance: null,
      createdAt: new Date().toISOString()
    };
    const lastSet = exerciseSets.at(-1);
    const newSet = lastSet && {
      ...lastSet,
      created_at: new Date().toISOString(),
      id: undefined,
      rpe: null
    };

    appendSet(newSet || emptySet);
    onAddSet();
  }

  async function onRemove(setIndex: number, exerciseIndex: number) {
    const set = setFields[setIndex];

    if (setFields.length === 1) {
      onRemoveExercise(exerciseIndex);
    } else {
      removeSet(setIndex);

      const updatedSets = setFields.filter((_, i) => i !== setIndex);

      reset({
        ...getValues(),
        exercises: [
          ...getValues().exercises.map((exercise, idx) => {
            if (idx === exerciseIndex) {
              return {
                ...exercise,
                sets: updatedSets
              };
            }
            return exercise;
          })
        ]
      });

      if (set.id) {
        const result = await db.runAsync(
          `DELETE FROM sets WHERE id = ?;`,
          set.id
        );

        if (result.changes) {
          showToast({ theme, title: 'Set deleted' });
        }
      }
    }
  }

  if (setFields.length === 0) {
    return null;
  }

  return (
    <Box gap="m" marginVertical="m">
      <Box gap="s">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text variant="header3" color="primary" flex={1}>
            {exerciseName}
          </Text>
          <Pressable onPress={presentExerciseModal}>
            <Ionicons
              name="ellipsis-horizontal"
              color={theme.colors.primary}
              size={20}
            />
          </Pressable>
        </Box>
      </Box>
      <Box gap="m">
        <ControlledInput
          iconLeft={
            <Ionicons
              name="create-outline"
              size={20}
              color={theme.colors.mutedForeground}
            />
          }
          control={control}
          name={`exercises.${exerciseIndex}.exerciseSessionNotes` as const}
          placeholder="Add notes..."
        />
        {setFields.map((set, setIndex) => {
          const error = errors?.exercises?.[exerciseIndex]?.sets?.[setIndex];
          const setNumber = setIndex + 1;

          return (
            <Box gap="m" key={set.rfcId}>
              <Box gap="s" flexDirection="row" alignItems="flex-end">
                <Box flexDirection="column" gap="s">
                  {setNumber === 1 && (
                    <Text
                      variant="inputLabel"
                      color="mutedForeground"
                      textAlign="center"
                    >
                      {'Set'}
                    </Text>
                  )}
                  <Box
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    height={40}
                    paddingVertical="s"
                    paddingHorizontal="m"
                    borderRadius="sm"
                    borderWidth={1}
                    borderColor="secondary"
                  >
                    <Text
                      textAlign="center"
                      color="mutedForeground"
                      fontSize={18}
                      fontWeight={500}
                    >
                      {setNumber}
                    </Text>
                  </Box>
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  flex={1}
                  gap={'s'}
                >
                  <Box flexDirection="column" gap="s" flex={1}>
                    {setNumber === 1 && (
                      <ControlledSelect
                        control={control}
                        name={
                          `exercises.${exerciseIndex}.exerciseSessionWeightUnit` as const
                        }
                        placeholder="Select weight unit..."
                        optionsTitle="Weight Input"
                        options={[
                          { label: 'kg', value: 'kg' },
                          { label: 'lb', value: 'lb' },
                          { label: 'bw', value: 'bw' }
                        ]}
                      >
                        <Box
                          flexDirection="row"
                          alignItems="center"
                          justifyContent="center"
                          gap="xs"
                        >
                          <Text variant="inputLabel" color="mutedForeground">
                            {`Weight`}
                          </Text>

                          <Ionicons
                            name="chevron-expand"
                            color={theme.colors.mutedForeground}
                          />
                        </Box>
                      </ControlledSelect>
                    )}
                    <ControlledInput
                      name={
                        `exercises.${exerciseIndex}.sets.${setIndex}.weight` as const
                      }
                      withInputMessage={false}
                      control={control}
                      inputMode="numeric"
                      flex={1}
                      keyboardType="numeric"
                      style={{ fontSize: 18, fontWeight: '500' }}
                      textAlign="center"
                      iconRight={
                        <Text variant="inputLabel" color="mutedForeground">
                          {watch(
                            `exercises.${exerciseIndex}.exerciseSessionWeightUnit`
                          )}
                        </Text>
                      }
                    />
                  </Box>
                  <ControlledInput
                    name={
                      `exercises.${exerciseIndex}.sets.${setIndex}.reps` as const
                    }
                    withInputMessage={false}
                    label={setNumber === 1 ? 'Reps' : undefined}
                    flex={1}
                    style={{ fontSize: 18, fontWeight: '500' }}
                    control={control}
                    inputMode="numeric"
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <ControlledInput
                    name={
                      `exercises.${exerciseIndex}.sets.${setIndex}.rpe` as const
                    }
                    withInputMessage={false}
                    flex={1}
                    label={setNumber === 1 ? 'RPE' : undefined}
                    style={{ fontSize: 18, fontWeight: '500' }}
                    control={control}
                    inputMode="numeric"
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </Box>
                <Button
                  height={40}
                  width={40}
                  icon={
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.colors.destructiveForeground}
                    />
                  }
                  variant="destructive"
                  onPress={() => onRemove(setIndex, exerciseIndex)}
                />
              </Box>
              {error && (
                <Box gap="xs">
                  {Object.entries(error).map(
                    ([fieldName, { message: errorText }], index) => (
                      <FormError
                        key={index}
                        fieldName={fieldName.toUpperCase()}
                        errorText={errorText}
                        icon={
                          <Ionicons
                            size={36}
                            name={getIconForFormFieldName(fieldName)}
                            color={theme.colors.destructiveForeground}
                          />
                        }
                      />
                    )
                  )}
                </Box>
              )}
            </Box>
          );
        })}
        <Box>
          <Button
            label="Add set"
            variant="secondary"
            onPress={handleAppendSet}
          />
        </Box>
      </Box>
      <Modal
        ref={refExerciseModal}
        title={exerciseName}
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m">
            <Pressable onPress={() => alert('duplicate')}>
              <MenuItem
                label={'Duplicate exercise'}
                iconLeft={
                  <Ionicons
                    name="copy-outline"
                    color={theme.colors.primary}
                    size={20}
                  />
                }
              />
            </Pressable>
            <Pressable onPress={() => alert('stats')}>
              <MenuItem
                label={'See exercise stats'}
                iconLeft={
                  <Ionicons
                    name="bar-chart-outline"
                    color={theme.colors.primary}
                    size={20}
                  />
                }
              />
            </Pressable>
            <Pressable onPress={presentDangerous}>
              <MenuItem
                label={'Delete exercise'}
                textColor="destructive"
                iconLeft={
                  <Ionicons
                    name="trash-outline"
                    color={theme.colors.destructive}
                    size={20}
                  />
                }
              />
            </Pressable>
          </Box>
        </BottomSheetView>
      </Modal>
      <Modal
        enableDynamicSizing
        title={`Delete ${exerciseName}?`}
        ref={refDangerous}
        index={0}
        snapPoints={[]}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        <BottomSheetView>
          <Box padding="m" flexDirection="row" gap="m">
            <Box flex={1}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={dismissDangerous}
              />
            </Box>
            <Box flex={1}>
              <Button
                label="Delete"
                variant="destructive"
                onPress={() => onRemoveExercise(exerciseIndex)}
              />
            </Box>
          </Box>
        </BottomSheetView>
      </Modal>
    </Box>
  );
};
