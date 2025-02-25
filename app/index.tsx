import MenuItem from '@/components/MenuItem';
import { useFocusEffect } from 'expo-router';
import { Box } from '@/components/ui/Box';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { groupWorkoutSessions, showToast } from '@/lib/utils';
import { type TMenuItem } from '@/types';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { addDays, format, isToday, subDays } from 'date-fns';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  WorkoutSession,
  Set,
  ExerciseSessionWithExercise,
  Workout,
  workoutSchema,
  WorkoutSessionWithExercises,
  ExerciseSessionWithSets
} from '@/lib/zodSchemas';
import WorkoutSessions from '../components/WorkoutSessions';
import Button from '@/components/ui/Button';

const menuItems: TMenuItem[] = [
  // {
  //   id: 'settings-statistics',
  //   href: '/stats/day',
  //   label: 'Statistics',
  //   icon: 'stats-chart-outline'
  // },
  {
    id: 'settings-tracker',
    href: '/settings/bodyMetrics',
    label: 'Body metrics',
    icon: 'body-outline'
  },
  // {
  //   id: 'settings-share',
  //   href: '/screens/settings',
  //   label: 'Share workout',
  //   icon: 'share-social-outline'
  // },
  // {
  //   id: 'settings',
  //   href: '/screens/settings',
  //   label: 'Copy workout',
  //   icon: 'documents-outline'
  // },
  {
    id: 'settings',
    href: '/settings',
    label: 'Settings',
    icon: 'settings-outline'
  }
];

type SearchParams = {
  workoutDateId: string;
  workoutId: string;
};

export type ClipboardState =
  | { type: 'none' }
  | { type: 'exerciseSession'; data: ExerciseSessionWithSets }
  | { type: 'workoutSession'; data: WorkoutSessionWithExercises }
  | { type: 'day'; data: WorkoutSessionWithExercises[] };

