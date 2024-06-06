import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { FontAwesome6 } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView } from 'react-native';

type ExerciseCategories = {
  id: number;
  category: string;
};

export default function SelectCategory() {
  const db = useSQLiteContext();
  const [exerciseCategories, setExerciseCategories] = useState<
    ExerciseCategories[]
  >([]);

  useEffect(() => {
    async function setup() {
      const result = await db.getAllAsync<ExerciseCategories>(
        'SELECT DISTINCT category, id FROM exercises'
      );
      setExerciseCategories(result);
    }

    setup();
  }, []);

  console.log(exerciseCategories);

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Text variant="header" color="primary">
        Select Category
      </Text>

      <Box marginTop="s">
        <ScrollView>
          {exerciseCategories.map(({ id, category }) => (
            <Link
              key={id}
              href={`(screens)/select-category/select-exercise/${category}`}
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
                  <Text color="primary" fontSize={20}>
                    {category}
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
