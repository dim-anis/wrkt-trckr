import {
  Calendar,
  useOptimizedDayMetadata
} from '@marceloterreiro/flash-calendar';
import { Text } from '../ui/Text';
import type {
  CalendarItemDayProps,
  CalendarItemDayWithContainerProps
} from '@marceloterreiro/flash-calendar';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '../ui/Box';
import { SetWithExerciseData } from '@/types';
import { getAverageRPE, getRpeOptionColor } from '@/lib/utils';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/lib/theme';

export const WorkoutCalendarItemWithContainer = ({
  children,
  metadata: baseMetadata,
  onPress,
  theme,
  dayHeight,
  daySpacing,
  itemTheme,
  containerTheme,
  workoutDayIds
}: CalendarItemDayWithContainerProps & {
  itemTheme: CalendarItemDayProps['theme'];
  workoutDayIds: Map<string, SetWithExerciseData[]>;
}) => {
  const metadata = useOptimizedDayMetadata(baseMetadata);
  const restyleTheme = useTheme<Theme>();

  const workoutDay = workoutDayIds.get(metadata.id);
  const workoutDayAvgRpe = workoutDay ? getAverageRPE(workoutDay) : null;

  return (
    <Calendar.Item.Day.Container
      dayHeight={dayHeight}
      daySpacing={daySpacing}
      isStartOfWeek={metadata.isStartOfWeek}
      shouldShowActiveDayFiller={
        metadata.isRangeValid && !metadata.isEndOfWeek
          ? !metadata.isEndOfRange
          : false
      }
      theme={containerTheme}
    >
      <Calendar.Item.Day
        height={dayHeight}
        metadata={metadata}
        onPress={onPress}
        theme={itemTheme}
      >
        <Box justifyContent="center" alignItems="center">
          <Text
            color={
              metadata.state === 'active' ? 'primaryForeground' : 'primary'
            }
          >
            {children}
          </Text>
          {workoutDayIds.has(metadata.id) && (
            <Box flexDirection="row" gap="xxs">
              <Ionicons
                name="ellipse"
                color={
                  workoutDayAvgRpe
                    ? getRpeOptionColor(workoutDayAvgRpe, restyleTheme)
                    : metadata.state === 'active'
                      ? restyleTheme.colors.secondary
                      : restyleTheme.colors.primary
                }
                size={4}
              />
            </Box>
          )}
        </Box>
      </Calendar.Item.Day>
    </Calendar.Item.Day.Container>
  );
};
