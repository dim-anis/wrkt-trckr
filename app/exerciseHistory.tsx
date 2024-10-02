import SetList from '@/components/SetList';
import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { WorkoutSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@shopify/restyle';
import { format } from 'date-fns';
import {
  Stack,
  Link as ExpoLink,
  useLocalSearchParams,
  useFocusEffect,
  router
} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Pressable } from 'react-native';

type Params = {
  exerciseId: string;
  exerciseName: string;
};

export default function ExerciseSetsView() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();
  const { exerciseId, exerciseName } = useLocalSearchParams<Params>();

  const [expandedItemId, setExpandedItemId] = React.useState<number>();
  const [sets, setSets] = React.useState<WorkoutSet[]>([]);

  function handleExpandItem(id: number) {
    setExpandedItemId(id === expandedItemId ? undefined : id);
  }

  async function handleCopyToToday(date: string, exerciseId: number) {
    const dateId = toDateId(new Date(date));
    const setsToInsert = setsGroupedByDate.get(dateId)!;

    const statement = setsToInsert.reduce((acc, set) => {
      return acc.concat(
        `INSERT INTO sets (exercise_id, weight, reps) VALUES (${set.exercise_id}, ${set.weight}, ${set.reps});`
      );
    }, '');

    await db.execAsync(statement);

    router.dismissAll();
    router.replace({
      pathname: '/',
      params: { dateId: toDateId(new Date()) }
    });
  }

  const setsGroupedByDate = sets.reduce((result, currSet) => {
    const dateId = toDateId(new Date(currSet.created_at));

    if (!result.has(dateId)) {
      result.set(dateId, [currSet]);
    } else {
      result.set(dateId, [...result.get(dateId)!, currSet]);
    }

    return result;
  }, new Map<string, WorkoutSet[]>());

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getAllAsync<WorkoutSet>(
            `SELECT * FROM sets WHERE exercise_id = ${exerciseId} ORDER BY created_at DESC;`
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
    }, [db, exerciseId])
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Box flexDirection="row" gap="m">
              <ExpoLink href="/calendarView" asChild>
                <Pressable
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons
                    name="stats-chart"
                    color={theme.colors.primary}
                    size={20}
                  />
                </Pressable>
              </ExpoLink>
              <Pressable hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons
                  name="ellipsis-vertical"
                  color={theme.colors.primary}
                  size={20}
                />
              </Pressable>
            </Box>
          ),
          headerTitle: 'Exercise history',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary
        }}
      />
      <Box bg="background" flex={1} padding="m">
        <Box>
          <Text variant="header3" color="primary">
            {exerciseName}
          </Text>
          <Text variant="body" color="mutedForeground">
            Here you will be able to see the details for the particular exercise
            sets
          </Text>
        </Box>
        <FlashList
          estimatedItemSize={50}
          data={[...setsGroupedByDate.entries()]}
          renderItem={({ item: [date, sets], index }) => (
            <Box gap="s">
              <Box
                paddingHorizontal="m"
                paddingVertical="s"
                marginTop="s"
                bg="accent"
                flexDirection="column"
                borderRadius="sm"
              >
                <Box
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Text fontSize={12} color="mutedForeground">
                      {format(date, 'MMM dd')}
                    </Text>
                    <Text variant="body" color="primary">
                      {`${sets[0].weight} kg x ${sets[0].reps} reps`}
                    </Text>
                  </Box>
                  <Pressable
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    onPress={() => handleExpandItem(index)}
                  >
                    <Ionicons
                      name={
                        expandedItemId === index ? 'chevron-up' : 'chevron-down'
                      }
                      color={theme.colors.accentForeground}
                      size={20}
                    />
                  </Pressable>
                </Box>
              </Box>
              {expandedItemId === index && (
                <Box gap="m">
                  <SetList sets={sets} />
                  <Box flex={1} flexDirection="row" gap="s">
                    <Box flex={1}>
                      <Button
                        label="Edit sets"
                        variant="outline"
                        onPress={() => {
                          router.push({
                            pathname: `/screens/selected-exercise`,
                            params: {
                              exerciseId: sets[0].exercise_id,
                              exerciseName,
                              timestamp: toDateId(new Date(sets[0].created_at))
                            }
                          });
                        }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Button
                        label="Copy to today"
                        onPress={() =>
                          handleCopyToToday(
                            sets[0].created_at,
                            sets[0].exercise_id
                          )
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        />
      </Box>
    </>
  );
}
