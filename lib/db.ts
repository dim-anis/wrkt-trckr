import { SQLiteDatabase } from 'expo-sqlite';
import {
  exerciseCategories,
  exercises,
  sets
} from '@/assets/misc/exerciseData';
import { eachDayOfInterval, subDays } from 'date-fns';
import { toDateId } from '@marceloterreiro/flash-calendar';

const dropTablesQuery = `
  PRAGMA writable_schema = 1;

  DROP TABLE IF EXISTS user_settings;
  DROP TABLE IF EXISTS weighins;
  DROP TABLE IF EXISTS exercise_categories;
  DROP TABLE IF EXISTS exercises;
  DROP TABLE IF EXISTS sets;
  DROP TABLE IF EXISTS workouts;
  DROP TABLE IF EXISTS exercise_session;
  DROP TABLE IF EXISTS templates;
  DROP TABLE IF EXISTS template_exercises;

  PRAGMA user_version = 0;
  PRAGMA writable_schema = 0;
  `;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(dropTablesQuery);

  const DATABASE_VERSION = 1;

  let result = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');

  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    // create <user_settings> table
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      is_metric INTEGER NOT NULL DEFAULT 1,
      is_dark INTEGER DEFAULT NULL
    );`);

    // add settings to <user_settings> table
    // set <isMetric> to '1' (true) by default
    await db.runAsync('INSERT INTO user_settings DEFAULT VALUES;');

    // create <weighins> table (weight, weight_unit)
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE weighins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      weight_unit TEXT CHECK(weight_unit IN ('kg', 'lb')) NOT NULL DEFAULT 'kg',
      date TEXT NOT NULL,
      UNIQUE(date)
    );
    `);

    // create some dummy data for <weighins>
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

    // #### create <exercise_categories> table (id, name) ####
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE exercise_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE
    );`);

    const categoryPromises = exerciseCategories.map(({ name: categoryName }) =>
      db.runAsync(
        'INSERT INTO exercise_categories (name) VALUES (?)',
        categoryName
      )
    );

    await Promise.all(categoryPromises);

    // #### create <exercises> table (id, name, is_compound, category_id, create_at) ####

    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE, 
      is_compound INTEGER, 
      category_id INTEGER,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (category_id) REFERENCES exercise_categories(id)
    );`);

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

    // #### create <workouts> table (id, created_at) ####

    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_name TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      start_time TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      end_time TEXT
    );
    PRAGMA table_info(workouts);
    `);

    // #### create <exercise_session> table (id, workout_id, exercise_id, start_time, end_time, notes) ####

    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE exercise_session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      start_time TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      end_time TEXT,
      notes TEXT,
      weight_unit TEXT CHECK( weight_unit IN ('kg', 'lb', 'bw')) NOT NULL DEFAULT 'kg',
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
    PRAGMA table_info(exercise_session);
    `);

    // #### create <sets> table (id, exercise, reps, rpe, created_at) ####

    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      exercise_id INTEGER NOT NULL, 
      workout_id INTEGER NOT NULL, 
      exercise_session_id INTEGER NOT NULL,
      weight REAL, 
      added_resistance REAL,
      reps INTEGER, 
      rpe REAL,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (exercise_session_id) REFERENCES exercise_session(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
    PRAGMA table_info(sets);
    `);

    const setsGroupedByDate = sets.reduce(
      (result, currSet) => {
        const exerciseSets = result[currSet.date] || [];
        exerciseSets.push(currSet);

        result[currSet.date] = exerciseSets;

        return result;
      },
      {} as Record<string, (typeof sets)[number][]>
    );

    for (const [workoutDate, workoutSets] of Object.entries(
      setsGroupedByDate
    )) {
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

    // create table <templates>
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    PRAGMA table_info(templates);
    `);

    // create table <template_exercises>
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_count INTEGER DEFAULT 1,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    );
    PRAGMA table_info(template_exercises);
    `);

    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
