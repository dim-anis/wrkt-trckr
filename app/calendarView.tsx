import { WorkoutCalendar } from '@/components/WorkoutCalendar/WorkoutCalendar';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  Calendar,
  CalendarListRef,
  toDateId
} from '@marceloterreiro/flash-calendar';
import { useTheme } from '@shopify/restyle';
import {
  Stack,
  useFocusEffect,
  router,
  useLocalSearchParams
} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useRef } from 'react';
import { Pressable } from 'react-native';
import { Modal, useModal } from '@/components/ui/Modal';
import {
  ExerciseSessionWithExercise,
  WorkoutSession,
  Set as ExerciseSet,
  Workout
} from '@/lib/zodSchemas';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { groupWorkoutSessions } from '@/lib/utils';
import { format, isToday, startOfMonth } from 'date-fns';
import WorkoutStatsCard from '@/components/WorkoutStatsCard';
import Button from '@/components/ui/Button';

type SearchParams = {
  targetWorkoutDateString: string;
};
export type WorkoutDate = {
  workout_date: string;
};

export default function CalendarView() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { targetWorkoutDateString } = useLocalSearchParams<SearchParams>();
  const targetWorkoutDateTimestamp = new Date(targetWorkoutDateString);

  const [selectedDate, setSelectedDate] = React.useState(
    toDateId(targetWorkoutDateTimestamp)
  );
  const [workoutIds, setWorkoutIds] = React.useState<Set<string>>(new Set());
  const [workoutSessionsToShow, setWorkoutSessionsToShow] = React.useState<
    Workout['workouts']
  >([]);

  const ref = useRef<CalendarListRef>(null);

  const workoutDetailsModal = useModal();
  const copyWorkoutModal = useModal();

  const handleCalendarPress = React.useCallback(
    (date: string) => {
      setSelectedDate(date);

      async function fetchSets() {
        const result = await db.getAllAsync<
          WorkoutSession & ExerciseSessionWithExercise & ExerciseSet
        >(
          `
            SELECT
                w.id as workoutId,
                w.start_time as workoutStart,
                w.workout_name as workoutName,
                es.id as exerciseSessionId,
                es.notes as exerciseSessionNotes,
                es.weight_unit as exerciseSessionWeightUnit,
                es.exercise_id as exerciseId,
                s.id,
                s.weight,
                s.reps,
                s.rpe,
                s.exercise_session_id,
                s.created_at as createdAt,
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
          toDateId(new Date(date))
        );

        if (result) {
          setWorkoutSessionsToShow(groupWorkoutSessions(result));
        }
      }

      fetchSets();

      workoutDetailsModal.present({ date });
    },
    [workoutDetailsModal.present]
  );

  async function handleAppendToWorkout(
    targetWorkoutId: number,
    sourceWorkoutExerciseSessions: Workout['workouts'][number]['exercises']
  ) {
    await db.withTransactionAsync(async () => {
      for (const exerciseSession of sourceWorkoutExerciseSessions) {
        const createSessionResult = await db.runAsync(
          `INSERT INTO exercise_session (workout_id, exercise_id, weight_unit) VALUES (?,?,?);`,
          [
            targetWorkoutId,
            exerciseSession.exerciseId!,
            exerciseSession.exerciseSessionWeightUnit
          ]
        );

        const newSessionId = createSessionResult.lastInsertRowId;

        for (const set of exerciseSession.sets) {
          await db.runAsync(
            `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, rpe, added_resistance) VALUES (?,?,?,?,?,?,?);`,
            [
              targetWorkoutId,
              exerciseSession.exerciseId!,
              newSessionId,
              set.weight,
              set.reps,
              set.rpe,
              set.addedResistance
            ]
          );
        }
      }
    });

    copyWorkoutModal.dismiss();
    router.navigate({ pathname: '/' });
  }

  async function handleCreateNewWorkout(
    sourceWorkoutId: number,
    workoutIdToFinish?: number
  ) {
    if (workoutIdToFinish) {
      await db.runAsync(
        `
        UPDATE workouts
        SET end_time = (
            SELECT MAX(s.created_at)
            FROM exercise_session es
            INNER JOIN sets s ON es.id = s.exercise_session_id
            WHERE es.workout_id = workouts.id
        )
        WHERE id = ?;
        `,
        workoutIdToFinish
      );
    }

    const createWorkoutResult = await db.runAsync(
      `INSERT INTO workouts (start_time) VALUES (?);`,
      targetWorkoutDateString
    );

    const targetWorkoutId = createWorkoutResult.lastInsertRowId;

    await db.execAsync(
      `
      INSERT INTO exercise_session (workout_id, exercise_id, weight_unit)
      SELECT
          ${targetWorkoutId} AS workout_id,
          exercise_id,
          weight_unit
      FROM exercise_session
      WHERE workout_id = ${sourceWorkoutId};

      CREATE TEMP TABLE tempExerciseSessionMapping AS
      SELECT
          old.id AS oldExerciseSession_id,
          new.id AS newExerciseSession_id
      FROM exercise_session old
      JOIN exercise_session new
        ON old.exercise_id = new.exercise_id
      WHERE old.workout_id = ${sourceWorkoutId}
        AND new.workout_id = ${targetWorkoutId};

      INSERT INTO sets (workout_id, exercise_session_id, exercise_id, reps, weight, rpe, added_resistance)
      SELECT 
          ${targetWorkoutId} AS workout_id,
          tempExerciseSessionMapping.newExerciseSession_id,
          sets.exercise_id,
          sets.reps,
          sets.weight,
          sets.rpe,
          sets.added_resistance
      FROM sets
      JOIN tempExerciseSessionMapping
          ON sets.exercise_session_id = tempExerciseSessionMapping.oldExerciseSession_id;

      DROP TABLE tempExerciseSessionMapping;
    `
    );

    copyWorkoutModal.dismiss();
    router.navigate('/');
  }

  async function handleCopyToToday(sourceWorkout: Workout['workouts'][number]) {
    let targetWorkoutId;
    const existingWorkout = await db.getAllAsync<WorkoutSession>(
      'SELECT id as workoutId, workout_name as workoutName, created_at AS workoutStart from workouts WHERE DATE(start_time) = ? AND end_time IS NULL;',
      toDateId(targetWorkoutDateTimestamp)
    );

    if (existingWorkout.length) {
      targetWorkoutId = existingWorkout.at(-1)?.workoutId;
    }

    if (!targetWorkoutId) {
      handleCreateNewWorkout(sourceWorkout.workoutId);
    } else {
      copyWorkoutModal.present({
        sourceWorkoutId: sourceWorkout.workoutId,
        targetWorkoutId,
        sourceWorkoutExerciseSessions: sourceWorkout.exercises
      });
    }

    workoutDetailsModal.dismiss();
  }

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchWorkouts = async () => {
        try {
          const workoutSessions = await db.getAllAsync<
            Pick<WorkoutSession, 'workoutStart'>
          >(`SELECT DATE(workouts.start_time) as workoutStart FROM workouts;`);

          if (workoutSessions) {
            const workoutDateIds = workoutSessions.map(
              session => session.workoutStart
            );
            setWorkoutIds(new Set(workoutDateIds));
          }
        } catch (error) {}
      };

      fetchWorkouts();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Box flexDirection="row" gap="m">
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() =>
                  ref?.current?.scrollToMonth(startOfMonth(new Date()), true)
                }
              >
                <Ionicons
                  name="calendar-number-outline"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
              {/* <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}> */}
              {/*   <Ionicons */}
              {/*     name="ellipsis-vertical" */}
              {/*     color={theme.colors.primary} */}
              {/*     size={20} */}
              {/*   /> */}
              {/* </Pressable> */}
            </Box>
          ),
          headerTitle: 'Workout calendar',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary
        }}
      />
      <Box bg="background" flex={1} justifyContent="center" padding="m">
        <Calendar.List
          calendarActiveDateRanges={[
            {
              startId: selectedDate,
              endId: selectedDate
            }
          ]}
          calendarFirstDayOfWeek="monday"
          calendarInitialMonthId={selectedDate}
          onCalendarDayPress={handleCalendarPress}
          calendarDayHeight={48}
          ref={ref}
          renderItem={({ item }) => {
            return (
              <Box marginBottom="m">
                <WorkoutCalendar
                  workoutDayIds={workoutIds}
                  calendarMonthId={item.id}
                  {...item.calendarProps}
                />
              </Box>
            );
          }}
        />
      </Box>

      <Modal
        ref={workoutDetailsModal.ref}
        title={`Workouts from ${format(selectedDate, 'MMM d')}`}
        enableDynamicSizing
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({ data: { date } }) => (
          <BottomSheetScrollView>
            <Box padding="m" gap="l">
              {workoutIds.has(date) ? (
                workoutSessionsToShow.map((sourceWorkout, idx) => {
                  const workoutName =
                    sourceWorkout.workoutName ?? `Workout #${idx + 1}`;
                  return (
                    <Box
                      key={sourceWorkout.workoutId}
                      flexDirection="column"
                      gap="m"
                    >
                      <WorkoutStatsCard
                        workoutName={workoutName}
                        workoutStart={sourceWorkout.workoutStart}
                        exercises={sourceWorkout.exercises}
                      />
                      <Button
                        label={`Copy to ${isToday(targetWorkoutDateTimestamp) ? 'today' : format(targetWorkoutDateTimestamp, 'E, MMM d')}`}
                        onPress={() => handleCopyToToday(sourceWorkout)}
                      />
                    </Box>
                  );
                })
              ) : (
                <Text color="mutedForeground" variant="body">
                  No workouts recorded
                </Text>
              )}
            </Box>
          </BottomSheetScrollView>
        )}
      </Modal>
      <Modal
        ref={copyWorkoutModal.ref}
        title={`You have an ongoing workout`}
        enableDynamicSizing
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({
          data: {
            sourceWorkoutId,
            targetWorkoutId,
            sourceWorkoutExerciseSessions
          }
        }) => {
          return (
            <BottomSheetView>
              <Box padding="m" gap="m">
                <Text color="primary" variant="body">
                  You can{' '}
                  <Text variant="body" fontWeight={700}>
                    append this workout
                  </Text>{' '}
                  to the ongoing workout or finish the ongoing workout and{' '}
                  <Text variant="body" fontWeight={700}>
                    create a new workout
                  </Text>
                  .
                </Text>
                <Box flexDirection="row" gap="s" marginBottom="m">
                  <Box flex={1}>
                    <Button
                      label={'Append to workout'}
                      variant="secondary"
                      onPress={() =>
                        handleAppendToWorkout(
                          targetWorkoutId,
                          sourceWorkoutExerciseSessions
                        )
                      }
                    />
                  </Box>
                  <Box flex={1}>
                    <Button
                      label={'Create new workout'}
                      onPress={() => {
                        handleCreateNewWorkout(
                          sourceWorkoutId,
                          targetWorkoutId
                        );
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </BottomSheetView>
          );
        }}
      </Modal>
    </>
  );
}
