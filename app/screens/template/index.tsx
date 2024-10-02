import TemplateList from '@/components/TemplateList';
import { Box } from '@/components/ui/Box';
import { Theme } from '@/lib/theme';
import { countItems, groupSetsByDate, groupSetsByExercise } from '@/lib/utils';
import { SetWithExerciseAndCategoryData, TemplateDataItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Pressable } from 'react-native';

function createWorkoutKey(workout: SetWithExerciseAndCategoryData[]) {
  return [...new Set(workout.map(set => set.exerciseName))].sort().join(',');
}

function createTemplateTitle(
  categories: { categoryName: string; count: number }[],
  firstNCategories = 1
) {
  let [{ categoryName: firstCategoryName }, ...restCategories] = categories;

  const title = restCategories.reduce((title, { categoryName }, idx) => {
    if (idx + 1 < firstNCategories) {
      if (idx + 2 === firstNCategories) {
        title = title + ` & ${categoryName}`;
      } else {
        title = title + `, ${categoryName}`;
      }
    }

    return title;
  }, `${firstCategoryName}`);

  return `${title} Focus`;
}

function getTemplateData(sets: SetWithExerciseAndCategoryData[]) {
  const categories = sets.map(set => set.categoryName);

  const sortedCategories = [...countItems(categories)]
    .map(([category, count]) => ({ categoryName: category, count }))
    .sort((a, b) => b.count - a.count);

  const templateTitle = createTemplateTitle(sortedCategories, 2);
  const exerciseData = groupSetsByExercise(sets);
  const templateSubtitle = [...exerciseData.keys()].join(', ');

  return {
    templateTitle,
    templateSubtitle,
    exerciseData,
    sortedCategories
  };
}

export default function SelectTemplate() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const [sets, setSets] = React.useState<SetWithExerciseAndCategoryData[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getAllAsync<SetWithExerciseAndCategoryData>(
            `SELECT sets.*, exercises.name as exerciseName, exercise_categories.name as categoryName
             FROM sets
             INNER JOIN exercises ON sets.exercise_id = exercises.id
             INNER JOIN exercise_categories ON exercises.category_id = exercise_categories.id
             ;`
          );

          if (result) {
            setSets(result);
          }
        } catch (error) {}
      };

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [db])
  );

  const setsByDate = groupSetsByDate(sets);

  const uniqueSets = [...setsByDate].reduce(
    (templates, [, currWorkoutSets]) => {
      const key = createWorkoutKey(currWorkoutSets);
      const value = templates.get(key);

      if (!value) {
        templates.set(key, [
          {
            templateSets: currWorkoutSets,
            ...getTemplateData(currWorkoutSets)
          }
        ]);
      } else {
        templates.set(key, [
          ...value,
          { templateSets: currWorkoutSets, ...getTemplateData(currWorkoutSets) }
        ]);
      }
      return templates;
    },
    new Map<
      string,
      (TemplateDataItem & { templateSets: SetWithExerciseAndCategoryData[] })[]
    >()
  );

  const templatesSortedByPopularity = [...uniqueSets.entries()].sort(
    ([, setsA], [, setsB]) => setsB.length - setsA.length
  );

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Use template',
          headerRight: () => (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              gap="m"
            >
              <Pressable
                // onPress={presentCreateExerciseModal}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons
                  name="add-circle-outline"
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
      <TemplateList templateData={templatesSortedByPopularity} />
    </Box>
  );
}
