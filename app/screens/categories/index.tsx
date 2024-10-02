import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Modal, useModal } from '@/components/ui/Modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Pressable } from 'react-native';
import { Theme } from '@/lib/theme';
import { FlashList } from '@shopify/flash-list';
import { ExerciseCategory } from '@/types';
import CreateCategoryForm from './create-category-form';
import EditCategoryForm from './edit-category-form';
import { BottomSheetView } from '@gorhom/bottom-sheet';

type SearchParams = {
  timestamp?: string;
};

export default function SelectCategory() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { timestamp } = useLocalSearchParams<SearchParams>();

  const {
    ref: createCategoryRef,
    present: presentCreateCategoryModal,
    dismiss: dismissCreateCategoryModal
  } = useModal();

  const {
    ref: editCategoryRef,
    present: presentEditCategoryModal,
    dismiss: dismissEditCategoryModal
  } = useModal();

  const [exerciseCategories, setExerciseCategories] = React.useState<
    ExerciseCategory[]
  >([]);

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
    }, [])
  );

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Select category',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Pressable
                onPress={presentCreateCategoryModal}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
              <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons
                  name="ellipsis-vertical-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </Box>
          )
        }}
      />
      <Modal
        enableDynamicSizing
        snapPoints={['60%']}
        title="Create category"
        ref={createCategoryRef}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        <BottomSheetView>
          <Box padding="m">
            <CreateCategoryForm dismiss={dismissCreateCategoryModal} />
          </Box>
        </BottomSheetView>
      </Modal>
      <Modal
        title="Edit category"
        snapPoints={['60%']}
        enableDynamicSizing
        ref={editCategoryRef}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {categoryData => (
          <BottomSheetView>
            <Box padding="m">
              <EditCategoryForm
                dismiss={dismissEditCategoryModal}
                categoryData={categoryData}
              />
            </Box>
          </BottomSheetView>
        )}
      </Modal>

      <Box flex={1}>
        <FlashList
          data={exerciseCategories}
          estimatedItemSize={20}
          renderItem={({ item: category }) => (
            <Link
              href={{
                pathname: `/screens/exercises`,
                params: { categoryId: category.id, timestamp }
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
                    fontSize={20}
                    color="primary"
                    flex={1}
                    numberOfLines={1}
                  >
                    {category.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      presentEditCategoryModal({
                        categoryId: category.id,
                        categoryName: category.name
                      })
                    }
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                    <Box paddingHorizontal="s">
                      <Ionicons
                        name="ellipsis-vertical"
                        color={theme.colors.primary}
                        size={20}
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