export default function MainScreen() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { workoutDateId } = useLocalSearchParams<SearchParams>();

  const todayDateId = new Date().toISOString();

  const [isWorkoutSynched, setIsWorkoutSynched] = useState(true);
  const [currentDate, setCurrentDate] = useState(workoutDateId || todayDateId);
  const [isLoading, setIsLoading] = useState(true);
  const [clipboard, setClipboard] = useState<ClipboardState>({ type: 'none' });

  const controllerRef = useRef<AbortController | null>(null);

  const moreModal = useModal();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    setValue,
    setFocus,
    formState: { isDirty }
  } = useForm<Workout>({
    resolver: zodResolver(workoutSchema),
    defaultValues: { workouts: [] }
  });

  useEffect(() => {
    setIsWorkoutSynched(!isDirty);
  }, [isDirty]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function fetchSets() {
        const controller = new AbortController();
        controllerRef.current = controller;

        setIsLoading(true);
        const result = await db.getAllAsync<
          WorkoutSession & ExerciseSessionWithExercise & Set
        >(
          `
            SELECT
                w.id as workoutId,
                w.start_time as workoutStart,
                w.end_time as workoutEnd,
                w.workout_name as workoutName,
                es.id as exerciseSessionId,
                es.notes as exerciseSessionNotes,
                es.weight_unit as exerciseSessionWeightUnit,
                s.id,
                s.weight,
                s.reps,
                s.rpe,
                s.created_at as createdAt,
                s.exercise_id as exerciseId,
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
                DATE(w.start_time) = ?
            ORDER BY
                w.id,
                es.id,
                s.id;
      `,
          toDateId(new Date(currentDate))
        );

        reset({ workouts: groupWorkoutSessions(result) });

        setIsLoading(false);
      }

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [currentDate])
  );

  const workoutSessions = getValues('workouts');

  async function onSubmit(formData: Workout) {
    const { success, data, error } =
      await workoutSchema.safeParseAsync(formData);

    if (error) {
      console.error(error);
    }

    if (success) {
      const { workouts } = data;

      await db.withTransactionAsync(async () => {
        try {
          for (const workout of workouts) {
            let { exercises, workoutId, workoutName, workoutStart } = workout;

            if (!workoutId) {
              workoutId = (
                await db.runAsync(
                  `INSERT INTO workouts (start_time) VALUES (?);`,
                  workoutStart
                )
              ).lastInsertRowId;
            }

            await db.runAsync(
              `UPDATE workouts SET workout_name = ? WHERE id = ?`,
              workoutName,
              workoutId
            );

            for (const exercise of exercises) {
              let {
                sets,
                exerciseSessionId,
                exerciseSessionNotes,
                exerciseSessionWeightUnit,
                exerciseId
              } = exercise;

              // Create exercise session if doesn't exist
              if (!exerciseSessionId) {
                exerciseSessionId = (
                  await db.runAsync(
                    `INSERT INTO exercise_session (workout_id, exercise_id, start_time) VALUES (?, ?, ?)`,
                    workoutId,
                    exerciseId!
                  )
                ).lastInsertRowId;
              }

              // Update exercise session
              await db.runAsync(
                `UPDATE exercise_session SET notes = ?, weight_unit = ? WHERE id = ?;`,
                [
                  exerciseSessionNotes,
                  exerciseSessionWeightUnit,
                  exerciseSessionId
                ]
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
          }
        } catch (e) {
          console.log(e);
        }
      });

      Keyboard.dismiss();
      showToast({ theme, title: 'Workout saved' });

      reset({ workouts }, { keepDirty: false });
      setIsWorkoutSynched(true);
    } else {
      showToast({ theme, title: 'Failed to save workout' });
    }
  }

  function handleSelectPreviousDay() {
    setCurrentDate(subDays(currentDate, 1).toISOString());
    setIsWorkoutSynched(true);
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }

  function handleSelectNextDay() {
    setCurrentDate(addDays(currentDate, 1).toISOString());
    setIsWorkoutSynched(true);
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }

  function handleCopyDay() {
    setClipboard({ type: 'day', data: workoutSessions });
    moreModal.dismiss();
  }

  function handlePaste() {
    if (clipboard.type === 'none') return;

    let updatedDay: WorkoutSessionWithExercises[] = [];

    if (clipboard.type === 'day') {
      updatedDay = [
        ...workoutSessions,
        ...clipboard.data.map(workoutSession => ({
          ...workoutSession,
          workoutId: undefined,
          workoutName: null,
          workoutStart: currentDate,
          workoutEnd: null,
          exercises: workoutSession.exercises.map(exSession => ({
            ...exSession,
            createdAt: currentDate,
            exerciseSessionId: undefined,
            sets:
              exSession.sets?.map(set => ({
                ...set,
                createdAt: new Date().toISOString(),
                id: undefined
              })) || []
          }))
        }))
      ];
    } else if (clipboard.type === 'workoutSession') {
      updatedDay = [
        ...workoutSessions,
        {
          ...clipboard.data,
          workoutId: undefined,
          workoutName: null,
          workoutStart: currentDate,
          workoutEnd: null,
          exercises: clipboard.data.exercises.map(exSession => ({
            ...exSession,
            createdAt: new Date().toISOString(),
            exerciseSessionId: undefined,
            sets:
              exSession.sets?.map(set => ({
                ...set,
                createdAt: new Date().toISOString(),
                id: undefined
              })) || []
          }))
        }
      ];
    } else if (clipboard.type === 'exerciseSession') {
      const newWorkoutSession: WorkoutSessionWithExercises = {
        workoutName: null,
        workoutStart: currentDate,
        workoutEnd: null,
        workoutId: undefined,
        exercises: [
          {
            ...clipboard.data,
            sets:
              clipboard.data.sets?.map(set => ({
                ...set,
                createdAt: new Date().toISOString(),
                id: undefined
              })) || []
          }
        ]
      };
      updatedDay = [...workoutSessions, newWorkoutSession];
    }

    setValue('workouts', updatedDay);
    moreModal.dismiss();
    showToast({ theme, title: 'Workout pasted' });
    setIsWorkoutSynched(false);
  }

  return (
    <>
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
                onPress={handleSelectPreviousDay}
              >
                <Ionicons
                  name="chevron-back"
                  color={theme.colors.primary}
                  size={24}
                />
              </Pressable>
              <Pressable onPress={() => setCurrentDate(todayDateId)}>
                <Text variant="header2" color="primary">
                  {isToday(currentDate)
                    ? 'Today'
                    : format(currentDate, 'MMM, dd')}
                </Text>
              </Pressable>
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={handleSelectNextDay}
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
              {workoutSessions.length > 0 && (
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
                onPress={moreModal.present}
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
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </Box>
        ) : (
          <Box flex={1} padding="m">
            {workoutSessions.length === 0 ? (
              <Box
                justifyContent="center"
                alignItems="center"
                gap="xl"
                flex={1}
              >
                <Text color="primary" variant="header3">
                  No workouts recorded
                </Text>
                <Box gap="s" flexDirection="column" width={'75%'}>
                  <Button
                    label="Start workout"
                    onPress={() =>
                      router.navigate({
                        pathname: '/search',
                        params: {
                          workoutDate: currentDate
                        }
                      })
                    }
                  />
                  <Button
                    variant="secondary"
                    label="Use template"
                    onPress={() =>
                      router.navigate({
                        pathname: '/template',
                        params: { workoutDate: currentDate }
                      })
                    }
                  />
                </Box>
              </Box>
            ) : (
              <WorkoutSessions
                {...{
                  control,
                  watch,
                  reset,
                  setFocus,
                  getValues,
                  setValue,
                  clipboard
                }}
                onCopyToClipboard={setClipboard}
                onRemoveWorkoutSession={() => setIsWorkoutSynched(true)}
                onAddSet={() => setIsWorkoutSynched(false)}
                onRemoveSet={() => setIsWorkoutSynched(true)}
              />
            )}
          </Box>
        )}
      </ScrollView>

      {workoutSessions.length > 0 && (
        <Button
          position="absolute"
          aspectRatio={'1/1'}
          width={48}
          height={48}
          right={24}
          bottom={48}
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.25}
          shadowRadius={3.84}
          shadowColor="background"
          elevation={5}
          icon={
            <FontAwesome6
              name="plus"
              size={20}
              color={theme.colors.primaryForeground}
            />
          }
          onPress={() => {
            router.navigate({
              pathname: '/search',
              params: {
                workoutDate: currentDate
              }
            });
          }}
        />
      )}

      <Modal
        ref={moreModal.ref}
        title="More"
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m" flex={1}>
            <Pressable
              onPress={() => {
                moreModal.dismiss();
                router.navigate({
                  pathname: '/calendarView',
                  params: { targetWorkoutDateString: currentDate }
                });
              }}
            >
              <MenuItem
                label={'Workout calendar'}
                iconLeft={
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                }
              />
            </Pressable>

            <Pressable
              onPress={() => {
                moreModal.dismiss();
                router.navigate({
                  pathname: '/template',
                  params: { workoutDate: currentDate }
                });
              }}
            >
              <MenuItem
                label={'Use template'}
                iconLeft={
                  <Ionicons
                    name="copy"
                    size={20}
                    color={theme.colors.primary}
                  />
                }
              />
            </Pressable>
            {workoutSessions.length > 0 && (
              <Pressable onPress={handleCopyDay}>
                <MenuItem
                  label={'Copy'}
                  iconLeft={
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  }
                />
              </Pressable>
            )}
            {clipboard.type !== 'none' && (
              <Pressable onPress={handlePaste}>
                <MenuItem
                  label={'Paste'}
                  iconLeft={
                    <Ionicons
                      name="clipboard-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  }
                />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                router.navigate({
                  pathname: '/stats/day',
                  params: {
                    dateRangeFrom: currentDate
                  }
                });
                moreModal.dismiss();
              }}
            >
              <MenuItem
                label={'Statistics'}
                iconLeft={
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                }
              />
            </Pressable>
            {menuItems.map(({ href, label, icon }, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  moreModal.dismiss();

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
          </Box>
        </BottomSheetView>
      </Modal>
    </>
  );
}
