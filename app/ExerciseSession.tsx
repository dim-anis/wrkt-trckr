import MenuItem from '@/components/MenuItem';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { ControlledInput } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { ControlledSelect } from '@/components/ui/Select';
import { Theme } from '@/lib/theme';
import { showToast, getIconForFormFieldName } from '@/lib/utils';
import { WorkoutSessionWithExercises, Set } from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
  useFieldArray,
  useFormState
} from 'react-hook-form';
import { Pressable } from 'react-native';

type ExerciseSessionProps = {
  control: Control<WorkoutSessionWithExercises>;
  watch: UseFormWatch<WorkoutSessionWithExercises>;
  exerciseIndex: number;
  exerciseName: string;
  onRemoveExercise: (exerciseIndex: number) => void;
  onAddSet: () => void;
  reset: UseFormReset<WorkoutSessionWithExercises>;
  getValues: UseFormGetValues<WorkoutSessionWithExercises>;
};

const ExerciseSession = ({
  control,
  watch,
  exerciseIndex,
  exerciseName,
  reset,
  getValues,
  onRemoveExercise,
  onAddSet
}: ExerciseSessionProps) => {
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

  const dangerousActionModal = useModal();

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
            <Pressable onPress={dangerousActionModal.present}>
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
        ref={dangerousActionModal.ref}
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
                onPress={dangerousActionModal.dismiss}
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

export default ExerciseSession;
