import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { Theme } from '@/lib/theme';
import { useTheme } from '@shopify/restyle';
import { Bar, CartesianChart, useChartPressState } from 'victory-native';
import {
  useFont,
  Text as SkiaText,
  LinearGradient,
  vec,
  Group,
  Circle
} from '@shopify/react-native-skia';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  addDays,
  endOfWeek,
  format,
  formatDuration,
  intervalToDuration,
  startOfWeek,
  subDays
} from 'date-fns';
import Badge from '@/components/Badge';
import { WorkoutSession } from '@/lib/zodSchemas';
import { Pressable, ScrollView } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import {
  formatNumber,
  getDefaultDateRange,
  roundToNearestHalf
} from '@/lib/utils';
import { useDerivedValue } from 'react-native-reanimated';
import { Modal, useModal } from '@/components/ui/Modal';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import Button from '@/components/ui/Button';
import { toDateId } from '@marceloterreiro/flash-calendar';
import Separator from '@/components/Separator';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  chartGroupByOptions,
  chartOptions,
  getChartConfigs
} from './chartConfigs';
const inter = require('../../../../assets/fonts/Inter-Regular.ttf');
const interBold = require('../../../../assets/fonts/Inter-Bold.ttf');

type SearchParams = {
  dateRangeFrom?: string;
  dateRangeTo?: string;
};

type Set = WorkoutSession & {
  workoutId: number;
  exerciseName: string;
  exerciseId: number;
  exerciseCategoryName: string;
  exerciseCategoryId: number;
  reps: number;
  rpe: number | null;
  weight: number;
};

type WorkoutStat = {
  volume: number;
  setCount: number;
  avgRpe: number | null;
  totalTime: number;
};

type CategoryStat = {
  volume: number;
  setCount: number;
  avgRpe: number | null;
};

type ExerciseStat = {
  volume: number;
  setCount: number;
  avgRpe: number | null;
};

type Exercise = {
  id: number;
  name: string;
  sets: Set[];
  stats: ExerciseStat;
};

type Category = {
  id: number;
  name: string;
  sets: Set[];
  stats: CategoryStat;
};

type Workout = {
  workoutId: number;
  workoutStart: string;
  workoutStats: WorkoutStat;
  exercises: Exercise[];
  categories: Category[];
};

