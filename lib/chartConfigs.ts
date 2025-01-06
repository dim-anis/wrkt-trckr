export function getChartConfigs<T, K extends keyof T>(
  chartData: T[],
  yAxisKey: K
) {
  const maxYValue = Math.max(
    ...chartData.map(d => (d[yAxisKey] as unknown as number) || 0)
  );

  function getTickValues(maxYValue: number, stepSize = 1) {
    return Array.from(
      { length: maxYValue / stepSize + 1 },
      (_, i) => i * stepSize
    );
  }

  return {
    volume: {
      tickValues: maxYValue === 0 ? getTickValues(maxYValue, 100) : undefined,
      tickCount: undefined,
      domain: {
        x: [0],
        y: [0]
      },
      formatYLabel: (label: number | null) =>
        label ? (label >= 1000 ? `${label / 1000}k` : `${label}`) : '',
      formatXLabel: (label: string) =>
        label
          ? `${label === label.substring(0, 5) ? label : `${label.substring(0, 5)}...`}`
          : '',
      domainPadding: { top: 60, right: 50, left: 50 }
    },
    avgRpe: {
      tickValues: [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10],
      tickCount: undefined,
      // domain: {
      //   x: [0],
      //   y: [0]
      // },
      domain: undefined,
      formatYLabel: (label: number | null) => (label ? `${label}` : ''),
      formatXLabel: (label: string) =>
        label
          ? `${label === label.substring(0, 5) ? label : `${label.substring(0, 5)}...`}`
          : '',
      domainPadding: { top: 60, right: 50, left: 50 }
    },
    setCount: {
      tickValues: getTickValues(maxYValue, 1),
      tickCount: undefined,
      domain: {
        x: [0],
        y: [0]
      },
      formatYLabel: (label: number | null) => (label ? `${label}` : ''),
      formatXLabel: (label: string) =>
        label
          ? `${label === label.substring(0, 5) ? label : `${label.substring(0, 5)}...`}`
          : '',
      domainPadding: { top: 60, right: 50, left: 50 }
    }
  };
}

export const chartOptions = [
  {
    label: 'Volume',
    value: 'volume',
    unit: 'kg',
    iconName: 'chart-simple'
  },
  { label: 'Sets', value: 'setCount', unit: 'sets', iconName: 'repeat' },
  { label: 'RPE', value: 'avgRpe', unit: 'RPE', iconName: 'gauge' }
] as const;

export type GroupByOption = {
  label: string;
  value: number;
};

export const filterTypeOptions = [
  {
    label: 'Category',
    labelPlural: 'Exercise categories',
    value: 'exercise_categories',
    mainPlaceholder: 'Category',
    secondaryPlaceholder: 'Select category',
    options: [] as GroupByOption[]
  },
  {
    label: 'Exercise',
    labelPlural: 'Exercises',
    value: 'exercises',
    mainPlaceholder: 'Exercise',
    secondaryPlaceholder: 'Select exercise',
    options: [] as GroupByOption[]
  }
];

export const chartGroupByOptions = [
  { label: 'muscle group', value: 'categories' },
  { label: 'exercise', value: 'exercises' }
] as const;
