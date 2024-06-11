import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { FontAwesome6 } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView } from 'react-native';

type ExerciseCategories = {
  id: number;
  name: string;
};

export default function SelectCategory() {
  const db = useSQLiteContext();
  const [exerciseCategories, setExerciseCategories] = useState<
    ExerciseCategories[]
  >([]);

  useEffect(() => {
    async function setup() {
      const result = await db.getAllAsync<ExerciseCategories>(
        'SELECT * FROM exercise_categories'
      );
      setExerciseCategories(result);
    }

    setup();
  }, []);

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Text variant="header" color="primary">
        Select Category
      </Text>

      <Box marginTop="s">
        <ScrollView>
          {exerciseCategories.map(({ id: categoryId, name: categoryName }) => (
            <Link
              key={categoryId}
              href={`(screens)/categories/${categoryId}`}
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
                  <Text fontSize={20} color="primary">
                    {categoryName}
                  </Text>
                  <FontAwesome6
                    name="ellipsis-vertical"
                    size={20}
                    color="lightblue"
                  />
                </Box>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </Box>
    </Box>
  );
}
