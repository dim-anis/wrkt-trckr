import { Ionicons } from '@expo/vector-icons';
import { Href } from 'expo-router';
import React from 'react';

export type Workout = {
  id: number;
  created_at: string;
};

export type WeightUnit = 'kg' | 'lb' | 'bw';

export type WorkoutSet = {
  id: number;
  exercise_id: number;
  reps: number;
  created_at: string;
  weight: number | null;
  weight_unit: WeightUnit;
  added_resistance: number | null;
  rpe: number | null;
  notes: string | null;
};

export type Exercise = {
  id: number;
  name: string;
  is_compound: boolean;
  category_id: number;
  created_at: string;
};

export type ExerciseCategory = {
  id: number;
  name: string;
};

export type SetWithExerciseData = WorkoutSet & { exerciseName: string } & Omit<
    Exercise,
    'name'
  >;

export type SetWithExerciseAndCategoryData = SetWithExerciseData & {
  categoryName: string;
} & Omit<ExerciseCategory, 'name'>;

export type IoniconsIconName = React.ComponentProps<typeof Ionicons>['name'];

export type TMenuItem = {
  id: string;
  label: string;
  icon?: IoniconsIconName;
  href?: Href;
  menuItems?: TMenuItem[];
};

export type UserSettings = {
  is_metric: number;
  is_dark: number | null;
};

export type TemplateDataItem = {
  templateTitle: string;
  templateSubtitle: string;
  exerciseData: Map<string, SetWithExerciseAndCategoryData[]>;
  sortedCategories: { categoryName: string; count: number }[];
};
