import { IoniconsIconName } from '@/types';
import { Theme } from '@/lib/theme';
import { showMessage } from 'react-native-flash-message';
import {
  ExerciseSessionWithSets,
  WorkoutSession,
  Set,
  ExerciseSessionWithExercise,
  Exercise,
  ExerciseCategory
} from './zodSchemas';
import { addDays, endOfWeek, startOfWeek, subDays } from 'date-fns';
import { Workout } from '@/app/screens/stats/(tabs)/types';

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
        workoutName: currSet.workoutName,
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
        workoutName: currSet.workoutName,
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

export function groupSetsByWorkout(
  sets: (WorkoutSession & Exercise & ExerciseCategory & Set)[]
): Workout[] {
  const workouts: { [key: number]: Workout } = {};

  sets.forEach(set => {
    const {
      workoutId,
      workoutStart,
      workoutName,
      exerciseName,
      exerciseId,
      categoryName,
      categoryId,
      reps,
      weight,
      rpe,
      addedResistance
    } = set;

    const setVolume = weight
      ? reps * weight
      : addedResistance
        ? reps * addedResistance
        : 0;

    // Initialize workout entry if it doesn't exist
    if (!workouts[workoutId]) {
      workouts[workoutId] = {
        workoutId,
        workoutName,
        workoutStart,
        workoutStats: {
          volume: 0,
          setCount: 0,
          avgRpe: null,
          totalTime: 0
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
    let exercise = workout.exercises.find(
      ex => ex.exerciseName === exerciseName
    );
    if (!exercise) {
      exercise = {
        id: exerciseId!,
        exerciseName,
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
      cat => cat.categoryName === categoryName
    );
    if (!category) {
      category = {
        id: categoryId!,
        categoryName,
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
