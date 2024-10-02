import type {
  CalendarProps,
  CalendarTheme
} from '@marceloterreiro/flash-calendar';
import {
  Calendar,
  activeDateRangesEmitter,
  useCalendar
} from '@marceloterreiro/flash-calendar';
import { memo, useEffect, useMemo } from 'react';
import { WorkoutCalendarItemWithContainer } from './WorkoutCalendarItemDayWithContainer';
import { Theme } from '@/lib/theme';
import { useTheme } from '@shopify/restyle';
import { SetWithExerciseData } from '@/types';

const generateTheme = (theme: Theme): CalendarTheme => ({
  rowMonth: {
    content: {
      textAlign: 'left',
      color: theme.colors.mutedForeground,
      fontWeight: '700'
    }
  },
  rowWeek: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.mutedForeground,
      borderStyle: 'solid'
    }
  },
  itemWeekName: { content: { color: theme.colors.mutedForeground } },
  itemDayContainer: {
    activeDayFiller: {
      backgroundColor: theme.colors.primary
    }
  },
  itemDay: {
    idle: ({ isPressed, isWeekend }) => ({
      container: {
        backgroundColor: isPressed ? theme.colors.secondary : 'transparent',
        borderRadius: theme.borderRadii.sm
      },
      content: {
        color: theme.colors.primary
      }
    }),
    today: ({ isPressed }) => ({
      container: {
        borderColor: theme.colors.secondary,
        borderRadius: theme.borderRadii.sm,
        backgroundColor: isPressed ? theme.colors.secondary : 'transparent'
      },
      content: {
        color: isPressed ? theme.colors.primaryForeground : theme.colors.primary
      }
    }),
    active: ({ isEndOfRange, isStartOfRange }) => ({
      container: {
        backgroundColor: theme.colors.primary,
        borderTopLeftRadius: isStartOfRange ? theme.borderRadii.sm : 0,
        borderBottomLeftRadius: isStartOfRange ? theme.borderRadii.sm : 0,
        borderTopRightRadius: isEndOfRange ? theme.borderRadii.sm : 0,
        borderBottomRightRadius: isEndOfRange ? theme.borderRadii.sm : 0
      },
      content: {
        color: theme.colors.primaryForeground
      }
    })
  }
});

const BaseWorkoutCalendar = memo(
  ({
    onCalendarDayPress,

    calendarRowVerticalSpacing = 8,
    calendarRowHorizontalSpacing = 8,
    theme,
    calendarDayHeight = 48,
    calendarMonthHeaderHeight = 20,
    calendarWeekHeaderHeight = calendarDayHeight,
    workoutDayIds,

    ...buildCalendarParams
  }: CalendarProps & { workoutDayIds: Map<string, SetWithExerciseData[]> }) => {
    const { calendarRowMonth, weeksList, weekDaysList } =
      useCalendar(buildCalendarParams);

    return (
      <Calendar.VStack alignItems="center" spacing={calendarRowVerticalSpacing}>
        <Calendar.Row.Month
          height={calendarMonthHeaderHeight}
          theme={theme?.rowMonth}
        >
          {calendarRowMonth}
        </Calendar.Row.Month>
        <Calendar.Row.Week spacing={8} theme={theme?.rowWeek}>
          {weekDaysList.map((weekDay, i) => (
            <Calendar.Item.WeekName
              height={calendarWeekHeaderHeight}
              key={i}
              theme={theme?.itemWeekName}
            >
              {weekDay}
            </Calendar.Item.WeekName>
          ))}
        </Calendar.Row.Week>
        {weeksList.map((week, index) => (
          <Calendar.Row.Week key={index}>
            {week.map(dayProps => {
              if (dayProps.isDifferentMonth) {
                return (
                  <Calendar.Item.Day.Container
                    dayHeight={calendarDayHeight}
                    daySpacing={calendarRowHorizontalSpacing}
                    isStartOfWeek={dayProps.isStartOfWeek}
                    key={dayProps.id}
                    theme={theme?.itemDayContainer}
                  >
                    <Calendar.Item.Empty
                      height={calendarDayHeight}
                      theme={theme?.itemEmpty}
                    />
                  </Calendar.Item.Day.Container>
                );
              }

              return (
                <WorkoutCalendarItemWithContainer
                  workoutDayIds={workoutDayIds}
                  itemTheme={theme?.itemDay}
                  containerTheme={theme?.itemDayContainer}
                  dayHeight={calendarDayHeight}
                  daySpacing={calendarRowHorizontalSpacing}
                  key={dayProps.id}
                  metadata={dayProps}
                  onPress={onCalendarDayPress}
                >
                  {dayProps.displayLabel}
                </WorkoutCalendarItemWithContainer>
              );
            })}
          </Calendar.Row.Week>
        ))}
      </Calendar.VStack>
    );
  }
);

BaseWorkoutCalendar.displayName = 'BaseWorkoutCalendar';

export const WorkoutCalendar = memo(
  ({
    calendarActiveDateRanges,
    calendarMonthId,
    workoutDayIds,
    ...props
  }: CalendarProps & { workoutDayIds: Map<string, SetWithExerciseData[]> }) => {
    const restyleTheme = useTheme<Theme>();
    const generatedTheme = useMemo(
      () => generateTheme(restyleTheme),
      [restyleTheme]
    );

    useEffect(() => {
      activeDateRangesEmitter.emit(
        'onSetActiveDateRanges',
        calendarActiveDateRanges ?? []
      );
    }, [calendarActiveDateRanges, calendarMonthId]);

    return (
      <BaseWorkoutCalendar
        {...props}
        theme={generatedTheme}
        calendarMonthId={calendarMonthId}
        workoutDayIds={workoutDayIds}
      />
    );
  }
);
WorkoutCalendar.displayName = 'WorkoutCalendar';
