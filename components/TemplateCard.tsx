import { Pressable } from 'react-native';
import { Box } from './ui/Box';
import { Text } from './ui/Text';

import { Theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Button from './ui/Button';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { SetWithExerciseAndCategoryData } from '@/types';
import { toDateId } from '@marceloterreiro/flash-calendar';
import Badge from './Badge';

type Props = {
  templateTitle: string;
  templateSubtitle: string;
  templateSets: SetWithExerciseAndCategoryData[];
  sortedCategories: {
    categoryName: string;
    count: number;
  }[];
};

export default function TemplateCard({
  templateTitle,
  templateSubtitle,
  templateSets,
  sortedCategories
}: Props) {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();
  const date = templateSets[0].created_at;

  async function handleCopyToToday() {
    await db.runAsync(
      `INSERT INTO sets (exercise_id,weight,reps,rpe) SELECT exercise_id, ?, reps, ? FROM sets WHERE DATE(created_at) = ?`,
      0, // weight
      null, // rpe
      toDateId(new Date(date)) // date
    );

    router.navigate('/');
  }

  return (
    <Box borderWidth={1} borderColor="border" borderRadius="md">
      <Box padding="m" gap="m">
        <Box gap="s">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text variant="header3" color="primary" flex={1}>
              {templateTitle}
            </Text>
            <Pressable>
              <Ionicons
                name="ellipsis-vertical"
                color={theme.colors.primary}
                size={20}
              />
            </Pressable>
          </Box>
          <Box flexDirection="row" gap="s" flexWrap="wrap">
            {sortedCategories.map(({ categoryName }) => (
              <Badge label={categoryName} />
            ))}
          </Box>
          <Text variant="body" color="mutedForeground" numberOfLines={2}>
            {templateSubtitle}
          </Text>
        </Box>
        <Button label="Start workout" onPress={handleCopyToToday} />
      </Box>
    </Box>
  );
}
