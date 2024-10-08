import { SQLiteDatabase } from 'expo-sqlite';
import {
  exerciseCategories,
  exercises,
  sets
} from '@/assets/misc/exerciseData';

const dropTablesQuery = `
  PRAGMA writable_schema = 1;

  DROP TABLE IF EXISTS user_settings;
  DROP TABLE IF EXISTS exercise_categories;
  DROP TABLE IF EXISTS exercises;
  DROP TABLE IF EXISTS sets;

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

    // #### create <set> table (id, exercise, reps, rpe, notes, created_at) ####

    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      exercise_id INTEGER, 
      weight REAL, 
      added_resistance REAL,
      reps INTEGER, 
      rpe REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id)
    );
    PRAGMA table_info(sets);
`);

    const setPromises = sets.map(
      ({ exercise_id, metric_weight, reps, date }) => {
        return db.runAsync(
          'INSERT INTO sets (exercise_id, weight, reps, created_at) VALUES (?, ?, ?, datetime(?))',
          exercise_id,
          metric_weight,
          reps,
          date
        );
      }
    );

    await Promise.all(setPromises);

    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
