import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { ControlledInput, Input } from '@/components/ui/Input';
import { Theme } from '@/lib/theme';
import { Exercise, Template, templateSchema } from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Stack, router } from 'expo-router';
import { useFieldArray, useForm } from 'react-hook-form';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import Badge from '@/components/Badge';
import { Radio } from '@/components/ui/Radio';
import { FlatList } from 'react-native-gesture-handler';
import { zodResolver } from '@hookform/resolvers/zod';

export default function CreateTemplate() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<Template>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      selectedExercises: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selectedExercises'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);

  const toggleExercise = (exercise: Exercise) => {
    const index = fields.findIndex(
      item => item.exerciseId === exercise.exerciseId
    );
    if (index === -1) {
      append({ ...exercise, setCount: 1 });
    } else {
      remove(index);
    }
  };

  async function onSubmit(formData: Template) {
    const { data, error } = await templateSchema.safeParseAsync(formData);

    if (error) {
      console.log(error);
      return;
    }

    const { name, selectedExercises } = data;

    await db.withTransactionAsync(async () => {
      const { lastInsertRowId: templateId } = await db.runAsync(
        `INSERT INTO templates (name) VALUES (?);`,
        name
      );

      for (const { exerciseId, setCount } of selectedExercises) {
        await db.runAsync(
          `INSERT INTO template_exercises (template_id, exercise_id, set_count) VALUES (?, ?, ?);`,
          templateId,
          exerciseId!,
          setCount
        );
      }
    });

    router.back();
  }

  function searchExercises(searchTerm: string): Promise<Exercise[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const exercises = await db.getAllAsync<Exercise>(
          `SELECT exercises.id AS exerciseId, exercises.name AS exerciseName, exercises.is_compound AS isCompound, exercises.category_id AS exerciseCategoryId
           FROM exercises 
           JOIN exercise_categories ec ON exerciseCategoryId = ec.id
           ${searchTerm ? `WHERE exerciseName LIKE ? OR ec.name LIKE ?` : ''}`,
          ...(searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [])
        );

        resolve(exercises);
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    searchExercises(searchTerm)
      .then(results => setFilteredExercises(results))
      .catch(error => console.error('Error fetching exercises:', error));
  }, [searchTerm]);

  const selectExercisesModal = useModal();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create template',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Box hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={20}
                  color={theme.colors.primary}
                />
              </Box>
            </Box>
          )
        }}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1
        }}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Box padding="m" flex={1} justifyContent="space-between">
          <Box gap="l">
            <Box gap="s">
              <Text variant="inputLabel" color="mutedForeground">
                Template name
              </Text>
              <ControlledInput control={control} name="name" />
            </Box>
            <Box gap="s">
              <Text variant="inputLabel" color="mutedForeground">
                Template exercises
              </Text>
              <Box>
                {fields.map(({ id, exerciseName }, idx) => (
                  <Box
                    key={id}
                    paddingVertical="s"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text color="primary" fontSize={18} numberOfLines={1}>
                      {exerciseName}
                    </Text>
                    <Button
                      variant="destructive"
                      aspectRatio={1 / 1}
                      marginLeft="s"
                      icon={
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={theme.colors.destructiveForeground}
                        />
                      }
                      onPress={() => {
                        remove(idx);
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Button
                variant="secondary"
                label="Select exercises"
                icon={
                  <Ionicons
                    name="add-outline"
                    size={20}
                    color={theme.colors.secondaryForeground}
                  />
                }
                onPress={selectExercisesModal.present}
              />

              {errors.selectedExercises && (
                <Text variant="inputLabel" color="destructive">
                  {errors.selectedExercises.message}
                </Text>
              )}
            </Box>
          </Box>
          <Button
            label="Create template"
            marginVertical="s"
            onPress={handleSubmit(onSubmit)}
          />
        </Box>
      </ScrollView>
      <Modal
        ref={selectExercisesModal.ref}
        title="Select exercises"
        snapPoints={['90%']}
        index={1}
        backgroundStyle={{
          backgroundColor: theme.colors.background
        }}
      >
        <BottomSheetView
          style={{
            flex: 1,
            maxHeight: '90%',
            padding: 16,
            gap: 16
          }}
        >
          <Input
            onChangeText={text => setSearchTerm(text)}
            placeholder="Search exercises by name or category..."
            value={searchTerm}
            height={40}
            iconLeft={
              <Ionicons
                name="search-outline"
                color={theme.colors.mutedForeground}
                size={20}
              />
            }
            iconRight={
              searchTerm ? (
                <Pressable onPress={() => setSearchTerm('')}>
                  <Ionicons
                    name="close-circle-outline"
                    color={theme.colors.mutedForeground}
                    size={20}
                  />
                </Pressable>
              ) : undefined
            }
          />
          {fields.length > 0 && (
            <Box gap="s">
              <Text color="mutedForeground">Selected exercises</Text>
              <Box flexDirection="row" gap="xs" flexWrap="wrap">
                {fields.map(({ id, exerciseName }, idx) => (
                  <Badge
                    key={id}
                    label={exerciseName}
                    iconRight={
                      <Pressable
                        hitSlop={{
                          top: 20,
                          bottom: 20,
                          left: 20,
                          right: 20
                        }}
                        onPress={() => remove(idx)}
                      >
                        <Ionicons
                          name={'close'}
                          color={theme.colors.primaryForeground}
                        />
                      </Pressable>
                    }
                  />
                ))}
              </Box>
            </Box>
          )}
          {filteredExercises.length === 0 ? (
            <Box justifyContent="center" alignItems="center" gap="m" flex={1}>
              <Text color="primary" variant="header3">
                No exercises found
              </Text>
              <Button label="Create exercise" paddingHorizontal="m" />
            </Box>
          ) : (
            <Box gap="s" flex={1} justifyContent="space-between">
              <Box gap="s">
                <Text color="mutedForeground">
                  {searchTerm ? 'Search results' : 'All exercises'}
                </Text>
                <FlatList
                  data={filteredExercises}
                  keyExtractor={item => item.exerciseId?.toString()!}
                  renderItem={({ item: exerciseOption }) => {
                    const isExerciseSelected = !!fields.find(
                      selectedExercise =>
                        selectedExercise.exerciseId ===
                        exerciseOption.exerciseId
                    );

                    return (
                      <Pressable
                        delayLongPress={250}
                        onPress={() => {
                          toggleExercise(exerciseOption);
                        }}
                      >
                        <Box
                          borderBottomColor="border"
                          borderBottomWidth={1}
                          flexDirection="row"
                          justifyContent="space-between"
                          alignItems="center"
                          paddingVertical="m"
                          paddingHorizontal="s"
                          bg={isExerciseSelected ? 'secondary' : 'background'}
                        >
                          <Box flexDirection="row" alignItems="center" gap="s">
                            {fields.length > 0 ? (
                              <Radio.Root
                                hitSlop={{
                                  top: 20,
                                  bottom: 20,
                                  left: 20,
                                  right: 20
                                }}
                                checked={isExerciseSelected}
                                onChange={() => toggleExercise(exerciseOption)}
                                flexDirection="row"
                                justifyContent="space-between"
                                accessibilityLabel="radio button"
                              >
                                <Radio.Icon
                                  size={18}
                                  checked={isExerciseSelected}
                                  checkedIcon="checkbox-outline"
                                  uncheckedIcon="square-outline"
                                />
                              </Radio.Root>
                            ) : null}
                            <Text
                              color="primary"
                              fontSize={20}
                              numberOfLines={1}
                              flex={1}
                            >
                              {exerciseOption.exerciseName}
                            </Text>
                          </Box>
                        </Box>
                      </Pressable>
                    );
                  }}
                />
              </Box>
              {fields.length > 0 && (
                <Button
                  label={`Add ${fields.length} exercise(s)`}
                  onPress={selectExercisesModal.dismiss}
                />
              )}
            </Box>
          )}
        </BottomSheetView>
      </Modal>
    </>
  );
}
