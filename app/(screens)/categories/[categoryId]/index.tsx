import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { FontAwesome6 } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, useColorScheme } from 'react-native';

type Exercise = {
  id: number;
  name: string;
};

export default function SelectExercise() {
  const colorScheme = useColorScheme();
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const { categoryId } = useLocalSearchParams();

  useEffect(() => {
    async function setup() {
      const result = await db.getAllAsync<Exercise>(
        `SELECT id, name FROM exercises WHERE category_id = ${categoryId}`
      );
      setExercises(result);
    }

    setup();
  }, []);

  return (
    <Box padding="m" backgroundColor="background" flex={1}>
      <Text variant="header" color="primary">
        Select Exercise
      </Text>

      <Box marginTop="s">
        <ScrollView>
          {exercises.map(({ id: exerciseId, name: exerciseName }) => (
            <Link
              key={exerciseId}
              href={`(screens)/categories/${categoryId}/${exerciseId}`}
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
                    {exerciseName}
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
