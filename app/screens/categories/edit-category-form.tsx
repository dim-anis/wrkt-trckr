import { Text } from '@/components/ui/Text';
import { Box } from '@/components/ui/Box';
import { ControlledInput } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSQLiteContext } from 'expo-sqlite';
import { Modal, useModal } from '@/components/ui/Modal';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';
import { formErrors, showToast } from '@/lib/utils';
import { BottomSheetView } from '@gorhom/bottom-sheet';

type Props = {
  dismiss: () => void;
  categoryData: { data: { categoryName: string; categoryId: number } };
};

const schema = z.object({
  categoryName: z
    .string()
    .min(1, { message: formErrors.fieldRequired })
    .max(55, { message: formErrors.nameTooLong(55) })
});

type FormType = z.infer<typeof schema>;

export default function EditCategoryForm({ dismiss, categoryData }: Props) {
  const {
    data: { categoryId, categoryName }
  } = categoryData;
  const theme = useTheme<Theme>();

  const db = useSQLiteContext();

  const { control, handleSubmit } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryName
    }
  });

  const {
    ref,
    present: presentDangerous,
    dismiss: dismissDangerous
  } = useModal();

  function onSubmit(data: FormType) {
    const { categoryName } = data;

    db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE exercise_categories SET name = ? WHERE id = ?;`,
        [categoryName, categoryId]
      );
    });

    showToast({ theme, title: 'Category updated' });
    dismiss();
  }

  async function handleDelete() {
    await db.runAsync(`DELETE FROM exercise_categories WHERE id = ?;`, [
      categoryId
    ]);

    showToast({ theme, title: 'Category deleted' });
    dismiss();
  }

  return (
    <Box gap="l">
      <Box gap="s">
        <Text variant="inputLabel" color="primary">
          Category name
        </Text>
        <ControlledInput
          name={'categoryName'}
          control={control}
          inputMode="text"
        />
      </Box>

      <Box flexDirection="row" gap="m">
        <Box flexGrow={1}>
          <Button
            label="Delete"
            variant="destructive"
            onPress={presentDangerous}
          />
        </Box>
        <Box flexGrow={1}>
          <Button label="Submit" onPress={handleSubmit(onSubmit)} />
        </Box>
      </Box>

      <Modal
        enableDynamicSizing
        title="Are you absolutely sure?"
        ref={ref}
        index={0}
        snapPoints={[]}
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