export default function DayTab() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const chartFont = useFont(inter, 12);
  const chartTitleFont = useFont(interBold, 24);
  const chartSubTitleFont = useFont(interBold, 12);

  const labelColor = `rgb(${theme.colors.chartLabel})`;
  const chartLineColor = `rgba(${theme.colors.chartLine}, 0.4)`;
  const chartColorA = theme.colors.chart_1_rgb;
  const chartColorB = theme.colors.chart_2_rgb;
  const lineColor = `rgb(${chartColorA})`;
  const areaGradientA = [`rgb(${chartColorA})`, `rgba(${chartColorA}, 0.6)`];
  const areaGradientB = [`rgb(${chartColorB})`, `rgba(${chartColorB}, 0.6)`];
  const chartTitleColor = `rgb(${theme.colors.chartTitle})`;
  const chartSubtitleColor = `rgba(${theme.colors.chartTitle}, 0.6)`;

  const { dateRangeFrom } = useLocalSearchParams<SearchParams>();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    getDefaultDateRange('Day')
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sameDayWorkoutIndex, setSameDayWorkoutIndex] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState<
    (typeof chartOptions)[number]
  >(chartOptions[0]);
  const [groupBy, setGroupBy] = useState<(typeof chartGroupByOptions)[number]>(
    chartGroupByOptions[0]
  );

  useFocusEffect(
    useCallback(() => {
      if (dateRangeFrom) {
        setDateRange({
          from: new Date(dateRangeFrom),
          to: new Date(dateRangeFrom)
        });
      }
    }, [dateRangeFrom])
  );

  useEffect(() => {
    let isActive = true;

    const fetchWorkouts = async () => {
      try {
        const workouts = await searchWorkouts();

        if (workouts) {
          setWorkouts(workouts);
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

  function searchWorkouts(): Promise<Workout[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await db.getAllAsync<Set>(
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
              e.name AS exerciseName,
              e.id AS exerciseId,
              ec.name AS exerciseCategoryName,
              ec.id AS exerciseCategoryId,
              s.weight AS weight,
              s.reps AS reps,
              s.rpe AS rpe
          FROM
              calendar
          LEFT JOIN
              workouts w ON DATE(w.created_at) = calendar.day
          LEFT JOIN
              sets s ON w.id = s.workout_id
          LEFT JOIN
              exercises e ON s.exercise_id = e.id
          LEFT JOIN
              exercise_categories ec ON e.category_id = ec.id
          GROUP BY
              calendar.day, s.id
          ORDER BY
              calendar.day;
          `
        );

        const setsGrouped = groupSetsByWorkout(result);

        resolve(setsGrouped);
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
  }, [dateRange]);

  const { state, isActive } = useChartPressState({
    x: '',
    y: { y: 0 }
  });

  const chartTitleYValue = useDerivedValue(() => {
    const formattedValue = state.y.y.value?.value?.toLocaleString();
    return `${formattedValue} ${selectedChartType.unit}`;
  }, [state, selectedChartType.value]);

  const chartTitleXValue = useDerivedValue(() => {
    const formattedValue = state.x.value?.value?.toLocaleString();
    return `${formattedValue}`;
  }, [state]);

  let selectedBar = useDerivedValue(() => {
    return state.matchedIndex.value;
  }).value;

  if (selectedBar < 0) {
    selectedBar = 2;
  }

  const { present: presentVolumeInfoModal, ref: presentVolumeInfoRef } =
    useModal();
  const { present: presentRpeInfoModal, ref: presentRpeInfoRef } = useModal();

  if (workouts.length === 0)
    return (
      <Box bg="background" alignItems="center" justifyContent="center">
        <Text color="mutedForeground">Loading...</Text>
      </Box>
    );

  function handleNextRange() {
    let { from, to } = dateRange;
    setDateRange({ from: addDays(from, 1), to: addDays(to, 1) });
    setSameDayWorkoutIndex(0);
  }

  function handlePrevRange() {
    let { from, to } = dateRange;
    setDateRange({ from: subDays(from, 1), to: subDays(to, 1) });
    setSameDayWorkoutIndex(0);
  }

  function handleNextWorkout() {
    setSameDayWorkoutIndex(i =>
      sameDayWorkoutIndex < workouts.length - 1 ? i + 1 : i
    );
  }

  function handlePrevWorkout() {
    setSameDayWorkoutIndex(i => (sameDayWorkoutIndex > 0 ? i - 1 : i));
  }

  const chartData = workouts[sameDayWorkoutIndex]?.[groupBy.value]?.map(v => ({
    x: v.name,
    y: v.stats[selectedChartType.value]
  }));

  const { domain, domainPadding, formatXLabel, formatYLabel, tickValues } =
    getChartConfigs<
      (typeof chartData)[number],
      keyof (typeof chartData)[number]
    >(chartData, 'y')[selectedChartType.value];

  const workoutsWithoutPlaceholders = workouts.filter(
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
                onPress={() => setDateRange(getDefaultDateRange('Day'))}
              >
                <Text variant="body" color="primary">
                  {`${format(dateRange.from, 'EEEE, MMMM d')}`}
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
          {workouts.length > 1 && (
            <Box flexDirection="row">
              <Button
                width={40}
                variant="outline"
                aspectRatio={'1/1'}
                onPress={handlePrevWorkout}
                icon={
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={
                      theme.colors[
                        sameDayWorkoutIndex === 0
                          ? 'mutedForeground'
                          : 'primary'
                      ]
                    }
                  />
                }
              />
              <Box
                flex={1}
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
              >
                <Text variant="body" fontWeight={500} color="primary">
                  {`Workout #${sameDayWorkoutIndex + 1}`}
                </Text>
                <Text fontSize={12} color="mutedForeground">
                  {`${format(workouts[sameDayWorkoutIndex].workoutStart, 'hh:mm b')}`}
                </Text>
              </Box>
              <Button
                onPress={handleNextWorkout}
                width={40}
                variant="outline"
                aspectRatio={'1/1'}
                icon={
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      theme.colors[
                        sameDayWorkoutIndex < workouts.length - 1
                          ? 'primary'
                          : 'mutedForeground'
                      ]
                    }
                  />
                }
              />
            </Box>
          )}
        </Box>
        <Box flex={1}>
          <Box gap="xxl">
            <Box gap="l">
              <Box flexDirection="row" gap="s" flexWrap="wrap">
                {chartGroupByOptions.map((option, idx) => {
                  const isActive = groupBy.label === option.label;
                  const badgeInactiveStyle = {
                    backgroundColor: 'secondary',
                    borderColor: 'secondary',
                    color: 'secondaryForeground'
                  } as const;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => setGroupBy(chartGroupByOptions[idx])}
                    >
                      <Badge
                        label={option.label}
                        color="primaryForeground"
                        {...(!isActive ? badgeInactiveStyle : {})}
                      />
                    </Pressable>
                  );
                })}
              </Box>
              {workouts.length > 0 ? (
                <Box height={400}>
                  <CartesianChart
                    data={chartData}
                    xKey={'x'}
                    yKeys={['y']}
                    chartPressState={state}
                    domainPadding={domainPadding}
                    domain={domain}
                    xAxis={{
                      font: chartFont,
                      lineColor: chartLineColor,
                      formatXLabel,
                      labelColor
                    }}
                    yAxis={[
                      {
                        font: chartFont,
                        lineColor: chartLineColor,
                        formatYLabel,
                        labelColor,
                        tickValues
                      }
                    ]}
                  >
                    {({ points, chartBounds }) => {
                      return (
                        <>
                          {isActive && state.y.y.value.value > 0 && (
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
                          {points.y.map((p, idx) => {
                            const isActiveBar = idx === selectedBar;
                            return (
                              <Bar
                                key={idx}
                                points={[p]}
                                animate={{ type: 'timing' }}
                                barCount={points.y.length}
                                chartBounds={chartBounds}
                                roundedCorners={{
                                  topLeft: 5,
                                  topRight: 5
                                }}
                              >
                                <LinearGradient
                                  start={vec(0, 0)}
                                  end={vec(0, 400)}
                                  // colors={isActiveBar ? areaGradientB : areaGradientA}
                                  colors={areaGradientA}
                                />
                              </Bar>
                            );
                          })}
                          {isActive ? (
                            <Circle
                              cx={state.x.position}
                              cy={state.y.y.position}
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
                    name="today-outline"
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
                                isActive
                                  ? 'primaryForeground'
                                  : 'secondaryForeground'
                              ]
                            }
                          />
                        }
                      />
                    </Pressable>
                  );
                })}
              </Box>
            </Box>
            <Box flex={1} gap="l">
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text color="primary" variant="header3">
                  This day
                </Text>
                <Pressable
                  onPress={() =>
                    router.navigate({
                      pathname: '/screens/stats/(tabs)/week',
                      params: {
                        dateRangeFrom: toDateId(
                          startOfWeek(dateRange.from, { weekStartsOn: 1 })
                        ),
                        dateRangeTo: toDateId(
                          endOfWeek(dateRange.from, { weekStartsOn: 1 })
                        )
                      }
                    })
                  }
                >
                  <Box flexDirection="row" alignItems="center">
                    <Text color="mutedForeground">See week</Text>
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
              <Box gap="m" flexDirection="column">
                {workoutsWithoutPlaceholders.length > 0 ? (
                  workoutsWithoutPlaceholders.map(
                    ({ workoutStart, workoutStats, exercises }, idx) => {
                      return (
                        <Box key={idx}>
                          <Box
                            gap="xs"
                            bg="secondary"
                            padding="m"
                            borderTopLeftRadius="md"
                            borderTopRightRadius="md"
                          >
                            <Box gap="xs">
                              <Text
                                color="primary"
                                fontSize={18}
                                fontWeight={500}
                              >
                                {`Workout #${idx + 1}`}
                              </Text>
                              <Text color="mutedForeground" fontSize={12}>
                                {format(workoutStart, 'EEE, MMM dd, yyyy')}
                              </Text>
                            </Box>
                            <Separator
                              orientation="horizontal"
                              marginHorizontal="none"
                              backgroundColor="mutedForeground"
                            />
                            <Box flexDirection="row" gap="s">
                              <Box flexDirection="column" gap="xs">
                                <Text color="mutedForeground" fontSize={14}>
                                  Volume
                                </Text>
                                <Text color="primary" fontSize={20}>
                                  {`${formatNumber(Number(workoutStats.volume.toFixed(1)))} kg`}
                                </Text>
                              </Box>
                              <Separator
                                orientation="vertical"
                                backgroundColor="mutedForeground"
                              />
                              {workoutStats.avgRpe !== null &&
                                workoutStats.avgRpe > 0 && (
                                  <>
                                    <Box flexDirection="column" gap="xs">
                                      <Text
                                        color="mutedForeground"
                                        fontSize={14}
                                      >
                                        RPE
                                      </Text>
                                      <Text color="primary" fontSize={20}>
                                        {roundToNearestHalf(
                                          workoutStats.avgRpe
                                        )}
                                      </Text>
                                    </Box>
                                    <Separator
                                      orientation="vertical"
                                      backgroundColor="mutedForeground"
                                    />
                                  </>
                                )}
                              <Box flexDirection="column" gap="xs">
                                <Text color="mutedForeground" fontSize={14}>
                                  Sets
                                </Text>
                                <Text color="primary" fontSize={20}>
                                  {workoutStats.setCount}
                                </Text>
                              </Box>
                              {workoutStats.totalTime > 0 && (
                                <>
                                  <Separator
                                    orientation="vertical"
                                    backgroundColor="mutedForeground"
                                  />
                                  <Box flexDirection="column" gap="xs">
                                    <Text color="mutedForeground" fontSize={14}>
                                      Time
                                    </Text>
                                    <Text color="primary" fontSize={20}>
                                      {formatDuration(
                                        intervalToDuration({
                                          start: 0,
                                          end: workoutStats.totalTime
                                        })
                                      )}
                                    </Text>
                                  </Box>
                                </>
                              )}
                            </Box>
                          </Box>
                          <Box
                            flexDirection="column"
                            padding="m"
                            borderWidth={1}
                            borderColor="secondary"
                            borderTopWidth={0}
                            borderBottomLeftRadius="md"
                            borderBottomRightRadius="md"
                          >
                            <Box flexDirection="row" gap="s">
                              <Box flex={1}>
                                <Text
                                  variant="body"
                                  color="mutedForeground"
                                  fontWeight={500}
                                >
                                  Exercise
                                </Text>
                              </Box>
                              <Box flex={1}>
                                <Text
                                  variant="body"
                                  color="mutedForeground"
                                  fontWeight={500}
                                >
                                  Sets
                                </Text>
                              </Box>
                            </Box>
                            <Separator marginHorizontal="none" />
                            {exercises.map((exercise, idx) => (
                              <Box key={idx}>
                                <Box flexDirection="row" gap="s">
                                  <Box flex={1}>
                                    <Text
                                      variant="body"
                                      color="primary"
                                      numberOfLines={1}
                                    >
                                      {exercise.name}
                                    </Text>
                                  </Box>
                                  <Box flex={1}>
                                    <Text
                                      variant="body"
                                      color="primary"
                                      numberOfLines={1}
                                    >
                                      {exercise.sets
                                        .map(set => `${set.weight}x${set.reps}`)
                                        .join(', ')}
                                    </Text>
                                  </Box>
                                </Box>
                                {idx + 1 < exercises.length && (
                                  <Separator marginHorizontal="none" />
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
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

function groupSetsByWorkout(sets: Set[]): Workout[] {
  const workouts: { [key: number]: Workout } = {};

  sets.forEach(set => {
    const {
      workoutId,
      workoutStart,
      exerciseName,
      exerciseId,
      exerciseCategoryName,
      exerciseCategoryId,
      reps,
      weight,
      rpe
    } = set;

    const setVolume = reps * weight;

    // Initialize workout entry if it doesn't exist
    if (!workouts[workoutId]) {
      workouts[workoutId] = {
        workoutId,
        workoutStart,
        workoutStats: {
          volume: 0,
          setCount: 0,
          avgRpe: null,
          totalTime: 0 // Placeholder: you might calculate totalTime based on actual data
        },
        exercises: [],
        categories: []
      };
    }

    const workout = workouts[workoutId];

    // Update workout-level stats
    workout.workoutStats.volume += setVolume;
    // Workout with id of null are dummy workouts
    workout.workoutStats.setCount += workoutId !== null ? 1 : 0;
    if (rpe !== null) {
      workout.workoutStats.avgRpe =
        workout.workoutStats.avgRpe !== null
          ? (workout.workoutStats.avgRpe * (workout.workoutStats.setCount - 1) +
              rpe) /
            workout.workoutStats.setCount
          : rpe;
    }

    // Find or create exercise entry within the workout
    let exercise = workout.exercises.find(ex => ex.name === exerciseName);
    if (!exercise) {
      exercise = {
        id: exerciseId,
        name: exerciseName,
        sets: [],
        stats: {
          volume: 0,
          setCount: 0,
          avgRpe: null
        }
      };
      workout.exercises.push(exercise);
    }

    // Add set to exercise
    exercise.sets.push(set);

    // Update exercise-level stats
    exercise.stats.volume += setVolume;
    exercise.stats.setCount += workoutId !== null ? 1 : 0;
    if (rpe !== null) {
      exercise.stats.avgRpe =
        exercise.stats.avgRpe !== null
          ? (exercise.stats.avgRpe * (exercise.stats.setCount - 1) + rpe) /
            exercise.stats.setCount
          : rpe;
    }

    // Find or create category entry within the workout
    let category = workout.categories.find(
      cat => cat.name === exerciseCategoryName
    );
    if (!category) {
      category = {
        id: exerciseCategoryId,
        name: exerciseCategoryName,
        sets: [],
        stats: {
          volume: 0,
          setCount: 0,
          avgRpe: null
        }
      };
      workout.categories.push(category);
    }

    // Add set to category
    category.sets.push(set);

    // Update category-level stats
    category.stats.volume += setVolume;
    category.stats.setCount += workoutId !== null ? 1 : 0;
    if (rpe !== null) {
      category.stats.avgRpe =
        category.stats.avgRpe !== null
          ? (category.stats.avgRpe * (category.stats.setCount - 1) + rpe) /
            category.stats.setCount
          : rpe;
    }
  });

  return Object.values(workouts);
}
