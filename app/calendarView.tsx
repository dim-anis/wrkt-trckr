import { WorkoutCalendar } from '@/components/WorkoutCalendar/WorkoutCalendar';
import { Box } from '@/components/ui/Box';
import { Theme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, toDateId } from '@marceloterreiro/flash-calendar';
import { useTheme } from '@shopify/restyle';
import { Stack, Link as ExpoLink, useFocusEffect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { Pressable } from 'react-native';
import { Modal, useModal } from '@/components/ui/Modal';
import WorkoutList from '@/components/WorkoutList';
import Button from '@/components/ui/Button';
import { SetWithExerciseData } from '@/types';
import { groupSetsByDate } from '@/lib/utils';

const today = toDateId(new Date());

export type WorkoutDate = {
  workout_date: string;
};

export default function CalendarView() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const [selectedDate, setSelectedDate] = React.useState(today);
  const [sets, setSets] = React.useState<Map<string, SetWithExerciseData[]>>(
    new Map()
  );

  const { ref, present } = useModal();

  const handleCalendarPress = React.useCallback(
    (date: string) => {
      setSelectedDate(date);
      present(date);
    },
    [present]
  );

  async function handleCopyToToday(date: string) {
    await db.execAsync(
      `INSERT INTO sets (exercise_id,weight,reps,rpe) SELECT exercise_id,weight,reps,rpe FROM sets WHERE DATE(created_at) = '${date}'`
    );

    router.navigate('/');
  }

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchSets = async () => {
        try {
          const result = await db.getAllAsync<SetWithExerciseData>(
            `SELECT sets.*, 
                 date(sets.created_at) AS created_at, 
                 exercises.name AS exerciseName
            FROM sets
            INNER JOIN exercises ON sets.exercise_id = exercises.id;`
          );

          if (result) {
            const setsGroupedByDate = groupSetsByDate(result);
            setSets(setsGroupedByDate);
          }
        } catch (error) {}
      };

      fetchSets();

      return () => {
        isActive = false;
      };
    }, [db])
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
                    name="calendar"
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
          headerTitle: 'WrktTrckr',
          headerStyle: {
            backgroundColor: theme.colors.background
          },
          headerTintColor: theme.colors.primary
        }}
      />
      <Box bg="background" flex={1} justifyContent="center" padding="m">
        <Calendar.List
          calendarActiveDateRanges={[
            {
              startId: selectedDate,
              endId: selectedDate
            }
          ]}
          calendarInitialMonthId={today}
          onCalendarDayPress={handleCalendarPress}
          renderItem={({ item }) => (
            <Box paddingBottom="s">
              <WorkoutCalendar
                workoutDayIds={sets}
                calendarMonthId={item.id}
                {...item.calendarProps}
              />
            </Box>
          )}
        />
      </Box>

      <Modal
        snapPoints={['65%']}
        title="Workout details"
        ref={ref}
        backgroundStyle={{ backgroundColor: theme.colors.background }}
      >
        {data => (
          <Box flex={1} padding="m">
            <WorkoutList
              data={sets.get(data!.data) || []}
              renderedInBottomSheet
            />
            {sets.has(data!.data) && (
              <Button
                label="Copy to today"
                variant="secondary"
                onPress={() => handleCopyToToday(data!.data)}
              />
            )}
          </Box>
        )}
      </Modal>
    </>
  );
}
