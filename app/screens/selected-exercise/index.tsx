import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams
} from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Keyboard, Pressable, ScrollView } from 'react-native';
import SetList from '@/components/SetList';
import type { WorkoutSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { formErrors, showToast } from '@/lib/utils';
import { ControlledSelect } from '@/components/ui/Select';
import Badge from '@/components/Badge';
import { format } from 'date-fns';

const singleSetSchema = z
  .object({
    weight: z.coerce.number().positive().min(0.5).nullable().default(null),
    reps: z.coerce.number().int().positive().min(1),
    rpe: z.preprocess(
      val => (val === '' ? null : val),
      z.union([z.coerce.number().min(5).max(10), z.null()]).default(null)
    ),
    notes: z.string().nullable().default(null),
    weightUnit: z.enum(['kg', 'lb', 'bw']),
    addedResistance: z
      .preprocess(
        val => (val === '' ? null : val),
        z.union([z.coerce.number().min(0.5), z.null()])
      )
      .default(null)
  })
  .superRefine(({ weight, weightUnit }, ctx) => {
    if (!weight && weightUnit !== 'bw') {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: formErrors.fieldRequired,
        path: ['weight']
      });
    }

    return true;
  });

type FormType = z.infer<typeof singleSetSchema>;

type SearchParams = {
  exerciseId: string;
  exerciseName: string;
  timestamp?: string;
};

