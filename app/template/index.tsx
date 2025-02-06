import WorkoutStatsCard from '@/components/WorkoutStatsCard';
import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { groupWorkoutSessions, groupUserTemplatesById } from '@/lib/utils';
import {
  ExerciseSessionWithExercise,
  Workout,
  WorkoutSession,
  Set as ExerciseSet,
  Template
} from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { useTheme } from '@shopify/restyle';
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams
} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';

type SearchParams = { workoutDate: string };

type GeneratedTemplate = {
  pattern: string;
  occurrenceCount: number;
  workoutIds: string;
};

export default function SelectTemplate() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { workoutDate } = useLocalSearchParams<SearchParams>();

  const [searchTerm, setSearchTerm] = useState('');
  const [userTemplates, setUserTemplates] = React.useState<Template[]>([]);
  const [generatedTemplates, setGeneratedTemplates] = React.useState<
    GeneratedTemplate[]
  >([]);
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout['workouts']>(
    []
  );

  function searchUserTemplates(searchTerm: string): Promise<Template[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await db.getAllAsync<{
          id: number;
          name: string;
          exerciseName: string;
          exerciseId: number;
          setCount: number;
        }>(
          `SELECT
              t.name as name,
              te.exercise_id as exerciseId,
              e.name AS exerciseName,
              te.set_count as setCount
           FROM
              templates t
           LEFT JOIN
              template_exercises te
           ON
              t.id = te.template_id
           LEFT JOIN
              exercises e
           ON
              te.exercise_id = e.id
           WHERE
              ${searchTerm ? `t.name LIKE ?` : '1=1'}
           ;`,
          ...(searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [])
        );

        resolve(groupUserTemplatesById(result));
      } catch (error) {
        reject(error);
      }
    });
  }

  function searchGeneratedTemplates(
    searchTerm: string
  ): Promise<GeneratedTemplate[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const exercises = await db.getAllAsync<GeneratedTemplate>(
          `
            WITH SessionDetails AS (
                SELECT
                    w.id AS workout_id,
                    e.name AS exercise_name
                FROM
                    workouts w
                JOIN
                    exercise_session es ON w.id = es.workout_id
                JOIN
                    exercises e ON es.exercise_id = e.id
                GROUP BY
                    w.id, e.name
            ),
            SortedSessionPattern AS (
                SELECT
                    workout_id,
                    GROUP_CONCAT(exercise_name, '->') AS pattern
                FROM (
                    SELECT
                        workout_id,
                        exercise_name
                    FROM
                        SessionDetails
                    ORDER BY
                        workout_id, exercise_name
                )
                GROUP BY
                    workout_id
            )
            SELECT
                pattern,
                COUNT(*) AS occurrenceCount,
                GROUP_CONCAT(workout_id) AS workoutIds
            FROM
                SortedSessionPattern
            WHERE
                ${searchTerm ? `pattern LIKE ?` : '1=1'}
            GROUP BY
                pattern
            HAVING 
                COUNT(*) > 1
            ORDER BY
                occurrenceCount DESC
           `,
          ...(searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [])
        );

        resolve(exercises);
      } catch (error) {
        reject(error);
      }
    });
  }

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          const result = await db.getAllAsync<{
            id: number;
            name: string;
            exerciseName: string;
            exerciseId: number;
            setCount: number;
          }>(
            `SELECT t.name as name, te.exercise_id as exerciseId, e.name AS exerciseName, te.set_count as setCount FROM templates t LEFT JOIN template_exercises te ON t.id = te.template_id LEFT JOIN exercises e ON te.exercise_id = e.id;`
          );

          if (result) {
            setUserTemplates(groupUserTemplatesById(result));
          }
        } catch (error) {
          console.log(error);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [generatedTemplates, userTemplates] = await Promise.all([
          searchGeneratedTemplates(searchTerm),
          searchUserTemplates(searchTerm)
        ]);

        setGeneratedTemplates(generatedTemplates);
        setUserTemplates(userTemplates);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };

    fetchTemplates();
  }, [searchTerm]);

  const templateWorkoutsModal = useModal();
  const copyTemplateModal = useModal();

  const handleTemplatePress = React.useCallback(
    (workoutIds: string[]) => {
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
                w.id IN (${workoutIds.join(',')})
            ORDER BY
                w.id,
                es.id,
                s.id;
      `
        );

        if (result) {
          setTemplateWorkouts(groupWorkoutSessions(result));
        }
      }

      fetchSets();

      templateWorkoutsModal.present();
    },
    [templateWorkoutsModal.present]
  );

  async function handleCreateWorkoutFromTemplate({
    sourceWorkoutId,
    workoutIdToFinish,
    templateData
  }: {
    sourceWorkoutId?: number;
    workoutIdToFinish?: number;
    templateData?: Template;
  } = {}) {
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
      workoutDate
    );

    const targetWorkoutId = createWorkoutResult.lastInsertRowId;

    if (sourceWorkoutId) {
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
    } else {
      await db.withTransactionAsync(async () => {
        if (templateData) {
          for (const {
            exerciseId,
            setCount
          } of templateData.selectedExercises) {
            const { lastInsertRowId: exerciseSessionId } = await db.runAsync(
              `INSERT INTO exercise_session (workout_id, exercise_id) VALUES (?, ?);`,
              targetWorkoutId,
              exerciseId!
            );

            for (let i = 0; i < setCount; i++) {
              await db.runAsync(
                `INSERT INTO sets (workout_id, exercise_session_id, exercise_id, reps, weight) VALUES (?, ?, ?, ?, ?);`,
                targetWorkoutId,
                exerciseSessionId,
                exerciseId!,
                0,
                0
              );
            }
          }
        }
      });
    }

    router.navigate('/');
  }

  async function handleAppendToWorkout({
    targetWorkoutId,
    sourceWorkoutExerciseSessions,
    templateData
  }: {
    targetWorkoutId: number;
    sourceWorkoutExerciseSessions?: Workout['workouts'][number]['exercises'];
    templateData: Template;
  }) {
    if (sourceWorkoutExerciseSessions) {
      await db.withTransactionAsync(async () => {
        for (const exerciseSession of sourceWorkoutExerciseSessions) {
          const { lastInsertRowId: exerciseSessionId } = await db.runAsync(
            `INSERT INTO exercise_session (workout_id, exercise_id, weight_unit) VALUES (?,?,?);`,
            [
              targetWorkoutId,
              exerciseSession.exerciseId!,
              exerciseSession.exerciseSessionWeightUnit
            ]
          );

          for (const set of exerciseSession.sets) {
            await db.runAsync(
              `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, rpe, added_resistance) VALUES (?,?,?,?,?,?,?);`,
              [
                targetWorkoutId,
                exerciseSession.exerciseId!,
                exerciseSessionId,
                set.weight,
                set.reps,
                set.rpe,
                set.addedResistance
              ]
            );
          }
        }
      });
    } else {
      if (templateData) {
        await db.withTransactionAsync(async () => {
          for (const {
            exerciseId,
            setCount
          } of templateData.selectedExercises) {
            const { lastInsertRowId: exerciseSessionId } = await db.runAsync(
              `INSERT INTO exercise_session (workout_id, exercise_id) VALUES (?, ?);`,
              targetWorkoutId,
              exerciseId!
            );

            for (let i = 0; i < setCount; i++) {
              await db.runAsync(
                `INSERT INTO sets (workout_id, exercise_session_id, exercise_id, reps, weight) VALUES (?, ?, ?, ?, ?);`,
                targetWorkoutId,
                exerciseSessionId,
                exerciseId!,
                0,
                0
              );
            }
          }
        });
      }
    }

    router.navigate({ pathname: '/' });
  }

  async function handleUseTemplate({
    sourceWorkout,
    templateData
  }: {
    sourceWorkout?: Workout['workouts'][number];
    templateData?: Template;
  }) {
    let targetWorkoutId;
    const existingWorkouts = await db.getAllAsync<WorkoutSession>(
      'SELECT id as workoutId, workout_name as workoutName, created_at AS workoutStart from workouts WHERE DATE(start_time) = ? AND end_time IS NULL;',
      toDateId(new Date(workoutDate))
    );

    if (existingWorkouts.length) {
      targetWorkoutId = existingWorkouts.at(-1)?.workoutId;
    }

    if (!targetWorkoutId) {
      handleCreateWorkoutFromTemplate({
        templateData,
        sourceWorkoutId: sourceWorkout?.workoutId
      });
    } else {
      if (sourceWorkout) {
        copyTemplateModal.present({
          sourceWorkoutDate: sourceWorkout.workoutStart,
          sourceWorkoutId: sourceWorkout.workoutId,
          targetWorkoutId,
          sourceWorkoutExerciseSessions: sourceWorkout.exercises
        });
      } else {
        copyTemplateModal.present({
          targetWorkoutId,
          templateData
        });
      }
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Use template',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => router.navigate('/template/createTemplate')}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </Pressable>
              {/* <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}> */}
              {/*   <Ionicons */}
              {/*     name="ellipsis-vertical" */}
              {/*     size={20} */}
              {/*     color={theme.colors.primary} */}
              {/*   /> */}
              {/* </Pressable> */}
            </Box>
          )
        }}
      />
      <Box
        paddingHorizontal="m"
        paddingVertical="s"
        backgroundColor="background"
        flex={1}
      >
        <Box marginBottom="s">
          <Input
            onChangeText={text => setSearchTerm(text)}
            placeholder="Search templates by name or exercise name..."
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
        </Box>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1
          }}
          style={{ backgroundColor: theme.colors.background }}
        >
          <Box flex={1}>
            {!generatedTemplates.length && !userTemplates.length ? (
              <Box
                flex={1}
                flexDirection="column"
                gap="s"
                justifyContent="center"
                alignItems="center"
              >
                <Ionicons
                  name="clipboard-outline"
                  size={50}
                  color={theme.colors.mutedForeground}
                />
                <Text color="mutedForeground" variant="header3">
                  No templates found
                </Text>
              </Box>
            ) : (
              <>
                {userTemplates.length > 0 && (
                  <Box marginTop="m">
                    <Text variant="inputLabel" color="mutedForeground">
                      My templates
                    </Text>
                    <Box gap="m" marginTop="m">
                      {userTemplates.map((template, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() =>
                            handleUseTemplate({ templateData: template })
                          }
                        >
                          <Box
                            padding="m"
                            backgroundColor="muted"
                            borderRadius="lg"
                            gap="s"
                          >
                            <Text
                              color="primary"
                              variant="header3"
                              numberOfLines={1}
                            >
                              {template.name}
                            </Text>
                            <Text
                              color="secondaryForeground"
                              variant="body"
                              numberOfLines={2}
                            >
                              {template.selectedExercises
                                .map(({ exerciseName }) => exerciseName)
                                .join(', ')}
                            </Text>
                            <Box marginTop="s">
                              <Box
                                flexDirection="row"
                                gap="xs"
                                alignItems="center"
                                justifyContent="flex-end"
                              >
                                <Text
                                  color="mutedForeground"
                                  variant="body"
                                >{`Use template`}</Text>

                                <Ionicons
                                  name="chevron-forward"
                                  size={14}
                                  color={theme.colors.mutedForeground}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Pressable>
                      ))}
                    </Box>
                  </Box>
                )}
                <Box marginTop="m">
                  <Text variant="inputLabel" color="mutedForeground">
                    Generated templates
                  </Text>
                  <Box gap="m" marginTop="m">
                    {generatedTemplates.map((template, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() =>
                          handleTemplatePress(template.workoutIds.split(','))
                        }
                      >
                        <Box
                          padding="m"
                          backgroundColor="muted"
                          borderRadius="lg"
                          gap="s"
                        >
                          <Text
                            color="primary"
                            variant="header3"
                            numberOfLines={1}
                          >{`Template ${idx + 1}`}</Text>
                          <Text
                            color="secondaryForeground"
                            variant="body"
                            numberOfLines={2}
                          >
                            {template.pattern.replaceAll('->', ', ')}
                          </Text>
                          <Box marginTop="s">
                            <Box
                              flexDirection="row"
                              gap="xs"
                              alignItems="center"
                              justifyContent="flex-end"
                            >
                              <Text
                                color="mutedForeground"
                                variant="body"
                              >{`See ${template.occurrenceCount} workouts`}</Text>

                              <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={theme.colors.mutedForeground}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Pressable>
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </ScrollView>
      </Box>
      <Modal
        ref={templateWorkoutsModal.ref}
        title={`Template workouts`}
        enableDynamicSizing={false}
        snapPoints={['75%']}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetScrollView>
          <Box padding="m" gap="l">
            {templateWorkouts.map((workout, idx) => {
              const workoutName = workout.workoutName ?? `Workout #${idx + 1}`;
              return (
                <Box key={workout.workoutId} flexDirection="column" gap="m">
                  <WorkoutStatsCard
                    workoutName={workoutName}
                    workoutStart={workout.workoutStart}
                    exercises={workout.exercises}
                  />
                  <Button
                    label={`Use as template`}
                    onPress={() =>
                      handleUseTemplate({ sourceWorkout: workout })
                    }
                  />
                </Box>
              );
            })}
          </Box>
        </BottomSheetScrollView>
      </Modal>
      <Modal
        ref={copyTemplateModal.ref}
        title={`You have an ongoing workout`}
        enableDynamicSizing
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({
          data: {
            sourceWorkoutId,
            targetWorkoutId,
            sourceWorkoutExerciseSessions,
            templateData
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
                        handleAppendToWorkout({
                          targetWorkoutId,
                          sourceWorkoutExerciseSessions,
                          templateData
                        })
                      }
                    />
                  </Box>
                  <Box flex={1}>
                    <Button
                      label={'Create new workout'}
                      onPress={() =>
                        handleCreateWorkoutFromTemplate({
                          sourceWorkoutId,
                          workoutIdToFinish: targetWorkoutId,
                          templateData
                        })
                      }
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
