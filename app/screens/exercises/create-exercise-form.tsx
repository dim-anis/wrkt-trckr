import { Text } from '@/components/ui/Text';
import { Box } from '@/components/ui/Box';
import { ControlledInput } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSQLiteContext } from 'expo-sqlite';
import { ControlledSelect } from '@/components/ui/Select';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { ExerciseCategory } from '@/types';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { formErrors, showToast } from '@/lib/utils';

type Props = { dismiss: () => void; defaultValues?: Partial<FormType> };

const schema = z.object({
  exerciseName: z
    .string()
    .min(1, { message: formErrors.fieldRequired })
    .max(55, { message: formErrors.nameTooLong(55) }),
  isCompound: z
    .union([
      z.literal(0, { errorMap: () => ({ message: formErrors.yesNoInput }) }),
      z.literal(1, { errorMap: () => ({ message: formErrors.yesNoInput }) })
    ])
    .transform(val => val === 1),
  categoryId: z.coerce.number()
});

type FormType = z.infer<typeof schema>;

export default function AddExerciseForm({ dismiss, defaultValues }: Props) {
  const theme = useTheme<Theme>();

  const db = useSQLiteContext();

  const [exerciseCategories, setExerciseCategories] = React.useState<
    ExerciseCategory[]
  >([]);

  const { control, handleSubmit, getValues } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues
  });

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchCategories = async () => {
        try {
          const result = await db.getAllAsync<ExerciseCategory>(
            'SELECT * FROM exercise_categories'
          );

          if (result) {
            setExerciseCategories(result);
          }
        } catch (error) {}
      };

      fetchCategories();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  function onSubmit(data: FormType) {
    const { exerciseName, categoryId, isCompound } = data;

    db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO exercises (name, is_compound, category_id) VALUES (?, ?, ?);`,
        [exerciseName, isCompound, categoryId]
      );
    });

    showToast({ theme, title: 'Exercise created' });
    dismiss();
  }

  return (
    <Box gap="m">
      <Box gap="s">
        <Text variant="inputLabel" color="primary">
          Exercise name
        </Text>
        <ControlledInput
          name={'exerciseName'}
          control={control}
          inputMode="text"
        />
      </Box>
      <Box gap="s">
        <Text variant="inputLabel" color="primary">
          Select category
        </Text>
        <ControlledSelect
          name={'categoryId'}
          placeholder={
            exerciseCategories.find(
              category => category.id === getValues().categoryId
            )?.name
          }
          control={control}
          options={exerciseCategories.map(category => ({
            label: category.name,
            value: category.id
          }))}
        />
      </Box>
      <Box gap="s">
        <Text variant="inputLabel" color="primary">
          Is it a compound exercise?
        </Text>
        <ControlledSelect
          name={'isCompound'}
          placeholder="Select type"
          control={control}
          options={[
            { label: 'Yes', value: 1 },
            { label: 'No', value: 0 }
          ]}
        />
      </Box>
      <Button label="Submit" onPress={handleSubmit(onSubmit)} />
    </Box>
  );
}
