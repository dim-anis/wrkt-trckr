import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import { ControlledSelect } from '@/components/ui/Select';
import { Theme } from '@/lib/theme';
import { Exercise, ExerciseCategory, exerciseSchema } from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@shopify/restyle';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable } from 'react-native';
import { Modal, useModal } from '@/components/ui/Modal';
import { BottomSheetView } from '@gorhom/bottom-sheet';

export default function CreateExercise() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { control, reset, handleSubmit } = useForm<Exercise>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {}
  });

  const [exerciseCategories, setExerciseCategories] = useState<
    ExerciseCategory[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchCategories = async () => {
        try {
          const result = await db.getAllAsync<ExerciseCategory>(
            'SELECT id AS categoryId, name AS categoryName FROM exercise_categories;'
          );

          if (result) {
            setExerciseCategories(result);
            reset({
              exerciseName: '',
              exerciseCategoryId: result[0].categoryId,
              isCompound: false
            });
          }
        } catch (error) {}
      };

      fetchCategories();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function onSubmit(formData: Exercise) {
    const { success, data, error } =
      await exerciseSchema.safeParseAsync(formData);

    if (error) {
      console.log(error);
      return;
    }

    const { exerciseName, exerciseCategoryId, isCompound } = data;

    await db.runAsync(
      `INSERT INTO exercises (name, category_id, is_compound) VALUES (?, ?, ?);`,
      exerciseName,
      exerciseCategoryId,
      isCompound ? 1 : 0
    );

    router.back();
  }

  const exerciseTypeInfo = useModal();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create exercise',
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
            label="Exercise name"
            alignLabel="left"
            name="exerciseName"
            control={control}
          />
          <Box gap="s">
            <Text color="mutedForeground">Select category</Text>
            <Box flexDirection="row" gap="s">
              <Box flex={1}>
                <ControlledSelect
                  name="exerciseCategoryId"
                  control={control}
                  options={exerciseCategories.map(
                    ({ categoryId, categoryName }) => ({
                      label: categoryName,
                      value: categoryId!
                    })
                  )}
                  optionsTitle="Select exercise category"
                />
              </Box>
              <Button
                label="Create category"
                variant="secondary"
                paddingVertical="s"
                paddingHorizontal="m"
                icon={
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                }
                onPress={() => {
                  router.navigate({ pathname: '/createCategory' });
                }}
              />
            </Box>
          </Box>

          <Box gap="s">
            <Pressable onPress={exerciseTypeInfo.present}>
              <Box flexDirection="row" alignItems="center" gap="xs">
                <Text variant="inputLabel" color="mutedForeground">
                  Exercise type
                </Text>
                <Ionicons
                  name="help-circle-outline"
                  color={theme.colors.mutedForeground}
                />
              </Box>
            </Pressable>
            <ControlledSelect
              name={'isCompound'}
              control={control}
              placeholder="Select type"
              options={[
                { label: 'Compound (multi-joint movements)', value: true },
                { label: 'Isolation (single-joint movements)', value: false }
              ]}
            />
          </Box>
        </Box>
        <Button
          label="Create exercise"
          marginVertical="s"
          onPress={handleSubmit(onSubmit)}
        />
      </Box>
      <Modal
        ref={exerciseTypeInfo.ref}
        title="About exercise type"
        enableDynamicSizing
        snapPoints={[]}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m" gap="m">
            <Text variant="body" color="primary">
              An isolation exercise targets a{' '}
              <Text variant="body" color="primary" fontWeight={500}>
                single muscle group
              </Text>{' '}
              using only one joint, e.g. bicep curl, leg curl, leg extension.
            </Text>
            <Text variant="body" color="primary">
              A compound exercise engages{' '}
              <Text variant="body" color="primary" fontWeight={500}>
                multiple muscle groups
              </Text>{' '}
              across multiple joints , e.g. barbell squat, bench press, pull-up.
            </Text>
          </Box>
        </BottomSheetView>
      </Modal>
    </>
  );
}
