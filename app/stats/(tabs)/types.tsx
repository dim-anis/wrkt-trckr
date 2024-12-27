import {
  ExerciseCategory,
  ExerciseSessionWithSets,
  Set
} from '@/lib/zodSchemas';

export type Stat = {
  volume: number;
  setCount: number;
  avgRpe: number | null;
};

export type Workout = {
  workoutId: number;
  workoutName: string | null;
  workoutStart: string;
  workoutStats: Stat & { totalTime: number };
  exercises: (ExerciseSessionWithSets & { stats: Stat })[];
  categories: (ExerciseCategory & { sets: Set[] } & { stats: Stat })[];
};
