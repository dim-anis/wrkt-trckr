import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  let dropResult = await db.execAsync(`
  PRAGMA writable_schema = 1;

  DROP TABLE IF EXISTS user_settings;
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
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    // add Barbell Squat
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category) VALUES (?, ?, ?)',
      'Barbell Squat',
      '1',
      'Legs'
    );

    // add Barbell Bench Press
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category) VALUES (?, ?, ?)',
      'Barbell Bench Press',
      '1',
      'Chest'
    );

    // add Deadlift
    await db.runAsync(
      'INSERT INTO exercises (name, is_compound, category) VALUES (?, ?, ?)',
      'Deadlift',
      '1',
      'Back'
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

    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
