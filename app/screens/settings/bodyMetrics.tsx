import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import { ControlledInput } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Theme } from '@/lib/theme';
import { bodyMetricsSchema, type BodyMetrics } from '@/lib/zodSchemas';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@shopify/restyle';
import { format } from 'date-fns';
import { Stack, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { ControlledSelect } from '@/components/ui/Select';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import {
  Circle,
  Group,
  useFont,
  Text as SkiaText
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
const inter = require('../../../assets/fonts/Inter-Regular.ttf');
const interBold = require('../../../assets/fonts/Inter-Bold.ttf');

export default function BodyMetricsPage() {
  const theme = useTheme<Theme>();
  const db = useSQLiteContext();

  const [weighins, setWeighins] = useState<BodyMetrics[]>([]);

  const { control, reset, handleSubmit, getValues } = useForm<BodyMetrics>({
    resolver: zodResolver(bodyMetricsSchema),
    defaultValues: { weight: 0, weightUnit: 'kg' }
  });

  const weightUnit = getValues('weightUnit');

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

  const { state, isActive } = useChartPressState({
    x: '',
    y: { weight: 0 }
  });

  const chartTitleYValue = useDerivedValue(() => {
    const formattedValue = state.y.weight.value?.value?.toLocaleString();
    return `${formattedValue} ${weightUnit}`;
  }, [state]);

  const chartTitleXValue = useDerivedValue(() => {
    const x = state.x.value?.value;
    const date = new Date(x);
    const formattedValue = date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `${formattedValue}`;
  }, [state]);

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      try {
        const bodyMetrics = await db.getAllAsync<BodyMetrics>(
          `SELECT id, date, weight, weight_unit as weightUnit from weighins ORDER BY date DESC LIMIT 10;`
        );

        if (bodyMetrics) {
          reset(bodyMetrics[0]);
          setWeighins(bodyMetrics);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, []);

  async function onSubmit(formData: BodyMetrics) {
    const { success, data, error } =
      await bodyMetricsSchema.safeParseAsync(formData);

    if (error) {
      console.error(error);
    }

    if (success) {
      const { weight, weightUnit, date } = data;

      const lastWeighinDate = weighins[0].date;
      setWeighins(
        date === lastWeighinDate
          ? [{ weightUnit, weight, date }, ...weighins.slice(1)]
          : [{ weightUnit, weight, date }, ...weighins]
      );

      const result = await db.runAsync(
        `INSERT OR REPLACE INTO weighins (weight, weight_unit, date) VALUES (?, ?, DATE('now'))`,
        weight,
        weightUnit
      );

      if (result.changes) {
        addWeighInModal.dismiss();
      }
    }
  }

  const addWeighInModal = useModal();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Body metrics',
          headerRight: () => (
            <Ionicons
              name="add"
              size={20}
              color={theme.colors.primary}
              onPress={addWeighInModal.present}
            />
          )
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1
        }}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Box padding="m" flex={1} gap="xl">
          {weighins.length > 0 && (
            <Box bg="muted" borderRadius="lg" padding="m">
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box gap="m">
                  <Box gap="xs">
                    <Text variant="header3" fontWeight={500} color="primary">
                      Weight
                    </Text>
                    <Text color="mutedForeground">
                      {format(weighins[0].date, 'MMM d, yyyy')}
                    </Text>
                  </Box>
                  <Text
                    variant="header3"
                    fontWeight={500}
                    color="primary"
                  >{`${weighins[0].weight} ${weighins[0].weightUnit}`}</Text>
                </Box>
                <Button
                  width={50}
                  aspectRatio={1 / 1}
                  onPress={addWeighInModal.present}
                  icon={
                    <Ionicons
                      name="add"
                      size={20}
                      color={theme.colors.primaryForeground}
                    />
                  }
                />
              </Box>
            </Box>
          )}
          <Box height={400}>
            <CartesianChart
              data={weighins}
              xKey={'date'}
              yKeys={['weight']}
              chartPressState={state}
              domainPadding={{ top: 20, bottom: 20, right: 20, left: 20 }}
              xAxis={{
                font: chartFont,
                labelColor,
                lineColor: chartLineColor,
                formatXLabel: label => (label ? format(label, 'MMM d') : '')
              }}
              yAxis={[
                {
                  font: chartFont,
                  labelColor,
                  lineColor: chartLineColor
                }
              ]}
            >
              {({ points, chartBounds }) => {
                return (
                  <>
                    {isActive && state.y.weight.value.value > 0 && (
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
                    <Line
                      points={points.weight}
                      curveType="natural"
                      color={lineColor}
                      strokeWidth={2}
                      animate={{ type: 'timing', duration: 300 }}
                    />
                    {isActive ? (
                      <Circle
                        cx={state.x.position}
                        cy={state.y.weight.position}
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
          <Box gap="m">
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text color="primary" variant="header3">
                Latest weigh-ins
              </Text>
              {/* <Pressable */}
              {/*   onPress={() => */}
              {/*     router.navigate({ */}
              {/*       pathname: '/screens/stats/(tabs)/week' */}
              {/*     }) */}
              {/*   } */}
              {/* > */}
              {/*   <Box flexDirection="row" alignItems="center"> */}
              {/*     <Text color="mutedForeground">See all</Text> */}
              {/*     <Box marginLeft="s"> */}
              {/*       <Ionicons */}
              {/*         name="chevron-forward" */}
              {/*         size={16} */}
              {/*         color={theme.colors.mutedForeground} */}
              {/*       /> */}
              {/*     </Box> */}
              {/*   </Box> */}
              {/* </Pressable> */}
            </Box>
            <Box>
              {weighins.map((entry, idx) => (
                <Box key={idx} flexDirection="row" alignItems="center">
                  <Box
                    bg="muted"
                    width={50}
                    borderRadius="lg"
                    aspectRatio={1 / 1}
                    marginRight="m"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons
                      name="scale-outline"
                      size={25}
                      color={theme.colors.mutedForeground}
                    />
                  </Box>
                  <Box paddingVertical="m">
                    <Box gap="xs">
                      <Text color="mutedForeground" fontSize={16}>
                        {format(entry.date, 'EEEE, MMMM d')}
                      </Text>
                      <Text color="primary" variant="body" fontWeight={500}>
                        {`${entry.weight} ${entry.weightUnit}`}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Modal
            ref={addWeighInModal.ref}
            title={`Add new weigh-in, ${format(new Date(), 'MMM d')}`}
            enableDynamicSizing
            backgroundStyle={{ backgroundColor: theme.colors.background }}
          >
            {({ data: { date } }) => (
              <BottomSheetScrollView>
                <Box padding="m" gap="m">
                  <Box gap="s">
                    <Text variant="inputLabel" color="mutedForeground">
                      Current weight
                    </Text>
                    <Box flexDirection="row" gap="s">
                      <ControlledInput
                        inputMode="numeric"
                        name="weight"
                        alignLabel="left"
                        flex={3}
                        control={control}
                      />
                      <Box flex={1}>
                        <ControlledSelect
                          control={control}
                          name={`weightUnit`}
                          optionsTitle="Weight Input"
                          options={[
                            { label: 'kg', value: 'kg' },
                            { label: 'lb', value: 'lb' }
                          ]}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Text color="mutedForeground">
                    It is best to measure your weight at the same time each day,
                    ideally in the morning.
                  </Text>
                  <Button
                    label="Submit"
                    marginVertical="s"
                    onPress={handleSubmit(onSubmit)}
                  />
                </Box>
              </BottomSheetScrollView>
            )}
          </Modal>
        </Box>
      </ScrollView>
    </>
  );
}
