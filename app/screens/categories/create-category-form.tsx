import { Text } from '@/components/ui/Text';
import { Box } from '@/components/ui/Box';
import { ControlledInput } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSQLiteContext } from 'expo-sqlite';
import { formErrors, showToast } from '@/lib/utils';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

type Props = { dismiss: () => void };

const schema = z.object({
  categoryName: z
    .string()
    .min(1, { message: formErrors.fieldRequired })
    .max(55, { message: formErrors.nameTooLong(55) })
});

type FormType = z.infer<typeof schema>;

export default function CreateCategoryForm({ dismiss }: Props) {
  const theme = useTheme<Theme>();

  const db = useSQLiteContext();

  const { control, handleSubmit } = useForm<FormType>({
    resolver: zodResolver(schema)
  });

  function onSubmit(data: FormType) {
    const { categoryName } = data;

    db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO exercise_categories (name) VALUES (?);`,
        categoryName
      );
    });

    showToast({ theme, title: 'Category created' });
    dismiss();
  }

  return (
    <Box gap="m">
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
      <Button label="Update" onPress={handleSubmit(onSubmit)} />
    </Box>
  );
}
