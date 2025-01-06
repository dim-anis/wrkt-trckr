import Badge from '@/components/Badge';
import { Card, CardHeader, CardContent } from '@/components/Card';
import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import {
  Circle,
  Group,
  Text as SkiaText,
  useFont
} from '@shopify/react-native-skia';
import {
  formatNumber,
  getDefaultDateRange,
  getFourWeekRange
} from '@/lib/utils';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { LinearGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@shopify/restyle';
import { addDays, format } from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { useModal } from '@/components/ui/Modal';
import { Theme } from '@/lib/theme';
import { useDerivedValue } from 'react-native-reanimated';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { useSQLiteContext } from 'expo-sqlite';
import { Select } from '@/components/ui/Select';
import {
  GroupByOption,
  chartOptions,
  filterTypeOptions,
  getChartConfigs
} from '../../../lib/chartConfigs';
import { UserSettings } from '@/types';
const inter = require('../../../assets/fonts/Inter-Regular.ttf');
const interBold = require('../../../assets/fonts/Inter-Bold.ttf');

type SearchParams = {
  dateRangeFrom: string;
  dateRangeTo: string;
};

type WorkoutSessionWithStats = {
  workoutId: number | null;
  weekStart: string;
  weekEnd: string;
  setCount: number;
  avgRpe: number | null;
  volume: number;
};

export default function MonthTab() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const { dateRangeFrom, dateRangeTo } = useLocalSearchParams<SearchParams>();
  const [{ is_metric }, setUserSettings] = useState<
    Pick<UserSettings, 'is_metric'>
  >({ is_metric: 1 });
  const [workouts, setWorkouts] = useState<WorkoutSessionWithStats[]>([]);
  const [rawWorkouts, setRawWorkouts] = useState<WorkoutSessionWithStats[]>([]);

  const [filterType, setFilterType] = useState<
    (typeof filterTypeOptions)[number]
  >(filterTypeOptions[0]);
  const [filterValue, setFilterValue] = useState<GroupByOption>();
  const [selectedChartType, setSelectedChartType] = useState<
    (typeof chartOptions)[number]
  >(chartOptions[0]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    getDefaultDateRange('4W')
  );

  const { state, isActive } = useChartPressState({
    x: '',
    y: {
      volume: 0,
      setCount: 0,
      avgRpe: 0
    }
  });

  const chartFont = useFont(inter, 12);
  const chartTitleFont = useFont(interBold, 24);
  const chartSubTitleFont = useFont(interBold, 12);

  const labelColor = `rgb(${theme.colors.chartLabel})`;
  const chartLineColor = `rgba(${theme.colors.chartLine}, 0.4)`;
  const chartColorA = theme.colors.chart_1_rgb;
  const chartColorB = theme.colors.chart_2_rgb;
  const areaGradientA = [`rgb(${chartColorA})`, `rgba(${chartColorA}, 0.6)`];
  const areaGradientB = [`rgb(${chartColorB})`, `rgba(${chartColorB}, 0.6)`];
  const lineColor = `rgb(${chartColorA})`;
  const chartTitleColor = `rgb(${theme.colors.chartTitle})`;
  const chartSubtitleColor = `rgba(${theme.colors.chartTitle}, 0.6)`;

  const chartTitleYValue = useDerivedValue(() => {
    const chartTitleUnit =
      selectedChartType.value === 'volume'
        ? is_metric
          ? 'kg'
          : 'lb'
        : selectedChartType.unit;

    const formattedValue =
      state.y[selectedChartType.value].value.value.toLocaleString();
    return `${formattedValue} ${chartTitleUnit}`;
  }, [is_metric, state, selectedChartType.value]);

  const chartTitleXValue = useDerivedValue(() => {
    const weekStart = new Date(state.x.value?.value);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const formattedWeekStart = weekStart.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    const formattedWeekEnd = weekEnd.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedWeekStart} - ${formattedWeekEnd}`;
  }, [state]);

  function handleNextRange() {
    let { to } = dateRange;
    setDateRange(getFourWeekRange(to, 1));
  }

  function handlePrevRange() {
    let { to } = dateRange;
    setDateRange(getFourWeekRange(to, -1));
  }

  useFocusEffect(
    useCallback(() => {
      if (dateRangeFrom && dateRangeTo) {
        setDateRange({
          from: new Date(dateRangeFrom),
          to: new Date(dateRangeTo)
        });
      }
    }, [dateRangeFrom, dateRangeTo])
  );

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const result = await db.getFirstAsync<Pick<UserSettings, 'is_metric'>>(
          `SELECT is_metric from user_settings;`
        );

        if (result) {
          setUserSettings(result);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchUserSettings();
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchWorkouts = async () => {
      try {
        const workouts = await searchWorkouts();

        const rawWorkouts = await db.getAllAsync<WorkoutSessionWithStats>(
          `
          WITH RECURSIVE weekly_calendar AS (
              SELECT 
                  DATE('${toDateId(dateRange.from)}') AS week_start,
                  DATE('${toDateId(dateRange.from)}', '+6 days') AS week_end,
                  1 AS week_number
              UNION ALL
              SELECT
                  DATE(week_start, '+7 day'),
                  DATE(week_end, '+7 day'),
                  week_number + 1
              FROM weekly_calendar
              WHERE week_number < 4
          )

          SELECT
              weekly_calendar.week_start AS weekStart,
              weekly_calendar.week_end AS weekEnd,
              w.id AS workoutId,
          SUM(
              CASE 
                  WHEN es.weight_unit = 'lb' THEN 
                      CASE 
                          WHEN (SELECT is_metric FROM user_settings) = 1 THEN ROUND(s.weight / 2.20462 * 2, 0) / 2
                          ELSE ROUND(s.weight * 2, 0) / 2 
                      END
                  ELSE 
                      CASE 
                          WHEN (SELECT is_metric FROM user_settings) = 0 THEN ROUND(s.weight * 2.20462 * 2, 0) / 2
                          ELSE ROUND(s.weight * 2, 0) / 2
                      END
              END * s.reps
              ) AS volume,
              COALESCE(ROUND(AVG(s.rpe),1), 0) AS avgRpe,
              COALESCE(COUNT(s.weight), 0) AS setCount
          FROM
              weekly_calendar
          LEFT JOIN workouts w
              ON DATE(w.start_time) BETWEEN weekly_calendar.week_start AND weekly_calendar.week_end
              AND DATE(w.start_time) >= DATE('${toDateId(dateRange.from)}')
              AND DATE(w.start_time) <= DATE('${toDateId(dateRange.to)}')
          LEFT JOIN
              sets s ON w.id = s.workout_id
          JOIN exercise_session es ON s.exercise_session_id = es.id
          LEFT JOIN
              exercises ON s.exercise_id = exercises.id
          GROUP BY
              weekly_calendar.week_start
          ORDER BY
              weekly_calendar.week_start;
          `
        );

        const options = await searchOptions(filterType.value);

        if (workouts) {
          setWorkouts(workouts);
        }

        if (rawWorkouts) {
          setRawWorkouts(rawWorkouts);
        }

        if (options) {
          setFilterType({ ...filterType, options });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchWorkouts();

    return () => {
      isActive = false;
    };
  }, [dateRange]);

  function searchOptions(
    groupBy: (typeof filterTypeOptions)[number]['value']
  ): Promise<GroupByOption[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const joinOnFilterType =
          filterType.value === 'exercises'
            ? `JOIN sets ON sets.exercise_id = exercises.id`
            : `JOIN exercises ON exercises.category_id = exercise_categories.id 
               JOIN sets ON sets.exercise_id = exercises.id
              `;

        const result = await db.getAllAsync<GroupByOption>(
          `SELECT DISTINCT ${filterType.value}.id as value, ${filterType.value}.name as label 
           FROM ${groupBy}
           ${joinOnFilterType}
           JOIN workouts ON sets.workout_id = workouts.id
           WHERE DATE(workouts.created_at) BETWEEN DATE('${toDateId(dateRange.from)}') AND DATE('${toDateId(dateRange.to)}');
          `
        );

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    searchOptions(filterType.value)
      .then(options => {
        setFilterType({ ...filterType, options });
      })
      .catch(error => console.error('Error fetching exercises:', error));
  }, [dateRange, filterType.value]);

  function searchWorkouts(): Promise<WorkoutSessionWithStats[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const filterClause = filterValue
          ? `WHERE ${filterType.value}.id = ${filterValue.value}`
          : '';

        const result = await db.getAllAsync<WorkoutSessionWithStats>(
          `
          WITH RECURSIVE weekly_calendar AS (
              SELECT 
                  DATE('${toDateId(dateRange.from)}') AS week_start,
                  DATE('${toDateId(dateRange.from)}', '+6 days') AS week_end,
                  1 AS week_number
              UNION ALL
              SELECT
                  DATE(week_start, '+7 day'),
                  DATE(week_end, '+7 day'),
                  week_number + 1
              FROM weekly_calendar
              WHERE week_number < 4
          )

          SELECT
              weekly_calendar.week_start AS weekStart,
              weekly_calendar.week_end AS weekEnd,
              w.id AS workoutId,
          SUM(
              CASE 
                  WHEN es.weight_unit = 'lb' THEN 
                      CASE 
                          WHEN (SELECT is_metric FROM user_settings) = 1 THEN ROUND(s.weight / 2.20462 * 2, 0) / 2
                          ELSE ROUND(s.weight * 2, 0) / 2 
                      END
                  ELSE 
                      CASE 
                          WHEN (SELECT is_metric FROM user_settings) = 0 THEN ROUND(s.weight * 2.20462 * 2, 0) / 2
                          ELSE ROUND(s.weight * 2, 0) / 2
                      END
              END * s.reps
              ) AS volume,
              COALESCE(ROUND(AVG(s.rpe),1), 0) AS avgRpe,
              COALESCE(COUNT(s.weight), 0) AS setCount
          FROM
              weekly_calendar
          LEFT JOIN workouts w
              ON DATE(w.start_time) BETWEEN weekly_calendar.week_start AND weekly_calendar.week_end
              AND DATE(w.start_time) >= DATE('${toDateId(dateRange.from)}')
              AND DATE(w.start_time) <= DATE('${toDateId(dateRange.to)}')
          LEFT JOIN
              sets s ON w.id = s.workout_id
          JOIN exercise_session es ON s.exercise_session_id = es.id
          LEFT JOIN
              exercises ON s.exercise_id = exercises.id
          ${filterType.value === 'exercises' && filterValue ? filterClause : ''}
          ${filterType.value === 'exercise_categories' ? `LEFT JOIN exercise_categories ON exercises.category_id = exercise_categories.id` : ``}
          ${filterType.value === 'exercise_categories' && filterValue ? filterClause : ''}
          GROUP BY
              weekly_calendar.week_start
          ORDER BY
              weekly_calendar.week_start;
          `
        );

        const weeks = [];
        let weekStart = dateRange.from;
        let weekEnd = addDays(weekStart, 6);
        for (let i = 0; i < 4; i++) {
          weeks.push({
            workoutId: null,
            weekStart,
            weekEnd,
            avgRpe: 0,
            setCount: 0,
            volume: 0
          });

          weekStart = addDays(weekEnd, 1);
          weekEnd = addDays(weekStart, 6);
        }

        const chartData: WorkoutSessionWithStats[] = weeks.map(week => {
          const formattedWeekStart = format(week.weekStart, 'yyyy-MM-dd');
          const formattedWeekEnd = format(week.weekEnd, 'yyyy-MM-dd');
          const workout = result.find(
            item => item.weekStart === formattedWeekStart
          );
          return (
            workout || {
              workoutId: null,
              weekStart: formattedWeekStart,
              weekEnd: formattedWeekEnd,
              avgRpe: 0,
              setCount: 0,
              volume: 0
            }
          );
        });

        resolve(chartData);
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    searchWorkouts()
      .then(results => {
        setWorkouts(results);
      })
      .catch(error => console.error('Error fetching exercises:', error));
  }, [dateRange, filterValue]);

  const { present: presentVolumeInfoModal, ref: presentVolumeInfoRef } =
    useModal();
  const { present: presentRpeInfoModal, ref: presentRpeInfoRef } = useModal();

  const { domain, domainPadding, formatYLabel, tickValues } = getChartConfigs<
    (typeof workouts)[number],
    typeof selectedChartType.value
  >(workouts, selectedChartType.value)[selectedChartType.value];
  const formatXLabel = (label: string) => {
    return label !== undefined ? format(new Date(label), 'MMM d') : '';
  };

  const workoutWeeksWithoutPlaceholders = rawWorkouts.filter(
    workout => workout.workoutId !== null
  );

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1
      }}
      style={{ backgroundColor: theme.colors.background }}
    >
      <Box padding="m" backgroundColor="background" flex={1} gap="xl">
        <Box flexDirection="column" gap="m">
          <Box flexDirection="row">
            <Button
              width={40}
              variant="outline"
              aspectRatio={'1/1'}
              onPress={handlePrevRange}
              icon={
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.colors.primary}
                />
              }
            />
            <Box flex={1} alignItems="center" justifyContent="center">
              <Pressable
                onPress={() => setDateRange(getDefaultDateRange('4W'))}
              >
                <Text variant="body" color="primary">
                  {`${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`}
                </Text>
              </Pressable>
            </Box>
            <Button
              onPress={handleNextRange}
              width={40}
              variant="outline"
              aspectRatio={'1/1'}
              icon={
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.primary}
                />
              }
            />
          </Box>
          <Box flexDirection="row" gap="s">
            <Box flex={1}>
              <Select
                placeholder={filterType.mainPlaceholder}
                value={filterType.value}
                optionsTitle="Filter type"
                options={filterTypeOptions.map(option => ({
                  label: option.label,
                  value: option.value
                }))}
                onSelect={option => {
                  setFilterType(
                    filterTypeOptions.filter(o => o.value === option)[0]
                  );
                  setFilterValue(undefined);
                }}
              />
            </Box>
            <Box flex={1}>
              <Select
                placeholder={filterType.secondaryPlaceholder}
                value={filterValue?.value}
                disabled={filterType.options.length === 0 && true}
                optionsTitle={filterType.labelPlural}
                options={filterType.options}
                onSelect={option => {
                  setFilterValue(
                    filterType.options.filter(o => o.value === option)[0]
                  );
                }}
              />
            </Box>
          </Box>
        </Box>
        {workouts.length > 0 ? (
          <Box height={400}>
            <CartesianChart
              data={workouts}
              xKey={'weekStart'}
              yKeys={[selectedChartType.value]}
              chartPressState={state}
              domain={domain}
              domainPadding={domainPadding}
              xAxis={{
                font: chartFont,
                labelColor,
                lineColor: chartLineColor,
                formatXLabel
              }}
              yAxis={[
                {
                  font: chartFont,
                  labelColor,
                  lineColor: chartLineColor,
                  tickValues,
                  formatYLabel
                }
              ]}
            >
              {({ points, chartBounds }) => {
                return (
                  <>
                    {isActive &&
                      state.y[selectedChartType.value].value.value > 0 && (
                        <Group>
                          <SkiaText
                            x={chartBounds.left + 10}
                            y={24}
                            text={chartTitleYValue}
                            font={chartTitleFont}
                            color={chartTitleColor}
                            style={'fill'}
                          />
                          <SkiaText
                            x={chartBounds.left + 10}
                            y={42}
                            text={chartTitleXValue}
                            font={chartSubTitleFont}
                            color={chartSubtitleColor}
                            style={'fill'}
                          />
                        </Group>
                      )}
                    <Bar
                      points={points[selectedChartType.value]}
                      barCount={points[selectedChartType.value].length}
                      chartBounds={chartBounds}
                      roundedCorners={{
                        topLeft: 5,
                        topRight: 5
                      }}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={areaGradientA}
                      />
                    </Bar>
                    {isActive ? (
                      <Circle
                        cx={state.x.position}
                        cy={state.y[selectedChartType.value].position}
                        r={8}
                        color={lineColor}
                        opacity={0.8}
                      />
                    ) : null}
                  </>
                );
              }}
            </CartesianChart>
          </Box>
        ) : (
          <Box height={400} alignItems="center" justifyContent="center">
            <Text color="primary" variant="header3">
              No workouts recorded
            </Text>
          </Box>
        )}
        <Box flexDirection="row" gap="s" flexWrap="wrap">
          {chartOptions.map((option, idx) => {
            const isActive = selectedChartType.label === option.label;
            const badgeInactiveStyle = {
              backgroundColor: 'secondary',
              borderColor: 'secondary',
              color: 'secondaryForeground'
            } as const;

            return (
              <Pressable
                style={{ flex: 1 }}
                key={idx}
                onPress={() => setSelectedChartType(chartOptions[idx])}
              >
                <Badge
                  label={option.label}
                  paddingVertical="s"
                  color="primaryForeground"
                  {...(!isActive ? badgeInactiveStyle : {})}
                  iconLeft={
                    <FontAwesome6
                      name={option.iconName}
                      size={16}
                      color={
                        theme.colors[
                          isActive ? 'primaryForeground' : 'secondaryForeground'
                        ]
                      }
                    />
                  }
                />
              </Pressable>
            );
          })}
        </Box>
        {workouts.length > 0 && (
          <Box flex={1} gap="m">
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text color="primary" variant="header3">
                This month
              </Text>
              <Pressable>
                <Box flexDirection="row" alignItems="center">
                  <Text color="mutedForeground">See all</Text>
                  <Box marginLeft="s">
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.mutedForeground}
                    />
                  </Box>
                </Box>
              </Pressable>
            </Box>
            <Box gap="s">
              {workoutWeeksWithoutPlaceholders.length > 0 ? (
                workoutWeeksWithoutPlaceholders.map(
                  ({ weekStart, weekEnd, volume, avgRpe, setCount }, idx) => {
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          router.navigate({
                            pathname: '/stats/(tabs)/week',
                            params: {
                              dateRangeFrom: weekStart,
                              dateRangeTo: weekEnd
                            }
                          });
                        }}
                      >
                        <Card>
                          <CardHeader gap="s">
                            <Box
                              flexDirection="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box
                                flex={1}
                                gap="xxs"
                                justifyContent="center"
                                flexDirection="column"
                              >
                                <Text
                                  variant="body"
                                  fontWeight={500}
                                  fontSize={18}
                                  color="primary"
                                >
                                  {`Workout week`}
                                </Text>
                                <Text fontSize={12} color="mutedForeground">
                                  {`${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d')}`}
                                </Text>
                              </Box>
                              <Pressable>
                                <Ionicons
                                  name="ellipsis-vertical"
                                  color={theme.colors.primary}
                                  size={18}
                                />
                              </Pressable>
                            </Box>
                            {/* <CardDescription numberOfLines={2} fontSize={14}> */}
                            {/*   {exerciseSelectionSummary} */}
                            {/* </CardDescription> */}
                          </CardHeader>
                          <CardContent flexDirection="row" gap="s">
                            <Pressable onPress={presentVolumeInfoModal}>
                              <Badge
                                label={`${formatNumber(volume)} ${is_metric ? 'kg' : 'lb'}`}
                                backgroundColor="secondary"
                                borderColor="secondary"
                                color="secondaryForeground"
                                iconLeft={
                                  <FontAwesome6
                                    name="weight-hanging"
                                    size={16}
                                    color={theme.colors.secondaryForeground}
                                  />
                                }
                              />
                            </Pressable>
                            <Pressable onPress={presentVolumeInfoModal}>
                              <Badge
                                label={setCount.toString()}
                                backgroundColor="secondary"
                                borderColor="secondary"
                                color="secondaryForeground"
                                iconLeft={
                                  <FontAwesome6
                                    name="repeat"
                                    size={16}
                                    color={theme.colors.secondaryForeground}
                                  />
                                }
                              />
                            </Pressable>
                            {avgRpe !== null && avgRpe > 0 ? (
                              <Pressable onPress={presentRpeInfoModal}>
                                <Badge
                                  label={avgRpe.toString()}
                                  backgroundColor="secondary"
                                  borderColor="secondary"
                                  color="secondaryForeground"
                                  iconLeft={
                                    <FontAwesome6
                                      name="gauge"
                                      size={16}
                                      color={theme.colors.secondaryForeground}
                                    />
                                  }
                                />
                              </Pressable>
                            ) : null}
                          </CardContent>
                        </Card>
                      </Pressable>
                    );
                  }
                )
              ) : (
                <Text color="mutedForeground" variant="body">
                  No workouts found
                </Text>
              )}
            </Box>
          </Box>
        )}
        <Modal
          ref={presentVolumeInfoRef}
          title="Total Workout Volume"
          enableDynamicSizing
          snapPoints={[]}
          backgroundStyle={{ backgroundColor: theme.colors.background }}
        >
          <BottomSheetView>
            <Box padding="m" gap="m" flex={1}>
              <Text color="primary" variant="body">
                Shows total amount of weight lifted in a workout.
              </Text>
            </Box>
          </BottomSheetView>
        </Modal>
        <Modal
          ref={presentRpeInfoRef}
          title="Average RPE (Rate of Perceived Exertion)"
          enableDynamicSizing
          snapPoints={[]}
          backgroundStyle={{ backgroundColor: theme.colors.background }}
        >
          <BottomSheetView>
            <Box padding="m" gap="m" flex={1}>
              <Text color="primary" variant="body">
                Shows perceive level exerted in a workout. Useful to plan
                training.
              </Text>
            </Box>
          </BottomSheetView>
        </Modal>
      </Box>
    </ScrollView>
  );
}
