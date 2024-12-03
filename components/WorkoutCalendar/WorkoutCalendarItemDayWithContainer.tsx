import {
  Calendar,
  useOptimizedDayMetadata
} from '@marceloterreiro/flash-calendar';
import { Text } from '../ui/Text';
import type {
  CalendarItemDayProps,
  CalendarItemDayWithContainerProps
} from '@marceloterreiro/flash-calendar';
import { Box } from '../ui/Box';

export const WorkoutCalendarItemWithContainer = ({
  children,
  metadata: baseMetadata,
  onPress,
  dayHeight,
  daySpacing,
  itemTheme,
  containerTheme,
  isWorkoutDay
}: CalendarItemDayWithContainerProps & {
  itemTheme: CalendarItemDayProps['theme'];
  isWorkoutDay: boolean;
}) => {
  const metadata = useOptimizedDayMetadata(baseMetadata);

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
        <Box alignItems="center" justifyContent="center">
          <Text color="primary" marginBottom="xs">
            {children}
          </Text>
          <Box
            bg={isWorkoutDay ? 'primary' : undefined}
            style={{ borderRadius: 50 }}
            width={5}
            aspectRatio={1 / 1}
          ></Box>
        </Box>
      </Calendar.Item.Day>
    </Calendar.Item.Day.Container>
  );
};
