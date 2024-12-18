import { z } from 'zod';

export const setSchema = z.object({
  id: z.number().optional(),
  exerciseId: z.number().optional(),
  createdAt: z.string(),
  weight: z.preprocess(
    val => (val === '' ? null : val),
    z.coerce.number().positive().min(0.5).nullable()
  ),
  reps: z.preprocess(
    val => (val === '' ? undefined : val),
    z.coerce.number().int().positive().min(1)
  ),
  rpe: z
    .preprocess(
      val => (val === '' ? null : val),
      z.union([z.coerce.number().min(5).max(10), z.null()])
    )
    .default(null),
  addedResistance: z
    .preprocess(
      val => (val === '' ? null : val),
      z.union([z.coerce.number().min(0.5), z.null()])
    )
    .default(null)
});

export const exerciseSchema = z.object({
  exerciseName: z.string().min(1),
  exerciseId: z.number().optional(),
  isCompound: z
    .union([z.literal(0), z.literal(1)])
    .transform(val => val === 1)
    .or(z.boolean()),
  exerciseCategoryId: z.number(),
  createdAt: z.string().optional()
});

export const exerciseSessionSchema = z.object({
  exerciseSessionNotes: z
    .preprocess(val => (val === '' ? null : val), z.string().nullable())
    .default(null),
  exerciseSessionId: z.number(),
  exerciseSessionWeightUnit: z.enum(['kg', 'lb', 'bw'])
});

export const exerciseSessionWithExercise =
  exerciseSessionSchema.merge(exerciseSchema);

export const exerciseCategorySchema = z.object({
  categoryName: z.string().min(1),
  categoryId: z.number().optional()
});

export const exerciseSessionWithSetsSchema = exerciseSessionSchema
  .merge(exerciseSchema)
  .extend({
    sets: z.array(setSchema)
  });

export const workoutSessionSchema = z.object({
  workoutId: z.number(),
  workoutName: z
    .preprocess(val => (val === '' ? null : val), z.string().nullable())
    .default(null),
  workoutStart: z.string(),
  workoutEnd: z
    .preprocess(
      val => (val === '' ? null : val),
      z.union([z.string(), z.null()])
    )
    .default(null)
});

export const workoutSessionWithExercisesSchema = workoutSessionSchema.extend({
  exercises: z.array(exerciseSessionWithSetsSchema)
});

export const workoutSchema = z.object({
  workouts: z.array(workoutSessionWithExercisesSchema)
});
export type Workout = z.infer<typeof workoutSchema>;

export type ExerciseCategory = z.infer<typeof exerciseCategorySchema>;
export type Set = z.infer<typeof setSchema>;
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type WorkoutSessionWithExercises = z.infer<
  typeof workoutSessionWithExercisesSchema
>;
export type ExerciseSession = z.infer<typeof exerciseSessionSchema>;
export type ExerciseSessionWithExercise = z.infer<
  typeof exerciseSessionWithExercise
>;
export type ExerciseSessionWithSets = z.infer<
  typeof exerciseSessionWithSetsSchema
>;
export type Exercise = z.infer<typeof exerciseSchema>;

export const weighInSchema = z.object({
  id: z.number().optional(),
  weight: z.preprocess(
    val => (val === '' ? undefined : val),
    z.coerce.number().positive().min(1)
  ),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  date: z.string()
});
export type WeighIn = z.infer<typeof weighInSchema>;

export const templateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: 'Template name is required' }),
  selectedExercises: z
    .array(exerciseSchema.extend({ setCount: z.number().default(1) }))
    .min(1, { message: 'Select at least 1 exercise' })
});
export type Template = z.infer<typeof templateSchema>;
