import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  let dropResult = await db.execAsync(`
  PRAGMA writable_schema = 1;

  DROP TABLE IF EXISTS user_settings;
  DROP TABLE IF EXISTS exercise_categories;
  DROP TABLE IF EXISTS exercises;
  DROP TABLE IF EXISTS sets;

  PRAGMA user_version = 0;
  PRAGMA writable_schema = 0;
  `);

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
      setting_key TEXT NOT NULL UNIQUE, 
      setting_value TEXT
    );`);
    // add settings to <user_settings> table
    // set <isMetric> to '1' (true) by default
    await db.runAsync(
      'INSERT INTO user_settings (setting_key, setting_value) VALUES (?, ?)',
      'is_metric',
      '1'
    );
    // set <exertionScaleType> to 'rpe'
    await db.runAsync(
      'INSERT INTO user_settings (setting_key, setting_value) VALUES (?, ?)',
      'exertion_scale_type',
      'rpe'
    );
    // set <mesoLength> to '4' (in weeks)
    await db.runAsync(
      'INSERT INTO user_settings (setting_key, setting_value) VALUES (?, ?)',
      'meso_length',
      '4'
    );
    // set <isDeloading> to '0' (false)
    await db.runAsync(
      'INSERT INTO user_settings (setting_key, setting_value) VALUES (?, ?)',
      'is_deloading',
      '0'
    );
    // create exercise_categories
    // -- id
    // -- name
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE exercise_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE
    );`);
    // add categories
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Abs'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Back'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Biceps'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Chest'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Legs'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Shoulders'
    );
    await db.runAsync(
      'INSERT INTO exercise_categories (name) VALUES (?)',
      'Triceps'
    );
    // create <exercise> table
    // -- id
    // -- name
    // -- isCompound
    // -- category
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL UNIQUE, 
      is_compound INTEGER, 
      category_id INTEGER,
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES exercise_categories(id)
    );`);

    // [{"id": 1, "name": "Abs"}, {"id": 2, "name": "Back"}, {"id": 3, "name": "Biceps"}, {"id": 4, "name": "Chest"}, {"id": 5, "name": "Legs"}, {"id": 6, "name": "Shoulders"}, {"id": 7, "name": "Triceps"}]
    // add Barbell Squat
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category_id) VALUES (?, ?, ?)',
      'Barbell Squat',
      '1',
      5
    );

    // add Barbell Bench Press
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category_id) VALUES (?, ?, ?)',
      'Barbell Bench Press',
      '1',
      4
    );

    // add Deadlift
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category_id) VALUES (?, ?, ?)',
      'Deadlift',
      '1',
      2
    );

    // create <set> table
    // -- id
    // -- exercise
    // -- reps
    // -- rpe
    // -- notes
    await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      exercise_id INTEGER, 
      weight REAL, 
      reps INTEGER, 
      rpe REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id)
    );`);
    // create dummy sets
    // Barbell Squat
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      1,
      90,
      15,
      8,
      'Stimulus to fatigue ratio is off. Reduce the number of reps next time.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      1,
      95,
      14,
      6.5,
      'Stimulus to fatigue ratio is off. Reduce the number of reps next time.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      1,
      97.5,
      13,
      6,
      'Stimulus to fatigue ratio is off. Reduce the number of reps next time.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      1,
      100,
      12,
      8.5,
      'Felt a really good muscle connection. Must continue with this one.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      1,
      105,
      10,
      9
    );
    // Barbell Bench Press
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      2,
      97.5,
      13,
      6,
      'Stimulus to fatigue ratio is off. Reduce the number of reps next time.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      2,
      100,
      12,
      8.5,
      'Felt a really good muscle connection. Must continue with this one.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      2,
      105,
      10,
      9
    );
    // Deadlift
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      3,
      97.5,
      13,
      6,
      'Stimulus to fatigue ratio is off. Reduce the number of reps next time.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      3,
      100,
      12,
      8.5,
      'Felt a really good muscle connection. Must continue with this one.'
    );
    await db.runAsync(
      'INSERT INTO sets (exercise_id, weight, reps, rpe, notes) VALUES (?, ?, ?, ?, ?)',
      3,
      105,
      10,
      9
    );

    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
