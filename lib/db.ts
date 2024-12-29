import { SQLiteDatabase } from 'expo-sqlite';
import {
  createDummyWeighins,
  createDummyWorkouts,
  populateExerciseCategories,
  populateExercises
} from './seed';

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
  // await db.execAsync(dropTablesQuery);

  const DATABASE_VERSION = 1;

  let result = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');

  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  if (currentDbVersion === 0) {
    await db.withTransactionAsync(async () => {
      // create <user_settings> table
      await db.execAsync(`
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
    CREATE TABLE weighins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      weight_unit TEXT CHECK(weight_unit IN ('kg', 'lb')) NOT NULL DEFAULT 'kg',
      date TEXT NOT NULL,
      UNIQUE(date)
    );
    `);

      // #### create <exercise_categories> table (id, name) ####
      await db.execAsync(`
    CREATE TABLE exercise_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE
    );`);

      // #### create <exercises> table (id, name, is_compound, category_id, create_at) ####

      await db.execAsync(`
    CREATE TABLE exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE, 
      is_compound INTEGER, 
      category_id INTEGER,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (category_id) REFERENCES exercise_categories(id)
    );`);

      // #### create <workouts> table (id, created_at) ####

      await db.execAsync(`
    CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_name TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      start_time TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      end_time TEXT
    );
    `);

      // #### create <exercise_session> table (id, workout_id, exercise_id, start_time, end_time, notes) ####

      await db.execAsync(`
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
    `);

      // #### create <sets> table (id, exercise, reps, rpe, created_at) ####

      await db.execAsync(`
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
    `);

      // create table <templates>
      await db.execAsync(`
    CREATE TABLE templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);

      // create table <template_exercises>
      await db.execAsync(`
    CREATE TABLE template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_count INTEGER DEFAULT 1,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    );
    `);
    });

    await populateExerciseCategories(db);
    await populateExercises(db);
    await createDummyWorkouts(db);
    await createDummyWeighins(db);

    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
