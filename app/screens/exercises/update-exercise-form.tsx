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
import { Exercise, ExerciseCategory } from '@/types';
import { Modal, useModal } from '@/components/ui/Modal';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { formErrors, showToast } from '@/lib/utils';
import { BottomSheetView } from '@gorhom/bottom-sheet';

type Props = {
  dismiss: () => void;
  exerciseData: { data: Exercise };
};

const schema = z.object({
  exerciseName: z
    .string()
    .min(1, { message: formErrors.fieldRequired })
    .max(55, { message: formErrors.nameTooLong(55) }),
  isCompound: z.union([
    z.literal(0, { errorMap: () => ({ message: formErrors.yesNoInput }) }),
    z.literal(1, { errorMap: () => ({ message: formErrors.yesNoInput }) })
  ]),
  categoryId: z.number()
});

type FormType = z.infer<typeof schema>;

export default function UpdateExerciseForm({ dismiss, exerciseData }: Props) {
  const {
    data: {
      id: exerciseId,
      name: exerciseName,
      category_id: categoryId,
      is_compound: isCompound
    }
  } = exerciseData;
  const db = useSQLiteContext();

  const [exerciseCategories, setExerciseCategories] = React.useState<
    ExerciseCategory[]
  >([]);

  const theme = useTheme<Theme>();
  const {
    ref,
    present: presentDangerous,
    dismiss: dismissDangerous
  } = useModal();

  const { control, handleSubmit } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      exerciseName,
      categoryId,
      isCompound: isCompound ? 1 : 0
    }
  });

  async function handleDelete() {
    await db.runAsync(`DELETE FROM exercises WHERE id = ?;`, [exerciseId]);

    showToast({ theme, title: 'Exercise deleted' });
    dismiss();
  }

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
    const { exerciseName, categoryId, isCompound } = schema.parse(data);

    db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE exercises SET name = ?, is_compound = ?, category_id = ? WHERE id = ?;`,
        [exerciseName, isCompound, categoryId, exerciseId]
      );
    });

    showToast({ theme, title: 'Exercise updated' });
    dismiss();
  }

  return (
    <Box gap="l">
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
            control={control}
            options={[
              { label: 'Yes', value: 1 },
              { label: 'No', value: 0 }
            ]}
          />
        </Box>
      </Box>
      <Box flexDirection="row" gap="m">
        <Box flex={1}>
          <Button
            variant="destructive"
            label="Delete"
            onPress={presentDangerous}
          />
        </Box>
        <Box flex={1}>
          <Button label="Update" onPress={handleSubmit(onSubmit)} />
        </Box>
      </Box>
      <Modal
        enableDynamicSizing
        title="Are you absolutely sure?"
        ref={ref}
        index={0}
        snapPoints={['25%']}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        <BottomSheetView>
          <Box padding="m" flexDirection="row" gap="m">
            <Box flex={1}>
              <Button label="No" variant="outline" onPress={dismissDangerous} />
            </Box>
            <Box flex={1}>
              <Button label="Yes" onPress={handleDelete} />
            </Box>
          </Box>
        </BottomSheetView>
      </Modal>
    </Box>
  );
}
