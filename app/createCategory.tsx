import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import { Theme } from '@/lib/theme';
import { ExerciseCategory, exerciseCategorySchema } from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@shopify/restyle';
import { Stack, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useForm } from 'react-hook-form';
import { Pressable } from 'react-native';

export default function CreateCategory() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { control, handleSubmit } = useForm<ExerciseCategory>({
    resolver: zodResolver(exerciseCategorySchema),
    defaultValues: {}
  });

  async function onSubmit(formData: ExerciseCategory) {
    const { success, data, error } =
      await exerciseCategorySchema.safeParseAsync(formData);

    if (error) {
      console.log(error);
      return;
    }

    const { categoryName } = data;

    await db.runAsync(
      `INSERT INTO exercise_categories (name) VALUES (?)`,
      categoryName
    );

    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create category',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary,
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              {/* <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}> */}
              {/*   <Ionicons */}
              {/*     name="ellipsis-vertical-outline" */}
              {/*     size={20} */}
              {/*     color={theme.colors.primary} */}
              {/*   /> */}
              {/* </Pressable> */}
            </Box>
          )
        }}
      />

      <Box bg="background" flex={1} padding="m" justifyContent="space-between">
        <Box gap="m">
          <ControlledInput
            label="Category name"
            alignLabel="left"
            name="categoryName"
            control={control}
          />
        </Box>
        <Button
          label="Create category"
          marginVertical="s"
          onPress={handleSubmit(onSubmit)}
        />
      </Box>
    </>
  );
}
