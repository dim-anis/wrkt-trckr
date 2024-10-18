import { SetWithExerciseData, WeightUnit, WorkoutSet } from '@/types';
import { Theme } from '@/lib/theme';
import { showMessage } from 'react-native-flash-message';
import {
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge
} from 'react-hook-form';

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
export function getTotalVolume(sets: WorkoutSet[]) {
  return sets.reduce(
    (totalVolume, set) => totalVolume + set.weight * set.reps,
    0
  );
}

export const getAverageRPE = (sets: WorkoutSet[]) =>
  roundToNearestHalf(
    sets.reduce((total, set) => total + (set.rpe ?? 0), 0) / sets.length
  );

export const calculateExerciseStats = (sets: WorkoutSet[]) => {
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
export function groupSetsByExercise<T extends SetWithExerciseData>(
  sets: T[]
): Map<string, T[]> {
  return sets.reduce((result, currSet) => {
    const exerciseSets = result.get(currSet.exerciseName) || [];
    exerciseSets.push(currSet);

    result.set(currSet.exerciseName, exerciseSets);

    return result;
  }, new Map<string, T[]>());
}

export type GroupedSet<T> = {
  exerciseSessionId: number;
  exerciseId: number;
  weightUnit: WeightUnit;
  exerciseName: string;
  sets: T[];
};

export function groupSetsByExerciseSessionId<T extends SetWithExerciseData>(
  sets: T[]
): GroupedSet<T>[] {
  const grouped: GroupedSet<T>[] = [];

  sets.forEach(currSet => {
    // Check if the last group is the same as the current exercise name
    const lastGroup = grouped[grouped.length - 1];

    if (lastGroup && lastGroup.exerciseName === currSet.exerciseName) {
      // If it's the same exercise, push to the existing group's sets
      lastGroup.sets.push(currSet);
    } else {
      // If it's a new exercise, create a new group
      grouped.push({
        exerciseName: currSet.exerciseName,
        exerciseId: currSet.exercise_id,
        weightUnit: currSet.weight_unit,
        exerciseSessionId: currSet.exerciseSessionId,
        sets: [currSet]
      });
    }
  });

  return grouped;
}

export function groupSetsByDate<T extends WorkoutSet>(
  sets: T[]
): Map<string, T[]> {
  return sets.reduce((result, currSet) => {
    const exerciseSets = result.get(currSet.created_at) || [];
    exerciseSets.push(currSet);

    result.set(currSet.created_at, exerciseSets);

    return result;
  }, new Map<string, T[]>());
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
