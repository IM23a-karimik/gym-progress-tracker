import { create } from 'zustand';

import type {
  ActiveWorkoutSession,
  Exercise,
  Log,
  SetDraft,
  SplitDay,
  Workout,
} from '../types/workout';

interface WorkoutStore {
  activeSession: ActiveWorkoutSession | null;
  draft: SetDraft;
  logs: Log[];
  selectedDayIndex: number;
  split: SplitDay[];
  workouts: Record<string, Workout>;
  finishWorkout: () => void;
  getActiveWorkout: () => Workout | null;
  getCurrentExercise: () => Exercise | null;
  getLastLogForCurrentExercise: () => Log | null;
  getSelectedWorkout: () => Workout;
  logSetAndAdvance: () => boolean;
  resetActiveWorkout: () => void;
  selectDay: (dayIndex: number) => void;
  startWorkout: (workoutId: string) => void;
  updateDraft: (field: keyof SetDraft, value: string) => void;
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

function normalizeNumber(value: string) {
  return Number(value.replace(',', '.'));
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
  {
    id: 'monday',
    dayIndex: 0,
    dayName: 'Mon',
    dayKey: 'push',
    workoutId: 'push-day',
  },
  {
    id: 'tuesday',
    dayIndex: 1,
    dayName: 'Tue',
    dayKey: 'pull',
    workoutId: 'pull-day',
  },
  {
    id: 'wednesday',
    dayIndex: 2,
    dayName: 'Wed',
    dayKey: 'rest',
    workoutId: 'rest-day-wed',
  },
  {
    id: 'thursday',
    dayIndex: 3,
    dayName: 'Thu',
    dayKey: 'upper',
    workoutId: 'upper-day',
  },
  {
    id: 'friday',
    dayIndex: 4,
    dayName: 'Fri',
    dayKey: 'lower',
    workoutId: 'lower-day',
  },
  {
    id: 'saturday',
    dayIndex: 5,
    dayName: 'Sat',
    dayKey: 'rest',
    workoutId: 'rest-day-sat',
  },
  {
    id: 'sunday',
    dayIndex: 6,
    dayName: 'Sun',
    dayKey: 'rest',
    workoutId: 'rest-day-sun',
  },
];

const mockLogs: Log[] = [
  {
    id: 'log-push-bench-last',
    sessionId: 'session-history-push',
    workoutId: 'push-day',
    workoutDayKey: 'push',
    workoutTitle: 'Push Day',
    exerciseId: 'barbell-bench-press',
    exerciseName: 'Barbell Bench Press',
    weight: 80,
    reps: 10,
    setNumber: 1,
    loggedAt: '2026-06-25T18:15:00.000Z',
  },
  {
    id: 'log-push-press-last',
    sessionId: 'session-history-push',
    workoutId: 'push-day',
    workoutDayKey: 'push',
    workoutTitle: 'Push Day',
    exerciseId: 'standing-overhead-press',
    exerciseName: 'Standing Overhead Press',
    weight: 52.5,
    reps: 8,
    setNumber: 1,
    loggedAt: '2026-06-25T18:25:00.000Z',
  },
  {
    id: 'log-pull-pullup-last',
    sessionId: 'session-history-pull',
    workoutId: 'pull-day',
    workoutDayKey: 'pull',
    workoutTitle: 'Pull Day',
    exerciseId: 'weighted-pull-up',
    exerciseName: 'Weighted Pull-Up',
    weight: 15,
    reps: 7,
    setNumber: 1,
    loggedAt: '2026-06-26T18:10:00.000Z',
  },
  {
    id: 'log-upper-close-grip-last',
    sessionId: 'session-history-upper',
    workoutId: 'upper-day',
    workoutDayKey: 'upper',
    workoutTitle: 'Upper Day',
    exerciseId: 'close-grip-bench-press',
    exerciseName: 'Close-Grip Bench Press',
    weight: 72.5,
    reps: 8,
    setNumber: 1,
    loggedAt: '2026-06-28T12:10:00.000Z',
  },
  {
    id: 'log-lower-squat-last',
    sessionId: 'session-history-lower',
    workoutId: 'lower-day',
    workoutDayKey: 'lower',
    workoutTitle: 'Lower Day',
    exerciseId: 'back-squat',
    exerciseName: 'Back Squat',
    weight: 120,
    reps: 6,
    setNumber: 1,
    loggedAt: '2026-06-29T17:30:00.000Z',
  },
];

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeSession: null,
  draft: {
    weight: '',
    reps: '',
  },
  logs: mockLogs,
  selectedDayIndex: getCurrentWeekdayIndex(),
  split: mockSplit,
  workouts: mockWorkouts,
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
        draft: {
          weight: '',
          reps: '',
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

    if (!workout || !activeSession || activeSession.completed) {
      return null;
    }

    return workout.exercises[activeSession.currentExerciseIndex] ?? null;
  },
  getLastLogForCurrentExercise: () => {
    const workout = get().getActiveWorkout();
    const exercise = get().getCurrentExercise();
    const activeSession = get().activeSession;

    if (!workout || !exercise) {
      return null;
    }

    const matchingLogs = get()
      .logs.filter(
        (log) =>
          log.workoutDayKey === workout.dayKey &&
          log.exerciseId === exercise.id &&
          log.sessionId !== activeSession?.sessionId,
      )
      .sort(
        (a, b) =>
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );

    return matchingLogs[0] ?? null;
  },
  getSelectedWorkout: () => {
    const { selectedDayIndex, split, workouts } = get();
    const selectedDay = split[selectedDayIndex] ?? split[0];

    return workouts[selectedDay.workoutId];
  },
  logSetAndAdvance: () => {
    const { activeSession, draft } = get();
    const workout = get().getActiveWorkout();
    const exercise = get().getCurrentExercise();
    const weight = normalizeNumber(draft.weight);
    const reps = Number.parseInt(draft.reps, 10);

    if (
      !activeSession ||
      !workout ||
      !exercise ||
      !Number.isFinite(weight) ||
      !Number.isFinite(reps) ||
      weight <= 0 ||
      reps <= 0
    ) {
      return false;
    }

    const currentLogsForExercise = get().logs.filter(
      (log) =>
        log.sessionId === activeSession.sessionId &&
        log.exerciseId === exercise.id,
    );
    const nextExerciseIndex = activeSession.currentExerciseIndex + 1;
    const isComplete = nextExerciseIndex >= workout.exercises.length;
    const loggedAt = new Date().toISOString();
    const nextLog: Log = {
      id: `log-${activeSession.sessionId}-${exercise.id}-${loggedAt}`,
      sessionId: activeSession.sessionId,
      workoutId: workout.id,
      workoutDayKey: workout.dayKey,
      workoutTitle: workout.title,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight,
      reps,
      setNumber: currentLogsForExercise.length + 1,
      loggedAt,
    };

    set((state) => ({
      activeSession: {
        ...activeSession,
        currentExerciseIndex: isComplete
          ? activeSession.currentExerciseIndex
          : nextExerciseIndex,
        completed: isComplete,
      },
      draft: {
        weight: '',
        reps: '',
      },
      logs: [nextLog, ...state.logs],
    }));

    return true;
  },
  resetActiveWorkout: () => {
    set({
      activeSession: null,
      draft: {
        weight: '',
        reps: '',
      },
    });
  },
  selectDay: (dayIndex: number) => {
    set({ selectedDayIndex: dayIndex });
  },
  startWorkout: (workoutId: string) => {
    set({
      activeSession: {
        sessionId: createSessionId(),
        workoutId,
        currentExerciseIndex: 0,
        completed: false,
      },
      draft: {
        weight: '',
        reps: '',
      },
    });
  },
  updateDraft: (field: keyof SetDraft, value: string) => {
    set((state) => ({
      draft: {
        ...state.draft,
        [field]: value,
      },
    }));
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
