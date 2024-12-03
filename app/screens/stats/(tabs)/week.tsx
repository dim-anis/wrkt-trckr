import Badge from '@/components/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/Card';
import { Circle, Group, Text as SkiaText } from '@shopify/react-native-skia';
import { Box } from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { formatNumber, getDefaultDateRange } from '@/lib/utils';
import { WorkoutSession } from '@/lib/zodSchemas';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { LinearGradient, useFont, vec } from '@shopify/react-native-skia';
import { useTheme } from '@shopify/restyle';
import {
  addWeeks,
  eachDayOfInterval,
  format,
  subDays,
  subWeeks
} from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Bar, CartesianChart, useChartPressState } from 'victory-native';
import { useDerivedValue } from 'react-native-reanimated';
import { Select } from '@/components/ui/Select';
import {
  GroupByOption,
  chartOptions,
  filterTypeOptions,
  getChartConfigs
} from './chartConfigs';
const inter = require('../../../../assets/fonts/Inter-Regular.ttf');
const interBold = require('../../../../assets/fonts/Inter-Bold.ttf');

type SearchParams = {
  dateRangeFrom: string;
  dateRangeTo: string;
};

type WorkoutSessionWithStats = WorkoutSession & {
  setCount: number;
  avgRpe: number | null;
  volume: number;
};

