/**
 * Core domain types for the Gym Progress Tracker.
 *
 * Data model overview:
 * - A `WorkoutPlan` has one `WorkoutDay` per day of the week.
 * - Each `WorkoutDay` owns a `DayPresets` map: preset name -> ordered Exercise[].
 *   This is what lets a single day (e.g. "Monday") have multiple interchangeable
 *   tracking presets ("Standard", "With Abs", "Heavy Power", or any custom name).
 * - `EXERCISE_LIBRARY` (see workoutStore.ts) is a separate, static catalog of
 *   selectable exercises grouped by muscle category, used to populate the
 *   "Add Exercise" modal. Picking a library item creates a new `Exercise`
 *   instance that gets appended to the active day's active preset.
 */

export type MuscleCategory = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Abs';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/** A single tracked exercise inside a preset, with its target volume. */
export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  targetSets: number;
  targetReps: number;
}

/** Preset name -> ordered list of exercises for that preset. */
export interface DayPresets {
  [presetName: string]: Exercise[];
}

/** A single day of the week, holding all of its named presets. */
export interface WorkoutDay {
  day: DayOfWeek;
  presets: DayPresets;
}

/** The full week plan, keyed by day. */
export type WorkoutPlan = Record<DayOfWeek, WorkoutDay>;

/** A selectable entry in the static exercise catalog (Add Exercise modal). */
export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: MuscleCategory;
}
