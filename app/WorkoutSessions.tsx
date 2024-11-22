import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { Workout } from '@/lib/zodSchemas';
import { useTheme } from '@shopify/restyle';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
  useFieldArray
} from 'react-hook-form';
import ExerciseSessions from './ExerciseSessions';
import { showToast } from '@/lib/utils';
import { ControlledInput } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import { Modal, useModal } from '@/components/ui/Modal';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import MenuItem from '@/components/MenuItem';
import Button from '@/components/ui/Button';

type WorkoutSessionProps = {
  control: Control<Workout>;
  watch: UseFormWatch<Workout>;
  reset: UseFormReset<Workout>;
  getValues: UseFormGetValues<Workout>;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onRemoveWorkoutSession: () => void;
};

const WorkoutSessions = ({
  control,
  watch,
  reset,
  getValues,
  onAddSet,
  onRemoveSet,
  onRemoveWorkoutSession
}: WorkoutSessionProps) => {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { fields: workoutSessions, remove: removeWorkoutSession } =
    useFieldArray({
      control,
      name: `workouts`,
      keyName: 'rhf_wid'
    });

  const workoutSessionModal = useModal();
  const dangerousActionModal = useModal();

  async function handleDeleteWorkoutSession(workoutSessionIndex: number) {
    const { workoutId } = workoutSessions[workoutSessionIndex];
    removeWorkoutSession(workoutSessionIndex);

    const result = await db.runAsync(
      `DELETE FROM workouts WHERE id = ?;`,
      workoutId
    );

    if (result.changes) {
      showToast({ theme, title: 'Workout deleted' });
      onRemoveWorkoutSession();
    }
  }

  if (workoutSessions.length === 0) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text color="primary" variant="header3">
          No workouts recorded
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="xl">
      {workoutSessions.map((workout, workoutSessionIndex) => {
        const workoutSessionNamePlaceholder = `Workout #${workoutSessionIndex + 1}`;
        return (
          <Box gap="m" key={workout.rhf_wid}>
            <Box flexDirection="row" alignItems="center">
              <ControlledInput
                flex={1}
                borderWidth={0}
                fontSize={20}
                fontWeight={'500'}
                paddingHorizontal="none"
                control={control}
                name={`workouts.${workoutSessionIndex}.workoutName` as const}
                placeholder={workoutSessionNamePlaceholder}
                color="mutedForeground"
                placeholderTextColor={theme.colors.mutedForeground}
                iconLeft={
                  <Ionicons
                    name="create-outline"
                    color={theme.colors.mutedForeground}
                    size={18}
                  />
                }
              />
              <Ionicons
                name="ellipsis-vertical"
                color={theme.colors.mutedForeground}
                size={18}
                onPress={() =>
                  workoutSessionModal.present({
                    workoutSessionIndex,
                    workoutSessionName:
                      workout.workoutName ?? workoutSessionNamePlaceholder,
                    workoutStart: workout.workoutStart
                  })
                }
              />
            </Box>
            <ExerciseSessions
              {...{
                control,
                watch,
                reset,
                getValues,
                workoutSessionIndex,
                onAddSet,
                onRemoveSet
              }}
              onRemoveWorkoutSession={handleDeleteWorkoutSession}
            />
          </Box>
        );
      })}
      <Modal
        ref={workoutSessionModal.ref}
        title="Workout session"
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {({
          data: { workoutSessionIndex, workoutStart, workoutSessionName }
        }) => (
          <BottomSheetView>
            <Box padding="m" gap="m" flex={1}>
              <Pressable
                onPress={() => {
                  workoutSessionModal.dismiss();

                  router.push({
                    pathname: '/screens/stats/(tabs)/day',
                    params: {
                      dateRangeFrom: workoutStart,
                      workoutIndex: workoutSessionIndex
                    }
                  });
                }}
              >
                <MenuItem
                  label={'See workout stats'}
                  iconLeft={
                    <Ionicons
                      name={'stats-chart-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  }
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  dangerousActionModal.present({
                    workoutSessionIndex,
                    workoutSessionName
                  });
                }}
              >
                <MenuItem
                  label={'Delete workout session'}
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
        )}
      </Modal>
      <Modal
        enableDynamicSizing
        title="Delete workout session?"
        ref={dangerousActionModal.ref}
        index={0}
        snapPoints={[]}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        {({ data: { workoutSessionName, workoutSessionIndex } }) => {
          return (
            <BottomSheetView>
              <Box flexDirection="column" gap="m" padding="m">
                <Text color="primary" variant="body">
                  Delete{' '}
                  <Text color="primary" fontWeight={700} variant="body">
                    {workoutSessionName}
                  </Text>{' '}
                  and all of it's exercises?
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
                        handleDeleteWorkoutSession(workoutSessionIndex);
                        workoutSessionModal.dismiss();
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

export default WorkoutSessions;