export default function WeekTab() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const chartFont = useFont(inter, 12);
  const chartTitleFont = useFont(interBold, 24);
  const chartSubTitleFont = useFont(interBold, 12);

  const labelColor = `rgb(${theme.colors.chartLabel})`;
  const chartLineColor = `rgba(${theme.colors.chartLine}, 0.4)`;
  const chartColorA = theme.colors.chart_1_rgb;
  const lineColor = `rgb(${chartColorA})`;
  const areaGradient = [`rgb(${chartColorA})`, `rgba(${chartColorA}, 0.6)`];
  const chartTitleColor = `rgb(${theme.colors.chartTitle})`;
  const chartSubtitleColor = `rgba(${theme.colors.chartTitle}, 0.6)`;

  const { dateRangeFrom, dateRangeTo } = useLocalSearchParams<SearchParams>();
  const [workouts, setWorkouts] = useState<WorkoutSessionWithStats[]>([]);
  const [rawWorkouts, setRawWorkouts] = useState<
    (WorkoutSessionWithStats & { selectedExercisesString: string })[]
  >([]);
  const [filterType, setFilterType] = useState<
    (typeof filterTypeOptions)[number]
  >(filterTypeOptions[0]);
  const [filterValue, setFilterValue] = useState<GroupByOption>();
  const [selectedChartType, setSelectedChartType] = useState<
    (typeof chartOptions)[number]
  >(chartOptions[0]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    getDefaultDateRange('Week')
  );

  const { state, isActive } = useChartPressState({
    x: '',
    y: {
      volume: 0,
      setCount: 0,
      avgRpe: 0
    }
  });

  const chartTitleYValue = useDerivedValue(() => {
    const formattedValue =
      state.y[selectedChartType.value].value.value.toLocaleString();
    return `${formattedValue} ${selectedChartType.unit}`;
  }, [state, selectedChartType.value]);

  const chartTitleXValue = useDerivedValue(() => {
    const date = new Date(state.x.value?.value);
    const formattedValue = date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedValue}`;
  }, [state]);

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
    let isActive = true;

    const fetchData = async () => {
      try {
        const workouts = await searchWorkouts();
        const options = await searchOptions(filterType.value);

        const rawWorkoutsWithExercises = await db.getAllAsync<
          WorkoutSessionWithStats & { selectedExercisesString: string }
        >(
          `
          WITH RECURSIVE calendar AS (
              SELECT DATE('${toDateId(dateRange.from)}') AS day
              UNION ALL
              SELECT DATE(day, '+1 day')
              FROM calendar
              WHERE day < DATE('${toDateId(dateRange.to)}')
          )

          SELECT
              calendar.day AS workoutStart,
              w.id AS workoutId,
              w.workout_name as workoutName,
              COALESCE(SUM(s.weight * s.reps), 0) AS volume,
              COALESCE(ROUND(AVG(s.rpe),1), 0) AS avgRpe,
              COALESCE(COUNT(s.weight), 0) AS setCount,
              COALESCE((
                      SELECT GROUP_CONCAT(name, ', ')
                      FROM (
                          SELECT DISTINCT exercises.name
                          FROM sets s
                          JOIN exercises ON s.exercise_id = exercises.id
                          WHERE s.workout_id = w.id
                      )
                  ), '') AS selectedExercisesString
          FROM
              calendar
          LEFT JOIN
              workouts w ON DATE(w.start_time) = calendar.day
          LEFT JOIN
              sets s ON w.id = s.workout_id
          LEFT JOIN
              exercises ON s.exercise_id = exercises.id
          GROUP BY
              calendar.day
          ORDER BY
              calendar.day;
          `
        );

        if (workouts) {
          setWorkouts(workouts);
        }
        if (rawWorkoutsWithExercises) {
          setRawWorkouts(rawWorkoutsWithExercises);
        }
        if (options) {
          setFilterType({ ...filterType, options });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

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
          WITH RECURSIVE calendar AS (
              SELECT DATE('${toDateId(dateRange.from)}') AS day
              UNION ALL
              SELECT DATE(day, '+1 day')
              FROM calendar
              WHERE day < DATE('${toDateId(dateRange.to)}')
          )

          SELECT
              calendar.day AS workoutStart,
              w.id AS workoutId,
              COALESCE(SUM(s.weight * s.reps), 0) AS volume,
              COALESCE(ROUND(AVG(s.rpe),1), 0) AS avgRpe,
              COALESCE(COUNT(s.weight), 0) AS setCount
          FROM
              calendar
          LEFT JOIN
              workouts w ON DATE(w.start_time) = calendar.day
          LEFT JOIN
              sets s ON w.id = s.workout_id
          LEFT JOIN
              exercises ON s.exercise_id = exercises.id
          ${filterType.value === 'exercises' && filterValue ? filterClause : ''}
          ${filterType.value === 'exercise_categories' ? `LEFT JOIN exercise_categories ON exercises.category_id = exercise_categories.id` : ``}
          ${filterType.value === 'exercise_categories' && filterValue ? filterClause : ''}
          GROUP BY
              calendar.day
          ORDER BY
              calendar.day;
          `
        );

        const allWeekDays = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to
        });

        const chartData: WorkoutSessionWithStats[] = allWeekDays.map(day => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const workout = result.find(
            item => item.workoutStart === formattedDate
          );
          return (
            workout || {
              workoutId: null,
              workoutStart: formattedDate,
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

  function handleNextRange() {
    let { from, to } = dateRange;
    setDateRange({ from: addWeeks(from, 1), to: addWeeks(to, 1) });
  }

  function handlePrevRange() {
    let { from, to } = dateRange;
    setDateRange({ from: subWeeks(from, 1), to: subWeeks(to, 1) });
  }

  const { domain, domainPadding, formatYLabel, tickValues } = getChartConfigs<
    (typeof workouts)[number],
    typeof selectedChartType.value
  >(workouts, selectedChartType.value)[selectedChartType.value];

  const workoutsWithoutPlaceholders = rawWorkouts.filter(
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
                onPress={() => setDateRange(getDefaultDateRange('Week'))}
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
              {/* TODO: bottomSheet fails to expand on iOS sometimes */}
              <Select
                placeholder={filterType.secondaryPlaceholder}
                value={filterValue?.value}
                optionsTitle={filterType.labelPlural}
                disabled={filterType.options.length === 0 && true}
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
              xKey={'workoutStart'}
              yKeys={[selectedChartType.value]}
              chartPressState={state}
              domain={domain}
              domainPadding={domainPadding}
              xAxis={{
                font: chartFont,
                labelColor,
                lineColor: chartLineColor,
                tickCount: 7,
                formatXLabel: label => (label ? format(label, 'eee') : '')
              }}
              yAxis={[
                {
                  font: chartFont,
                  labelColor,
                  lineColor: chartLineColor,
                  formatYLabel,
                  tickValues
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
                        colors={areaGradient}
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
          <Box
            flex={1}
            flexDirection="column"
            gap="s"
            justifyContent="center"
            alignItems="center"
          >
            <Ionicons
              name="calendar-outline"
              size={50}
              color={theme.colors.mutedForeground}
            />
            <Text color="mutedForeground" variant="header3">
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
        <Box flex={1} gap="l">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text color="primary" variant="header3">
              This week
            </Text>
            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: '/screens/stats/(tabs)/month',
                  params: {
                    dateRangeFrom: toDateId(subDays(dateRange.to, 27)),
                    dateRangeTo: toDateId(dateRange.to)
                  }
                })
              }
            >
              <Box flexDirection="row" alignItems="center">
                <Text color="mutedForeground">See month</Text>
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
          <Box gap="m">
            {workoutsWithoutPlaceholders.length > 0 ? (
              workoutsWithoutPlaceholders.map(
                (
                  {
                    workoutStart,
                    volume,
                    avgRpe,
                    setCount,
                    selectedExercisesString
                  },
                  idx
                ) => {
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        router.navigate({
                          pathname: '/screens/stats/(tabs)/day',
                          params: {
                            dateRangeFrom: workoutStart,
                            dateRangeTo: workoutStart
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
                                {workoutsWithoutPlaceholders[idx].workoutName ??
                                  `${format(workoutStart, 'EEEE')} Workout`}
                              </Text>
                              <Text fontSize={12} color="mutedForeground">
                                {`${format(workoutStart, 'hh:mm b')}`}
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
                          <CardDescription numberOfLines={2} fontSize={14}>
                            {selectedExercisesString}
                          </CardDescription>
                        </CardHeader>
                        <CardContent flexDirection="row" gap="s">
                          <Pressable onPress={presentVolumeInfoModal}>
                            <Badge
                              label={`${formatNumber(volume)} kg`}
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
                              label={`${setCount}`}
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
