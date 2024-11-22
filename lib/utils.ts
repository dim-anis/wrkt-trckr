import { IoniconsIconName } from '@/types';
import { Theme } from '@/lib/theme';
import { showMessage } from 'react-native-flash-message';
import {
  ExerciseSessionWithSets,
  WorkoutSession,
  Set,
  ExerciseSessionWithExercise,
  Exercise
} from './zodSchemas';
import { addDays, endOfWeek, startOfWeek, subDays } from 'date-fns';

export type ValueOf<T> = T[keyof T];

export function getRpeOptionColor(rpeValue: number, theme: Theme) {
  if (rpeValue >= 9) {
    return theme.colors.red;
  }
  if (rpeValue >= 7.5) {
    return theme.colors.orange;
  }
  if (rpeValue >= 6.5) {
    return theme.colors.yellow;
  }

  return theme.colors.green;
}

export function roundToNearestHalf(number: number) {
  return Math.round(number * 2) / 2;
}

// TODO: handle bodyweight exercises
export function getTotalVolume(sets: Set[]) {
  const userWeight = 92;
  return sets.reduce((totalVolume, set) => {
    let setVolume: number;

    // bw exercise
    if (set.weight === null) {
      setVolume = set.addedResistance
        ? (set.addedResistance + userWeight) * set.reps
        : userWeight * set.reps;
    } else {
      // weighted exercise
      setVolume = set.weight * set.reps;
    }
    return totalVolume + setVolume;
  }, 0);
}

export const getAverageRPE = (sets: Set[]) =>
  roundToNearestHalf(
    sets.reduce((total, set) => total + (set.rpe ?? 0), 0) / sets.length
  );

export const calculateExerciseStats = (sets: Set[]) => {
  return { totalVolume: getTotalVolume(sets), averageRPE: getAverageRPE(sets) };
};

type Toast = {
  theme: Theme;
  title: string;
  subtitle?: string;
};

export function showToast({ theme, title, subtitle }: Toast) {
  return showMessage({
    position: 'bottom',
    floating: true,
    message: title,
    description: subtitle,
    type: 'success',
    titleStyle: {
      color: theme.colors.primaryForeground
    },
    textStyle: {
      color: theme.colors.primaryForeground
    },
    style: {
      backgroundColor: theme.colors.primary
    }
  });
}

export function groupSetsByExercise(
  sets: (Set & Exercise)[]
): (Exercise & { sets: Set[] })[] {
  const grouped: (Exercise & { sets: Set[] })[] = [];

  sets.forEach(currSet => {
    // Check if the last group is the same as the current exercise name
    const lastGroup = grouped[grouped.length - 1];

    if (lastGroup && lastGroup.exerciseId === currSet.exerciseId) {
      // If it's the same exercise, push to the existing group's sets
      lastGroup.sets.push(currSet);
    } else {
      // If it's a new exercise, create a new group
      grouped.push({
        exerciseId: currSet.exerciseId,
        exerciseName: currSet.exerciseName,
        sets: [currSet]
      });
    }
  });

  return grouped;
}

export function groupSetsByWorkoutId<T extends WorkoutSession>(
  sets: T[]
): (WorkoutSession & { sets: T[] })[] {
  const grouped: (WorkoutSession & { sets: T[] })[] = [];

  sets.forEach(currSet => {
    // Check if the last group is the same as the current exercise name
    const lastGroup = grouped[grouped.length - 1];

    if (lastGroup && lastGroup.workoutId === currSet.workoutId) {
      // If it's the same exercise, push to the existing group's sets
      lastGroup.sets.push(currSet);
    } else {
      // If it's a new exercise, create a new group
      grouped.push({
        workoutId: currSet.workoutId,
        workoutStart: currSet.workoutStart,
        sets: [currSet]
      });
    }
  });

  return grouped;
}

export function groupSetsByExerciseSessionId(
  sets: (WorkoutSession & ExerciseSessionWithExercise & Set)[]
): ExerciseSessionWithSets[] {
  const grouped: (WorkoutSession & ExerciseSessionWithSets)[] = [];

  sets.forEach(currSet => {
    // Check if the last group is the same as the current exercise name
    const lastGroup = grouped[grouped.length - 1];

    if (
      lastGroup &&
      lastGroup.exerciseSessionId === currSet.exerciseSessionId
    ) {
      // If it's the same exercise, push to the existing group's sets
      lastGroup.sets.push(currSet);
    } else {
      // If it's a new exercise, create a new group
      grouped.push({
        exerciseId: currSet.exerciseId,
        exerciseName: currSet.exerciseName,
        workoutId: currSet.workoutId,
        workoutStart: currSet.workoutStart,
        exerciseSessionWeightUnit: currSet.exerciseSessionWeightUnit,
        exerciseSessionNotes: currSet.exerciseSessionNotes,
        exerciseSessionId: currSet.exerciseSessionId,
        sets: [currSet]
      });
    }
  });

  return grouped;
}

export function countItems<T extends string | number>(items: T[]) {
  return items.reduce((result, currVal) => {
    const itemCount = result.get(currVal);
    if (itemCount) {
      result.set(currVal, itemCount + 1);
    } else {
      result.set(currVal, 1);
    }
    return result;
  }, new Map<T, number>());
}

export const formErrors = {
  yesNoInput: "Please select either 'Yes' or 'No' to proceed",
  fieldRequired: 'This field is required',
  nameTooLong: (maxValue: number) =>
    `Name is too long (maximum is ${maxValue} chars)`,
  exercise: {},
  category: {}
};

export function getIconForFormFieldName(fieldName: string): IoniconsIconName {
  let formIcon: IoniconsIconName;

  switch (fieldName) {
    case 'weight':
      formIcon = 'barbell-outline';
      break;
    case 'rpe':
      formIcon = 'speedometer-outline';
      break;
    case 'reps':
      formIcon = 'repeat-outline';
      break;
    default:
      formIcon = 'alert-circle-outline';
  }

  return formIcon;
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num);
}

export function getFourWeekRange(startDate: Date, direction: 0 | 1 | -1 = 0) {
  const adjustedStart = addDays(startDate, direction * 28);
  const from = subDays(adjustedStart, 27);
  const to = adjustedStart;

  return { from, to };
}

export function getDefaultDateRange(type: 'Day' | 'Week' | '4W') {
  const date = new Date();
  switch (type) {
    case 'Day':
      return { from: date, to: date };
    case 'Week':
      return {
        from: startOfWeek(date, { weekStartsOn: 1 }),
        to: endOfWeek(date, { weekStartsOn: 1 })
      };
    case '4W':
      return getFourWeekRange(date);
    default:
      return {
        from: startOfWeek(date, { weekStartsOn: 1 }),
        to: endOfWeek(date, { weekStartsOn: 1 })
      };
  }
}
