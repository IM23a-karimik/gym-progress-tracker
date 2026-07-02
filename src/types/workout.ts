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

export interface SetDraft {
  weight: string;
  reps: string;
}

export interface SplitDay {
  id: string;
  dayIndex: number;
  dayName: string;
  dayKey: WorkoutDayKey;
  workoutId: string;
}

export interface ActiveWorkoutSession {
  sessionId: string;
  workoutId: string;
  currentExerciseIndex: number;
  completed: boolean;
}