export default function AddSet() {
  const db = useSQLiteContext();

  // testing
  const lastUsedIncrements = true;

  const theme = useTheme<Theme>();
  const [sets, setSets] = React.useState<WorkoutSet[]>([]);
  const [selectedSet, setSelectedSet] = React.useState<WorkoutSet | undefined>(
    undefined
  );
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const { exerciseId, exerciseName, timestamp } =
    useLocalSearchParams<SearchParams>();

  const { handleSubmit, control, resetField, setValue, reset, watch } =
    useForm<FormType>({
      resolver: zodResolver(singleSetSchema),
      defaultValues: {
        weightUnit: 'kg'
      }
    });

  const weightUnitValue = watch('weightUnit');

  React.useEffect(() => {
    if (selectedSet) {
      if (weightUnitValue === 'bw') {
        setValue('addedResistance', selectedSet.added_resistance);
        resetField('weight');
      } else {
        setValue('weight', selectedSet.weight);
        resetField('addedResistance');
      }
    } else {
      if (weightUnitValue === 'bw') {
        resetField('weight');
        resetField('addedResistance');
      } else {
        resetField('addedResistance');
      }
    }
  }, [selectedSet, weightUnitValue, setValue, resetField]);

  async function handleDelete() {
    if (selectedSet) {
      await db.runAsync(`DELETE FROM sets WHERE id = ?;`, [selectedSet.id]);

      setSets(sets.filter(set => selectedSet.id !== set.id));
      setSelectedSet(undefined);

      Keyboard.dismiss();

      showToast({ theme, title: 'Set deleted' });
    }
  }

  async function handleUpdate(formData: FormType) {
    const { success, data } = await singleSetSchema.safeParseAsync(formData);

    if (success) {
      const { weight, reps, rpe, addedResistance, notes } = data;

      if (selectedSet) {
        const updatedSet: WorkoutSet = {
          ...selectedSet,
          weight,
          reps,
          rpe,
          notes,
          added_resistance: addedResistance
        };

        setSelectedSet(updatedSet);

        await db.runAsync(
          `UPDATE sets SET weight = ?, reps = ?, added_resistance = ?, rpe = ?, notes = ? WHERE id = ?;`,
          [weight, reps, addedResistance, rpe, notes, selectedSet.id]
        );

        setSets(
          sets.map(set => (set.id === selectedSet.id ? updatedSet : set))
        );
        setSelectedSet(undefined);

        Keyboard.dismiss();

        showToast({ theme, title: 'Set updated' });
      }
    }
  }

  React.useEffect(() => {
    if (selectedSet) {
      const { weight, reps, rpe, notes, added_resistance } = selectedSet;
      reset({
        weight,
        reps,
        rpe,
        notes,
        weightUnit: weight ? 'kg' : 'bw',
        addedResistance: added_resistance
      });
    } else {
      reset();
    }
  }, [selectedSet, setValue, reset]);

  async function onSubmit(formData: FormType) {
    const { success, data } = await singleSetSchema.safeParseAsync(formData);

    if (success) {
      const { weight, reps, rpe, notes, addedResistance } = data;

      db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO sets (exercise_id, weight, reps, added_resistance, rpe, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            exerciseId!,
            weight,
            reps,
            addedResistance,
            rpe,
            notes,
            timestamp
              ? format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
              : format(new Date(), 'yyyy-MM-dd HH:mm')
          ]
        );

        setIsSubmitted(true);
        resetField('notes');

        Keyboard.dismiss();

        showToast({ theme, title: 'Set created' });
      });
    } else {
      showToast({ theme, title: 'Failed to create a set' });
    }
  }

  async function onSelectSet(set: WorkoutSet | undefined) {
    setSelectedSet(set);
  }

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function fetchSets() {
        const result = await db.getAllAsync<WorkoutSet>(
          `SELECT * FROM sets WHERE exercise_id = ${exerciseId} AND DATE(created_at) = '${timestamp ? toDateId(new Date(timestamp)) : toDateId(new Date())}';`
        );

        setSets(result);
        setIsSubmitted(false);
      }

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [isSubmitted])
  );

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: exerciseName,
          headerRight: () => (
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap="m"
            >
              <Pressable
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => {
                  router.push({
                    pathname: `/exerciseHistory`,
                    params: {
                      exerciseId,
                      exerciseName
                    }
                  });
                }}
              >
                <Ionicons
                  name="timer-outline"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
              <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
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
      <ScrollView keyboardShouldPersistTaps="handled">
        <Box gap="l" marginVertical="s">
          <Box gap="m">
            <Box gap="s">
              <Text variant="inputLabel" color="primary">
                {weightUnitValue === 'bw' ? 'Added resistance' : 'Weight'}
              </Text>
              <Box flexDirection="row" gap="s">
                <Box flex={3}>
                  {weightUnitValue === 'bw' ? (
                    <ControlledInput
                      name={'addedResistance'}
                      control={control}
                      inputMode="numeric"
                      keyboardType="numeric"
                    />
                  ) : (
                    <ControlledInput
                      name={'weight'}
                      control={control}
                      inputMode="numeric"
                      keyboardType="numeric"
                    />
                  )}
                </Box>
                <Box flex={1}>
                  <ControlledSelect
                    name={'weightUnit'}
                    control={control}
                    onClick={Keyboard.dismiss}
                    options={[
                      { label: 'KG', value: 'kg' },
                      { label: 'LB', value: 'lb' },
                      { label: 'BW (Bodyweight)', value: 'bw' }
                    ]}
                  />
                </Box>
              </Box>
            </Box>
            {lastUsedIncrements && (
              <Box flexDirection="row" gap="s">
                <Badge label={'20 kg'} />
                <Badge label={'10 kg'} />
                <Badge label={'5 kg'} />
              </Box>
            )}
          </Box>
          <ControlledInput
            name={'reps'}
            label="Repetitions"
            control={control}
            inputMode="numeric"
            keyboardType="numeric"
          />
          <ControlledInput
            name={'rpe'}
            label="RPE"
            control={control}
            inputMode="numeric"
            keyboardType="numeric"
          />
          <ControlledInput
            height={80}
            name={'notes'}
            label="Notes"
            inputMode="text"
            control={control}
            textAlignVertical="top"
            multiline={true}
            numberOfLines={5}
          />
        </Box>
        <Box marginTop="s">
          {typeof selectedSet === 'undefined' ? (
            <Button label="Add set" onPress={handleSubmit(onSubmit)} />
          ) : (
            <Box flexDirection="row" gap="m" flex={1}>
              <Box flex={1}>
                <Button
                  label="Delete"
                  variant="destructive"
                  onPress={handleDelete}
                />
              </Box>
              <Box flex={1}>
                <Button label="Update" onPress={handleSubmit(handleUpdate)} />
              </Box>
            </Box>
          )}
        </Box>

        {sets.length ? (
          <Box gap="m" marginTop="l">
            <Text variant="header2" color="primary">
              Recorded sets
            </Text>
            <SetList
              sets={sets}
              selectedSet={selectedSet}
              onSetSelected={onSelectSet}
            />
          </Box>
        ) : null}
      </ScrollView>
    </Box>
  );
}
