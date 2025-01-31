import MenuItem from '@/components/MenuItem';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Theme } from '@/lib/theme';
import {
  ExerciseSession,
  ExerciseSessionWithExercise,
  Workout,
  WorkoutSessionWithExercises
} from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
  useFieldArray
} from 'react-hook-form';
import { Pressable } from 'react-native';
import ExerciseSessionSets from './ExerciseSessionSets';
import { showToast } from '@/lib/utils';
import { Dispatch, SetStateAction } from 'react';
import { ClipboardState } from '@/app';

type ExerciseSessionProps = {
  control: Control<Workout>;
  watch: UseFormWatch<Workout>;
  workoutSessionIndex: number;
  reset: UseFormReset<Workout>;
  getValues: UseFormGetValues<Workout>;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onRemoveWorkoutSession: (workoutSessionId: number) => void;
  onCopyToClipboard: Dispatch<SetStateAction<ClipboardState>>;
  clipboard: ClipboardState;
};

const ExerciseSessions = ({
  control,
  watch,
  workoutSessionIndex,
  reset,
  getValues,
  onAddSet,
  onRemoveSet,
  onRemoveWorkoutSession,
  clipboard,
  onCopyToClipboard
}: ExerciseSessionProps) => {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { fields: exerciseSessions, remove: removeExerciseSession } =
    useFieldArray({
      control,
      name: `workouts.${workoutSessionIndex}.exercises`,
      keyName: 'rhf_esid'
    });

  async function handleDeleteExerciseSession(exerciseSessionIndex: number) {
    removeExerciseSession(exerciseSessionIndex);

    const { exerciseSessionId } = exerciseSessions[exerciseSessionIndex];

    const result = await db.runAsync(
      `DELETE FROM exercise_session WHERE id = ?;`,
      exerciseSessionId
    );

    if (result.changes) {
      showToast({ theme, title: 'Exercise deleted' });
    }
  }

  function handleCopyExercise(exerciseSessionIndex: number) {
    onCopyToClipboard({
      type: 'exerciseSession',
      data: exerciseSessions[exerciseSessionIndex]
    });
    showToast({ theme, title: 'Exercise copied' });
    exerciseModal.dismiss();
  }

  const exerciseModal = useModal();

  const dangerousActionModal = useModal();

  return (
    <Box gap="xl">
      {exerciseSessions.map(
        ({ exerciseName, rhf_esid }, exerciseSessionIndex) => (
          <Box key={rhf_esid} gap="m">
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text
                variant="header3"
                color="primary"
                flex={1}
                numberOfLines={1}
              >
                {exerciseName}
              </Text>
              <Pressable
                onPress={() =>
                  exerciseModal.present({ exerciseName, exerciseSessionIndex })
                }
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
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
                name={
                  `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.exerciseSessionNotes` as const
                }
                placeholder="Add notes..."
              />
              <ExerciseSessionSets
                {...{
                  control,
                  watch,
                  reset,
                  getValues,
                  workoutSessionIndex,
                  exerciseSessionIndex,
                  onAddSet,
                  onRemoveSet,
                  onRemoveWorkoutSession
                }}
                onRemoveExerciseSession={handleDeleteExerciseSession}
              />
            </Box>
          </Box>
        )
      )}

      <Modal
        ref={exerciseModal.ref}
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({ data: { exerciseName, exerciseSessionIndex } }) => (
          <BottomSheetView>
            <Box padding="m" gap="m">
              <Pressable
                onPress={() => handleCopyExercise(exerciseSessionIndex)}
              >
                <MenuItem
                  label={'Copy'}
                  iconLeft={
                    <Ionicons
                      name="copy-outline"
                      color={theme.colors.primary}
                      size={20}
                    />
                  }
                />
              </Pressable>
              {/* <Pressable onPress={() => alert('stats')}> */}
              {/*   <MenuItem */}
              {/*     label={'See exercise stats'} */}
              {/*     iconLeft={ */}
              {/*       <Ionicons */}
              {/*         name="bar-chart-outline" */}
              {/*         color={theme.colors.primary} */}
              {/*         size={20} */}
              {/*       /> */}
              {/*     } */}
              {/*   /> */}
              {/* </Pressable> */}
              <Pressable
                onPress={() =>
                  dangerousActionModal.present({
                    exerciseName,
                    exerciseSessionIndex
                  })
                }
              >
                <MenuItem
                  label={'Delete exercise'}
                  color="destructive"
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
        )}
      </Modal>
      <Modal
        enableDynamicSizing
        title="Delete exercise session?"
        ref={dangerousActionModal.ref}
        index={0}
        snapPoints={[]}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        {({ data: { exerciseName, exerciseSessionIndex } }) => {
          return (
            <BottomSheetView>
              <Box flexDirection="column" gap="m" padding="m">
                <Text color="primary" variant="body">
                  Delete{' '}
                  <Text color="primary" fontWeight={700} variant="body">
                    {exerciseName}
                  </Text>{' '}
                  and all of it's sets?
                </Text>
                <Box flexDirection="row" gap="m">
                  <Box flex={1}>
                    <Button
                      label="Cancel"
                      variant="outline"
                      onPress={dangerousActionModal.dismiss}
                    />
                  </Box>
                  <Box flex={1}>
                    <Button
                      label="Delete"
                      variant="destructive"
                      onPress={() => {
                        handleDeleteExerciseSession(exerciseSessionIndex);
                        exerciseModal.dismiss();
                        dangerousActionModal.dismiss();
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </BottomSheetView>
          );
        }}
      </Modal>
    </Box>
  );
};

export default ExerciseSessions;
