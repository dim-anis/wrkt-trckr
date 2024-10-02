import { Box } from '@/components/ui/Box';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@shopify/restyle';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable } from 'react-native';
import React from 'react';
import CreateExerciseForm from './create-exercise-form';
import { Exercise } from '@/types';
import UpdateExerciseForm from './update-exercise-form';
import { BottomSheetView } from '@gorhom/bottom-sheet';

type SearchParams = {
  categoryId: string;
  timestamp?: string;
};

export default function SelectExercise() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { categoryId, timestamp } = useLocalSearchParams<SearchParams>();

  const [exercises, setExercises] = React.useState<Exercise[]>([]);

  const {
    ref: createExerciseRef,
    present: presentCreateExerciseModal,
    dismiss: dismissCreateExerciseModal
  } = useModal();

  const {
    ref: editExerciseRef,
    present: presentEditExerciseModal,
    dismiss: dismissEditExerciseModal
  } = useModal();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchExercises = async () => {
        try {
          const result = await db.getAllAsync<Exercise>(
            `SELECT * FROM exercises WHERE category_id = ${categoryId}`
          );

          if (result) {
            setExercises(result);
          }
        } catch (error) {}
      };

      fetchExercises();

      return () => {
        isActive = false;
      };
    }, [db, categoryId])
  );

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select exercise',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Pressable
                onPress={presentCreateExerciseModal}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
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
      <Modal
        enableDynamicSizing
        snapPoints={['60%']}
        title="Create new exercise"
        ref={createExerciseRef}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m">
            <CreateExerciseForm
              dismiss={dismissCreateExerciseModal}
              defaultValues={{ categoryId: Number(categoryId) }}
            />
          </Box>
        </BottomSheetView>
      </Modal>
      <Modal
        enableDynamicSizing
        snapPoints={['60%']}
        title="Edit exercise"
        ref={editExerciseRef}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {exerciseData => (
          <BottomSheetView>
            <Box padding="m">
              <UpdateExerciseForm
                dismiss={dismissEditExerciseModal}
                exerciseData={exerciseData}
              />
            </Box>
          </BottomSheetView>
        )}
      </Modal>

      <Box flex={1}>
        <FlashList
          data={exercises}
          estimatedItemSize={20}
          renderItem={({ item: exercise }) => (
            <Link
              href={{
                pathname: `/screens/selected-exercise`,
                params: {
                  categoryId: categoryId,
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  timestamp
                }
              }}
              asChild
            >
              <Pressable>
                <Box
                  borderColor="secondary"
                  paddingVertical="s"
                  borderBottomWidth={1}
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Text
                    color="primary"
                    fontSize={20}
                    numberOfLines={1}
                    flex={1}
                  >
                    {exercise.name}
                  </Text>
                  <Pressable
                    onPress={() => presentEditExerciseModal(exercise)}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                    <Box paddingHorizontal="s">
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </Box>
                  </Pressable>
                </Box>
              </Pressable>
            </Link>
          )}
        />
      </Box>
    </Box>
  );
}
