import { create } from 'zustand';

import type {
  ActiveWorkoutSession,
  Exercise,
  ExerciseSetsMap,
  Log,
  SplitDay,
  Workout,
  WorkoutSet,
} from '../types/workout';

export interface LogSetResult {
  success: boolean;
  exerciseCompleted: boolean;
  workoutCompleted: boolean;
}

interface WorkoutStore {
  activeSession: ActiveWorkoutSession | null;
  logs: Log[];
  selectedDayIndex: number;
  split: SplitDay[];
  workouts: Record<string, Workout>;

  // Session lifecycle
  startWorkout: (workoutId: string) => void;
  resetActiveWorkout: () => void;
  finishWorkout: () => void;

  // Derived reads
  getActiveWorkout: () => Workout | null;
  getCurrentExercise: () => Exercise | null;
  getSetsForExercise: (exerciseId: string) => WorkoutSet[];
  getLastSessionLogsForExercise: (exerciseId: string) => Log[];
  getGhostForSetIndex: (exerciseId: string, setIndex: number) => Log | null;
  getNextIncompleteSetId: (exerciseId: string) => string | null;

  // Per-exercise set editing
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSetField: (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => void;
  logSet: (exerciseId: string, setId: string) => LogSetResult;

  // Dashboard / plan editor (unchanged)
  selectDay: (dayIndex: number) => void;
  getSelectedWorkout: () => Workout;
  updateWorkoutPlan: (
    workoutId: string,
    title: string,
    exerciseNames: string[],
  ) => void;
}

function getCurrentWeekdayIndex() {
  const sundayFirstIndex = new Date().getDay();
  return (sundayFirstIndex + 6) % 7;
}

function createSessionId() {
  return `session-${Date.now()}`;
}

function createSetId(exerciseId: string, index: number) {
  return `${exerciseId}-set-${index}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeNumber(value: string) {
  return Number(value.replace(',', '.'));
}

/** Shared with the UI so ghost values and typed values render identically. */
export function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function createEmptySet(exerciseId: string, index: number): WorkoutSet {
  return {
    id: createSetId(exerciseId, index),
    weight: '',
    reps: '',
    isCompleted: false,
  };
}

function buildInitialExerciseSets(workout: Workout): ExerciseSetsMap {
  const exerciseSets: ExerciseSetsMap = {};

  workout.exercises.forEach((exercise) => {
    const setCount = Math.max(exercise.targetSets, 1);
    exerciseSets[exercise.id] = Array.from({ length: setCount }, (_, index) =>
      createEmptySet(exercise.id, index),
    );
  });

  return exerciseSets;
}

function isExerciseFullyLogged(sets: WorkoutSet[] | undefined) {
  return !!sets && sets.length > 0 && sets.every((setItem) => setItem.isCompleted);
}

const mockWorkouts: Record<string, Workout> = {
  'push-day': {
    id: 'push-day',
    dayKey: 'push',
    title: 'Push Day',
    shortLabel: 'P',
    exercises: [
      {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        category: 'Chest',
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 150,
      },
      {
        id: 'standing-overhead-press',
        name: 'Standing Overhead Press',
        category: 'Shoulders',
        targetSets: 3,
        targetReps: '6-8',
        restSeconds: 150,
      },
      {
        id: 'incline-dumbbell-press',
        name: 'Incline Dumbbell Press',
        category: 'Chest',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 120,
      },
      {
        id: 'cable-triceps-pushdown',
        name: 'Cable Triceps Pushdown',
        category: 'Triceps',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 75,
      },
    ],
  },
  'pull-day': {
    id: 'pull-day',
    dayKey: 'pull',
    title: 'Pull Day',
    shortLabel: 'P',
    exercises: [
      {
        id: 'weighted-pull-up',
        name: 'Weighted Pull-Up',
        category: 'Back',
        targetSets: 4,
        targetReps: '5-8',
        restSeconds: 150,
      },
      {
        id: 'barbell-row',
        name: 'Barbell Row',
        category: 'Back',
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 120,
      },
      {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        category: 'Back',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 90,
      },
      {
        id: 'ez-bar-curl',
        name: 'EZ-Bar Curl',
        category: 'Biceps',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 75,
      },
    ],
  },
  'rest-day-wed': {
    id: 'rest-day-wed',
    dayKey: 'rest',
    title: 'Rest Day',
    shortLabel: 'R',
    exercises: [],
  },
  'rest-day-sat': {
    id: 'rest-day-sat',
    dayKey: 'rest',
    title: 'Rest Day',
    shortLabel: 'R',
    exercises: [],
  },
  'rest-day-sun': {
    id: 'rest-day-sun',
    dayKey: 'rest',
    title: 'Rest Day',
    shortLabel: 'R',
    exercises: [],
  },
  'upper-day': {
    id: 'upper-day',
    dayKey: 'upper',
    title: 'Upper Day',
    shortLabel: 'U',
    exercises: [
      {
        id: 'close-grip-bench-press',
        name: 'Close-Grip Bench Press',
        category: 'Chest',
        targetSets: 3,
        targetReps: '6-8',
        restSeconds: 150,
      },
      {
        id: 'chest-supported-row',
        name: 'Chest-Supported Row',
        category: 'Back',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 120,
      },
      {
        id: 'seated-dumbbell-press',
        name: 'Seated Dumbbell Press',
        category: 'Shoulders',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 120,
      },
      {
        id: 'lateral-raise',
        name: 'Lateral Raise',
        category: 'Shoulders',
        targetSets: 3,
        targetReps: '12-15',
        restSeconds: 60,
      },
    ],
  },
  'lower-day': {
    id: 'lower-day',
    dayKey: 'lower',
    title: 'Lower Day',
    shortLabel: 'L',
    exercises: [
      {
        id: 'back-squat',
        name: 'Back Squat',
        category: 'Quads',
        targetSets: 4,
        targetReps: '5-8',
        restSeconds: 180,
      },
      {
        id: 'romanian-deadlift',
        name: 'Romanian Deadlift',
        category: 'Hamstrings',
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 150,
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        category: 'Quads',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 120,
      },
      {
        id: 'standing-calf-raise',
        name: 'Standing Calf Raise',
        category: 'Calves',
        targetSets: 4,
        targetReps: '10-15',
        restSeconds: 75,
      },
    ],
  },
};

const mockSplit: SplitDay[] = [
  { id: 'monday', dayIndex: 0, dayName: 'Mon', dayKey: 'push', workoutId: 'push-day' },
  { id: 'tuesday', dayIndex: 1, dayName: 'Tue', dayKey: 'pull', workoutId: 'pull-day' },
  { id: 'wednesday', dayIndex: 2, dayName: 'Wed', dayKey: 'rest', workoutId: 'rest-day-wed' },
  { id: 'thursday', dayIndex: 3, dayName: 'Thu', dayKey: 'upper', workoutId: 'upper-day' },
  { id: 'friday', dayIndex: 4, dayName: 'Fri', dayKey: 'lower', workoutId: 'lower-day' },
  { id: 'saturday', dayIndex: 5, dayName: 'Sat', dayKey: 'rest', workoutId: 'rest-day-sat' },
  { id: 'sunday', dayIndex: 6, dayName: 'Sun', dayKey: 'rest', workoutId: 'rest-day-sun' },
];

// Seed history: one full previous session per split day, one Log per set,
// so every set row in the UI (not just set #1) has real ghost data to show.
function buildLog(
  partial: Omit<Log, 'id'>,
): Log {
  return { ...partial, id: `log-${partial.sessionId}-${partial.exerciseId}-${partial.setNumber}` };
}

const mockLogs: Log[] = [
  // Push Day - session-history-push (2026-06-25)
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'barbell-bench-press', exerciseName: 'Barbell Bench Press', weight: 80, reps: 10, setNumber: 1, loggedAt: '2026-06-25T18:15:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'barbell-bench-press', exerciseName: 'Barbell Bench Press', weight: 80, reps: 9, setNumber: 2, loggedAt: '2026-06-25T18:18:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'barbell-bench-press', exerciseName: 'Barbell Bench Press', weight: 77.5, reps: 8, setNumber: 3, loggedAt: '2026-06-25T18:21:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'barbell-bench-press', exerciseName: 'Barbell Bench Press', weight: 77.5, reps: 8, setNumber: 4, loggedAt: '2026-06-25T18:24:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'standing-overhead-press', exerciseName: 'Standing Overhead Press', weight: 52.5, reps: 8, setNumber: 1, loggedAt: '2026-06-25T18:32:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'standing-overhead-press', exerciseName: 'Standing Overhead Press', weight: 52.5, reps: 7, setNumber: 2, loggedAt: '2026-06-25T18:35:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'standing-overhead-press', exerciseName: 'Standing Overhead Press', weight: 50, reps: 8, setNumber: 3, loggedAt: '2026-06-25T18:38:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', weight: 30, reps: 10, setNumber: 1, loggedAt: '2026-06-25T18:45:00.000Z' }),
  buildLog({ sessionId: 'session-history-push', workoutId: 'push-day', workoutDayKey: 'push', workoutTitle: 'Push Day', exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', weight: 30, reps: 9, setNumber: 2, loggedAt: '2026-06-25T18:48:00.000Z' }),

  // Pull Day - session-history-pull (2026-06-26)
  buildLog({ sessionId: 'session-history-pull', workoutId: 'pull-day', workoutDayKey: 'pull', workoutTitle: 'Pull Day', exerciseId: 'weighted-pull-up', exerciseName: 'Weighted Pull-Up', weight: 15, reps: 7, setNumber: 1, loggedAt: '2026-06-26T18:10:00.000Z' }),
  buildLog({ sessionId: 'session-history-pull', workoutId: 'pull-day', workoutDayKey: 'pull', workoutTitle: 'Pull Day', exerciseId: 'weighted-pull-up', exerciseName: 'Weighted Pull-Up', weight: 15, reps: 6, setNumber: 2, loggedAt: '2026-06-26T18:13:00.000Z' }),
  buildLog({ sessionId: 'session-history-pull', workoutId: 'pull-day', workoutDayKey: 'pull', workoutTitle: 'Pull Day', exerciseId: 'weighted-pull-up', exerciseName: 'Weighted Pull-Up', weight: 10, reps: 7, setNumber: 3, loggedAt: '2026-06-26T18:16:00.000Z' }),
  buildLog({ sessionId: 'session-history-pull', workoutId: 'pull-day', workoutDayKey: 'pull', workoutTitle: 'Pull Day', exerciseId: 'barbell-row', exerciseName: 'Barbell Row', weight: 70, reps: 8, setNumber: 1, loggedAt: '2026-06-26T18:24:00.000Z' }),
  buildLog({ sessionId: 'session-history-pull', workoutId: 'pull-day', workoutDayKey: 'pull', workoutTitle: 'Pull Day', exerciseId: 'barbell-row', exerciseName: 'Barbell Row', weight: 70, reps: 7, setNumber: 2, loggedAt: '2026-06-26T18:27:00.000Z' }),

  // Upper Day - session-history-upper (2026-06-28)
  buildLog({ sessionId: 'session-history-upper', workoutId: 'upper-day', workoutDayKey: 'upper', workoutTitle: 'Upper Day', exerciseId: 'close-grip-bench-press', exerciseName: 'Close-Grip Bench Press', weight: 72.5, reps: 8, setNumber: 1, loggedAt: '2026-06-28T12:10:00.000Z' }),
  buildLog({ sessionId: 'session-history-upper', workoutId: 'upper-day', workoutDayKey: 'upper', workoutTitle: 'Upper Day', exerciseId: 'close-grip-bench-press', exerciseName: 'Close-Grip Bench Press', weight: 72.5, reps: 7, setNumber: 2, loggedAt: '2026-06-28T12:13:00.000Z' }),
  buildLog({ sessionId: 'session-history-upper', workoutId: 'upper-day', workoutDayKey: 'upper', workoutTitle: 'Upper Day', exerciseId: 'close-grip-bench-press', exerciseName: 'Close-Grip Bench Press', weight: 70, reps: 8, setNumber: 3, loggedAt: '2026-06-28T12:16:00.000Z' }),

  // Lower Day - session-history-lower (2026-06-29)
  buildLog({ sessionId: 'session-history-lower', workoutId: 'lower-day', workoutDayKey: 'lower', workoutTitle: 'Lower Day', exerciseId: 'back-squat', exerciseName: 'Back Squat', weight: 120, reps: 6, setNumber: 1, loggedAt: '2026-06-29T17:30:00.000Z' }),
  buildLog({ sessionId: 'session-history-lower', workoutId: 'lower-day', workoutDayKey: 'lower', workoutTitle: 'Lower Day', exerciseId: 'back-squat', exerciseName: 'Back Squat', weight: 120, reps: 6, setNumber: 2, loggedAt: '2026-06-29T17:34:00.000Z' }),
  buildLog({ sessionId: 'session-history-lower', workoutId: 'lower-day', workoutDayKey: 'lower', workoutTitle: 'Lower Day', exerciseId: 'back-squat', exerciseName: 'Back Squat', weight: 117.5, reps: 6, setNumber: 3, loggedAt: '2026-06-29T17:38:00.000Z' }),
  buildLog({ sessionId: 'session-history-lower', workoutId: 'lower-day', workoutDayKey: 'lower', workoutTitle: 'Lower Day', exerciseId: 'back-squat', exerciseName: 'Back Squat', weight: 117.5, reps: 5, setNumber: 4, loggedAt: '2026-06-29T17:42:00.000Z' }),
];

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeSession: null,
  logs: mockLogs,
  selectedDayIndex: getCurrentWeekdayIndex(),
  split: mockSplit,
  workouts: mockWorkouts,

  startWorkout: (workoutId: string) => {
    const workout = get().workouts[workoutId];

    set({
      activeSession: {
        sessionId: createSessionId(),
        workoutId,
        currentExerciseIndex: 0,
        completed: !workout || workout.exercises.length === 0,
        exerciseSets: workout ? buildInitialExerciseSets(workout) : {},
      },
    });
  },

  resetActiveWorkout: () => {
    set({ activeSession: null });
  },

  finishWorkout: () => {
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      return {
        activeSession: {
          ...state.activeSession,
          completed: true,
        },
      };
    });
  },

  getActiveWorkout: () => {
    const { activeSession, workouts } = get();

    if (!activeSession) {
      return null;
    }

    return workouts[activeSession.workoutId] ?? null;
  },

  getCurrentExercise: () => {
    const workout = get().getActiveWorkout();
    const activeSession = get().activeSession;

    if (!workout || !activeSession) {
      return null;
    }

    return workout.exercises[activeSession.currentExerciseIndex] ?? null;
  },

  getSetsForExercise: (exerciseId: string) => {
    return get().activeSession?.exerciseSets[exerciseId] ?? [];
  },

  getLastSessionLogsForExercise: (exerciseId: string) => {
    const workout = get().getActiveWorkout();
    const activeSession = get().activeSession;

    if (!workout || !activeSession) {
      return [];
    }

    // Only logs from the same split day (e.g. "Push Day"), same exercise,
    // and NOT the session currently in progress.
    const candidateLogs = get().logs.filter(
      (log) =>
        log.workoutDayKey === workout.dayKey &&
        log.exerciseId === exerciseId &&
        log.sessionId !== activeSession.sessionId,
    );

    if (candidateLogs.length === 0) {
      return [];
    }

    // Pin to the single most recent past session so set 1 / set 2 / set 3
    // all come from the same workout instead of being mixed across days.
    const mostRecentSessionId = candidateLogs.reduce((latest, log) =>
      new Date(log.loggedAt).getTime() > new Date(latest.loggedAt).getTime()
        ? log
        : latest,
    ).sessionId;

    return candidateLogs
      .filter((log) => log.sessionId === mostRecentSessionId)
      .sort((a, b) => a.setNumber - b.setNumber);
  },

  getGhostForSetIndex: (exerciseId: string, setIndex: number) => {
    const lastSessionLogs = get().getLastSessionLogsForExercise(exerciseId);
    return lastSessionLogs[setIndex] ?? null;
  },

  getNextIncompleteSetId: (exerciseId: string) => {
    const sets = get().getSetsForExercise(exerciseId);
    return sets.find((setItem) => !setItem.isCompleted)?.id ?? null;
  },

  addSet: (exerciseId: string) => {
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      const currentSets = state.activeSession.exerciseSets[exerciseId] ?? [];
      const nextSet = createEmptySet(exerciseId, currentSets.length);

      return {
        activeSession: {
          ...state.activeSession,
          completed: false,
          exerciseSets: {
            ...state.activeSession.exerciseSets,
            [exerciseId]: [...currentSets, nextSet],
          },
        },
      };
    });
  },

  removeSet: (exerciseId: string, setId: string) => {
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      const currentSets = state.activeSession.exerciseSets[exerciseId] ?? [];

      // Always keep at least one set row per exercise.
      if (currentSets.length <= 1) {
        return state;
      }

      const nextSets = currentSets.filter((setItem) => setItem.id !== setId);

      return {
        activeSession: {
          ...state.activeSession,
          exerciseSets: {
            ...state.activeSession.exerciseSets,
            [exerciseId]: nextSets,
          },
        },
      };
    });
  },

  updateSetField: (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      const currentSets = state.activeSession.exerciseSets[exerciseId] ?? [];

      return {
        activeSession: {
          ...state.activeSession,
          exerciseSets: {
            ...state.activeSession.exerciseSets,
            [exerciseId]: currentSets.map((setItem) =>
              setItem.id === setId ? { ...setItem, [field]: value } : setItem,
            ),
          },
        },
      };
    });
  },

  logSet: (exerciseId: string, setId: string) => {
    const activeSession = get().activeSession;
    const workout = get().getActiveWorkout();
    const exercise = workout?.exercises.find((item) => item.id === exerciseId);
    const failure: LogSetResult = {
      success: false,
      exerciseCompleted: false,
      workoutCompleted: false,
    };

    if (!activeSession || !workout || !exercise) {
      return failure;
    }

    const sets = activeSession.exerciseSets[exerciseId] ?? [];
    const setIndex = sets.findIndex((item) => item.id === setId);
    const currentSet = sets[setIndex];

    if (setIndex === -1 || !currentSet || currentSet.isCompleted) {
      return failure;
    }

    // Fall back to last time's numbers whenever the field was left blank.
    const ghost = get().getGhostForSetIndex(exerciseId, setIndex);
    const resolvedWeightText =
      currentSet.weight.trim() || (ghost ? formatWeight(ghost.weight) : '');
    const resolvedRepsText =
      currentSet.reps.trim() || (ghost ? String(ghost.reps) : '');
    const weight = normalizeNumber(resolvedWeightText);
    const reps = Number.parseInt(resolvedRepsText, 10);

    if (
      !Number.isFinite(weight) ||
      weight <= 0 ||
      !Number.isFinite(reps) ||
      reps <= 0
    ) {
      return failure;
    }

    const loggedAt = new Date().toISOString();
    const nextLog: Log = {
      id: `log-${activeSession.sessionId}-${exerciseId}-${setId}`,
      sessionId: activeSession.sessionId,
      workoutId: workout.id,
      workoutDayKey: workout.dayKey,
      workoutTitle: workout.title,
      exerciseId,
      exerciseName: exercise.name,
      weight,
      reps,
      setNumber: setIndex + 1,
      loggedAt,
    };

    const updatedSets = sets.map((item, index) =>
      index === setIndex
        ? {
            ...item,
            weight: resolvedWeightText,
            reps: resolvedRepsText,
            isCompleted: true,
          }
        : item,
    );
    const nextExerciseSets: ExerciseSetsMap = {
      ...activeSession.exerciseSets,
      [exerciseId]: updatedSets,
    };
    const exerciseCompleted = isExerciseFullyLogged(updatedSets);

    let nextExerciseIndex = activeSession.currentExerciseIndex;
    let workoutCompleted = activeSession.completed;

    if (exerciseCompleted) {
      const searchStart = workout.exercises.findIndex(
        (item) => item.id === exerciseId,
      );
      let foundNextIndex: number | null = null;

      for (let i = searchStart + 1; i < workout.exercises.length; i += 1) {
        const candidate = workout.exercises[i];
        if (!isExerciseFullyLogged(nextExerciseSets[candidate.id])) {
          foundNextIndex = i;
          break;
        }
      }

      if (foundNextIndex !== null) {
        nextExerciseIndex = foundNextIndex;
      } else {
        // No exercise after this one is pending — check the whole workout
        // (covers exercises the user may have completed out of order).
        workoutCompleted = workout.exercises.every((item) =>
          isExerciseFullyLogged(nextExerciseSets[item.id]),
        );
      }
    }

    set({
      activeSession: {
        ...activeSession,
        exerciseSets: nextExerciseSets,
        currentExerciseIndex: nextExerciseIndex,
        completed: workoutCompleted,
      },
      logs: [nextLog, ...get().logs],
    });

    return { success: true, exerciseCompleted, workoutCompleted };
  },

  selectDay: (dayIndex: number) => {
    set({ selectedDayIndex: dayIndex });
  },

  getSelectedWorkout: () => {
    const { selectedDayIndex, split, workouts } = get();
    const selectedDay = split[selectedDayIndex] ?? split[0];

    return workouts[selectedDay.workoutId];
  },

  updateWorkoutPlan: (workoutId, title, exerciseNames) => {
    set((state) => {
      const workout = state.workouts[workoutId];

      if (!workout) {
        return state;
      }

      const sanitizedTitle = title.trim() || workout.title;
      const existingExercisesByName = new Map(
        workout.exercises.map((exercise) => [
          exercise.name.toLowerCase(),
          exercise,
        ]),
      );
      const nextExercises = exerciseNames
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, index) => {
          const existingExercise = existingExercisesByName.get(
            name.toLowerCase(),
          );

          if (existingExercise) {
            return existingExercise;
          }

          return {
            id: `${workoutId}-custom-${index}-${name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')}`,
            name,
            category: workout.dayKey === 'rest' ? 'Recovery' : 'Custom',
            targetSets: 3,
            targetReps: '8-10',
            restSeconds: 90,
            notes: 'Added from dashboard editor.',
          };
        });

      return {
        workouts: {
          ...state.workouts,
          [workoutId]: {
            ...workout,
            title: sanitizedTitle,
            exercises: nextExercises,
          },
        },
      };
    });
  },
}));
