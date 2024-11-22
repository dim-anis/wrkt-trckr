import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { ControlledInput } from '@/components/ui/Input';
import { ControlledSelect } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { getIconForFormFieldName, showToast } from '@/lib/utils';
import {
  Control,
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
  useFieldArray,
  useFormState
} from 'react-hook-form';
import { Workout, Set } from '@/lib/zodSchemas';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { useSQLiteContext } from 'expo-sqlite';

type ExerciseSessionSetsProps = {
  control: Control<Workout>;
  watch: UseFormWatch<Workout>;
  exerciseSessionIndex: number;
  workoutSessionIndex: number;
  reset: UseFormReset<Workout>;
  getValues: UseFormGetValues<Workout>;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onRemoveExerciseSession: (exerciseSessionIndex: number) => void;
  onRemoveWorkoutSession: (workoutSessionIndex: number) => void;
};

export default function ExerciseSessionSets({
  control,
  watch,
  getValues,
  workoutSessionIndex,
  exerciseSessionIndex,
  onAddSet,
  onRemoveSet,
  onRemoveExerciseSession,
  onRemoveWorkoutSession
}: ExerciseSessionSetsProps) {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const {
    fields: exerciseSessionSets,
    append: appendSet,
    remove: removeSet
  } = useFieldArray({
    control,
    name: `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.sets`,
    keyName: 'rhf_es_sid'
  });

  const { errors } = useFormState({ control });

  function handleAppendSet() {
    const exerciseSets = watch(
      `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.sets`
    );

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

  async function onRemove(setIndex: number, exerciseSessionIndex: number) {
    const set = exerciseSessionSets[setIndex];

    const lastExerciseSession =
      getValues(`workouts.${workoutSessionIndex}.exercises`).length === 1;
    const lastExerciseSessionSet = exerciseSessionSets.length === 1;

    if (lastExerciseSessionSet) {
      if (lastExerciseSession) {
        onRemoveWorkoutSession(workoutSessionIndex);
      } else {
        onRemoveExerciseSession(exerciseSessionIndex);
      }
    } else {
      removeSet(setIndex);
      onRemoveSet();

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

  return (
    <>
      {exerciseSessionSets.map((set, setIndex) => {
        const error =
          errors?.workouts?.[workoutSessionIndex]?.exercises?.[
            exerciseSessionIndex
          ]?.sets?.[setIndex];
        const setNumber = setIndex + 1;

        return (
          <Box gap="m" key={set.rhf_es_sid}>
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
                        `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.exerciseSessionWeightUnit` as const
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
                      `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.sets.${setIndex}.weight` as const
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
                          `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.exerciseSessionWeightUnit`
                        )}
                      </Text>
                    }
                  />
                </Box>
                <ControlledInput
                  name={
                    `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.sets.${setIndex}.reps` as const
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
                    `workouts.${workoutSessionIndex}.exercises.${exerciseSessionIndex}.sets.${setIndex}.rpe` as const
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
                onPress={() => onRemove(setIndex, exerciseSessionIndex)}
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
        <Button label="Add set" variant="secondary" onPress={handleAppendSet} />
      </Box>
    </>
  );
}
