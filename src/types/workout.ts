export type WorkoutDayKey = 'push' | 'pull' | 'rest' | 'upper' | 'lower';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes?: string;
}

export interface Workout {
  id: string;
  dayKey: WorkoutDayKey;
  title: string;
  shortLabel: string;
  exercises: Exercise[];
}

export interface Log {
  id: string;
  sessionId: string;
  workoutId: string;
  workoutDayKey: WorkoutDayKey;
  workoutTitle: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  setNumber: number;
  loggedAt: string;
}

export interface SplitDay {
  id: string;
  dayIndex: number;
  dayName: string;
  dayKey: WorkoutDayKey;
  workoutId: string;
}

/**
 * A single, independently-editable set row for one exercise during an
 * active session. `weight` / `reps` are kept as raw text so a row can sit
 * blank (showing a ghost placeholder) until the user types or logs it.
 */
export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  isCompleted: boolean;
}

/** Exercise id -> its dynamic list of sets for the current session. */
export type ExerciseSetsMap = Record<string, WorkoutSet[]>;

export interface ActiveWorkoutSession {
  sessionId: string;
  workoutId: string;
  currentExerciseIndex: number;
  completed: boolean;
  exerciseSets: ExerciseSetsMap;
}
