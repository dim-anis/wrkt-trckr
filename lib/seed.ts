import {
  exerciseCategories,
  exercises,
  sets
} from '@/assets/misc/exerciseData';
import { toDateId } from '@marceloterreiro/flash-calendar';
import { eachDayOfInterval, subDays } from 'date-fns';
import { SQLiteDatabase } from 'expo-sqlite';

export async function createDummyWeighins(db: SQLiteDatabase) {
  const end = new Date();
  const start = subDays(end, 7);
  const range = eachDayOfInterval({ start, end });

  let weight = 90;
  for (const date of range) {
    await db.runAsync(
      `INSERT INTO weighins (date, weight, weight_unit) VALUES (?, ?, ?)`,
      toDateId(date),
      weight,
      'kg'
    );

    weight -= 0.5;
  }
}
export async function createDummyWorkouts(db: SQLiteDatabase) {
  const setsGroupedByDate = sets.reduce(
    (result, currSet) => {
      const exerciseSets = result[currSet.date] || [];
      exerciseSets.push(currSet);

      result[currSet.date] = exerciseSets;

      return result;
    },
    {} as Record<string, (typeof sets)[number][]>
  );

  for (const [workoutDate, workoutSets] of Object.entries(setsGroupedByDate)) {
    const createWorkoutResult = await db.runAsync(
      `INSERT INTO workouts (start_time) VALUES (?);`,
      workoutDate
    );

    const workoutId = createWorkoutResult.lastInsertRowId;

    const groupedExerciseSessions: {
      exerciseId: number;
      createdAt: string;
      sets: typeof workoutSets;
    }[] = [];

    workoutSets.forEach(currSet => {
      // Check if the last group is the same as the current exercise name
      const lastGroup =
        groupedExerciseSessions[groupedExerciseSessions.length - 1];

      if (lastGroup && lastGroup.exerciseId === currSet.exercise_id) {
        // If it's the same exercise, push to the existing group's sets
        lastGroup.sets.push(currSet);
      } else {
        // If it's a new exercise, create a new group
        groupedExerciseSessions.push({
          createdAt: currSet.date,
          exerciseId: currSet.exercise_id,
          sets: [currSet]
        });
      }
    });

    for (const exerciseSession of groupedExerciseSessions) {
      const createExerciseSessionResult = await db.runAsync(
        `INSERT INTO exercise_session (workout_id, exercise_id, start_time) VALUES (?, ?, ?)`,
        [workoutId, exerciseSession.exerciseId, exerciseSession.createdAt]
      );

      const exerciseSessionId = createExerciseSessionResult.lastInsertRowId;

      await db.withTransactionAsync(async () => {
        for (const set of exerciseSession.sets) {
          const { exercise_id, metric_weight, reps, date } = set;
          await db.runAsync(
            `INSERT INTO sets (workout_id, exercise_id, exercise_session_id, weight, reps, created_at) VALUES (?,?,?,?,?,?);`,
            [
              workoutId,
              exercise_id,
              exerciseSessionId,
              metric_weight,
              reps,
              date
            ]
          );
        }
      });
    }
  }
}

export async function populateExercises(db: SQLiteDatabase) {
  const exercisePromises = exercises.map(
    ({ _id, name, category_id, is_compound }) =>
      db.runAsync(
        'INSERT INTO exercises (id, name, is_compound, category_id) VALUES (?, ?, ?, ?)',
        _id,
        name,
        is_compound,
        category_id
      )
  );

  await Promise.all(exercisePromises);
}

export async function populateExerciseCategories(db: SQLiteDatabase) {
  const categoryPromises = exerciseCategories.map(({ name: categoryName }) =>
    db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      categoryName
    )
  );

  await Promise.all(categoryPromises);
}
