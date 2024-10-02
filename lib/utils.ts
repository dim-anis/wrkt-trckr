import { SetWithExerciseData, WorkoutSet } from '@/types';
import { Theme } from '@/lib/theme';
import { showMessage } from 'react-native-flash-message';

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
export function groupSetsByExercise<T extends SetWithExerciseData>(sets: T[]) {
  return sets.reduce((result, currSet) => {
    const exerciseSets = result.get(currSet.exerciseName);
    if (exerciseSets) {
      exerciseSets.push(currSet);
    } else {
      result.set(currSet.exerciseName, [currSet]);
    }
    return result;
  }, new Map<string, T[]>());
}

export function groupSetsByDate<T extends WorkoutSet>(
  sets: T[]
): Map<string, T[]> {
  return sets.reduce((result, currSet) => {
    const exerciseSets = result.get(currSet.created_at);
    if (exerciseSets) {
      exerciseSets.push(currSet);
    } else {
      result.set(currSet.created_at, [currSet]);
    }
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
