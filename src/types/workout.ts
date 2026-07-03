/**
 * Core domain types for the Gym Progress Tracker.
 *
 * Two layers of data live here:
 *
 * 1. PLANNING (Dashboard): a `WorkoutPlan` has one `WorkoutDay` per day of the
 *    week. Each `WorkoutDay` owns a `DayPresets` map: preset name -> ordered
 *    Exercise[]. This is what lets a single day (e.g. "Monday") have multiple
 *    interchangeable tracking presets ("Standard", "With Abs", "Heavy Power",
 *    or any custom name), each with its own target sets/reps per exercise.
 *
 * 2. LOGGING (Active Workout): when a preset is started, an `ActiveSession`
 *    snapshots that preset's exercises and creates one `WorkoutSet` row per
 *    exercise per target set. As sets get logged, their actual weight/reps
 *    are written into `history` so future sessions can show a "ghost" of
 *    what was done last time on that same set.
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

// ---------------------------------------------------------------------------
// Active workout / logging
// ---------------------------------------------------------------------------

/**
 * A single set row while logging a workout. `weight`/`reps` are kept as
 * strings because they're bound directly to editable TextInputs.
 */
export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  isCompleted: boolean;
}

/** A previously-logged result for one specific set index of an exercise,
 *  used to render the "Last: 60kg x 8" ghost placeholder. */
export interface Log {
  weight: number;
  reps: number;
}

/** The live in-progress workout session, started from a day + preset. */
export interface ActiveSession {
  day: DayOfWeek;
  presetName: string;
  /** Snapshot of the preset's exercises at the moment the workout started,
   *  so editing the preset on the Dashboard mid-workout can't corrupt an
   *  in-progress session. */
  exercises: Exercise[];
  /** exerciseId -> that exercise's set rows for this session. */
  exerciseSets: Record<string, WorkoutSet[]>;
  /** Index into `exercises` of the exercise currently being worked. */
  currentExerciseIndex: number;
  /** True once every set of every exercise has been logged. */
  completed: boolean;
}
