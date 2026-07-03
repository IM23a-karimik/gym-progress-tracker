import { useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatWeight, useWorkoutStore } from '../store/workoutStore';
import type { Exercise, Log, WorkoutSet } from '../types/workout';

interface ActiveWorkoutScreenProps {
  onExit: () => void;
}

interface SetRowProps {
  index: number;
  exerciseId: string;
  setItem: WorkoutSet;
  ghost: Log | null;
  canRemove: boolean;
  registerInputRef: (setId: string, ref: TextInput | null) => void;
  onLogSet: (exerciseId: string, setId: string) => void;
}

function SetRow({
  index,
  exerciseId,
  setItem,
  ghost,
  canRemove,
  registerInputRef,
  onLogSet,
}: SetRowProps) {
  const updateSetField = useWorkoutStore((state) => state.updateSetField);
  const removeSet = useWorkoutStore((state) => state.removeSet);

  const ghostWeightText = ghost ? formatWeight(ghost.weight) : null;
  const ghostRepsText = ghost ? String(ghost.reps) : null;
  const canLog =
    !setItem.isCompleted &&
    (setItem.weight.trim().length > 0 || ghostWeightText !== null) &&
    (setItem.reps.trim().length > 0 || ghostRepsText !== null);

  return (
    <View style={[styles.setRow, setItem.isCompleted && styles.setRowCompleted]}>
      <View style={styles.setMetaColumn}>
        <View
          style={[
            styles.setIndexBadge,
            setItem.isCompleted && styles.setIndexBadgeCompleted,
          ]}
        >
          <Text
            style={[
              styles.setIndexText,
              setItem.isCompleted && styles.setIndexTextCompleted,
            ]}
          >
            {index + 1}
          </Text>
        </View>
        <Text style={styles.ghostText} numberOfLines={1}>
          {ghost ? `Last: ${ghostWeightText}kg x ${ghost.reps}` : 'No previous data'}
        </Text>
      </View>

      <View style={styles.setInputsRow}>
        <TextInput
          editable={!setItem.isCompleted}
          keyboardType="number-pad"
          onChangeText={(value) => updateSetField(exerciseId, setItem.id, 'weight', value)}
          placeholder={ghostWeightText ?? '0'}
          placeholderTextColor="#5F5F5F"
          ref={(inputRef) => registerInputRef(setItem.id, inputRef)}
          selectionColor="#D4AF37"
          style={[styles.setInput, setItem.isCompleted && styles.setInputCompleted]}
          value={setItem.weight}
        />

        <TextInput
          editable={!setItem.isCompleted}
          keyboardType="number-pad"
          onChangeText={(value) => updateSetField(exerciseId, setItem.id, 'reps', value)}
          placeholder={ghostRepsText ?? '0'}
          placeholderTextColor="#5F5F5F"
          selectionColor="#D4AF37"
          style={[styles.setInput, setItem.isCompleted && styles.setInputCompleted]}
          value={setItem.reps}
        />

        <Pressable
          accessibilityRole="button"
          disabled={setItem.isCompleted || !canLog}
          onPress={() => onLogSet(exerciseId, setItem.id)}
          style={[
            styles.checkButton,
            setItem.isCompleted && styles.checkButtonCompleted,
            !setItem.isCompleted && !canLog && styles.checkButtonDisabled,
          ]}
        >
          <Ionicons
            color={setItem.isCompleted ? '#000000' : canLog ? '#D4AF37' : '#4A4A4A'}
            name="checkmark"
            size={18}
          />
        </Pressable>

        {canRemove ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => removeSet(exerciseId, setItem.id)}
            style={styles.deleteButton}
          >
            <Ionicons color="#5F5F5F" name="trash-outline" size={16} />
          </Pressable>
        ) : (
          <View style={styles.deleteButtonSpacer} />
        )}
      </View>
    </View>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  sets: WorkoutSet[];
  onLayoutExercise: (exerciseId: string, y: number) => void;
  registerInputRef: (setId: string, ref: TextInput | null) => void;
  onLogSet: (exerciseId: string, setId: string) => void;
}

function ExerciseCard({
  exercise,
  sets,
  onLayoutExercise,
  registerInputRef,
  onLogSet,
}: ExerciseCardProps) {
  const addSet = useWorkoutStore((state) => state.addSet);
  const getGhostForSetIndex = useWorkoutStore((state) => state.getGhostForSetIndex);
  const completedCount = sets.filter((setItem) => setItem.isCompleted).length;
  const isExerciseComplete = sets.length > 0 && completedCount === sets.length;

  return (
    <View
      onLayout={(event) => onLayoutExercise(exercise.id, event.nativeEvent.layout.y)}
      style={[styles.exerciseCard, isExerciseComplete && styles.exerciseCardComplete]}
    >
      <View style={styles.exerciseCardHeader}>
        <View style={styles.exerciseCardHeaderText}>
          <Text style={styles.exerciseCategory}>{exercise.category}</Text>
          <Text style={styles.exerciseCardTitle}>{exercise.name}</Text>
          <Text style={styles.exerciseTargetText}>
            Target: {exercise.targetSets} x {exercise.targetReps}
          </Text>
        </View>
        <View
          style={[
            styles.setsProgressPill,
            isExerciseComplete && styles.setsProgressPillComplete,
          ]}
        >
          <Text
            style={[
              styles.setsProgressText,
              isExerciseComplete && styles.setsProgressTextComplete,
            ]}
          >
            {completedCount}/{sets.length}
          </Text>
        </View>
      </View>

      <View style={styles.setList}>
        {sets.map((setItem, index) => (
          <SetRow
            canRemove={sets.length > 1}
            exerciseId={exercise.id}
            ghost={getGhostForSetIndex(exercise.id, index)}
            index={index}
            key={setItem.id}
            onLogSet={onLogSet}
            registerInputRef={registerInputRef}
            setItem={setItem}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => addSet(exercise.id)}
        style={styles.addSetButton}
      >
        <Ionicons color="#D4AF37" name="add" size={16} />
        <Text style={styles.addSetButtonText}>Add Set</Text>
      </Pressable>
    </View>
  );
}

export default function ActiveWorkoutScreen({ onExit }: ActiveWorkoutScreenProps) {
  const activeSession = useWorkoutStore((state) => state.activeSession);
  const workout = useWorkoutStore((state) => state.getActiveWorkout());
  const logSet = useWorkoutStore((state) => state.logSet);
  const resetActiveWorkout = useWorkoutStore((state) => state.resetActiveWorkout);

  const scrollViewRef = useRef<ScrollView>(null);
  const weightInputRefs = useRef<Record<string, TextInput | null>>({});
  const exerciseLayoutY = useRef<Record<string, number>>({});

  function registerInputRef(setId: string, inputRef: TextInput | null) {
    weightInputRefs.current[setId] = inputRef;
  }

  function handleLayoutExercise(exerciseId: string, y: number) {
    exerciseLayoutY.current[exerciseId] = y;
  }

  function returnToDashboard() {
    resetActiveWorkout();
    onExit();
  }

  function handleLogSet(exerciseId: string, setId: string) {
    const result = logSet(exerciseId, setId);

    if (!result.success || !workout) {
      return;
    }

    // Wait one frame so the row we just completed has re-rendered (and
    // become non-editable) before we try to move focus off it.
    requestAnimationFrame(() => {
      const state = useWorkoutStore.getState();

      if (!result.exerciseCompleted) {
        const nextSetId = state.getNextIncompleteSetId(exerciseId);
        if (nextSetId) {
          weightInputRefs.current[nextSetId]?.focus();
        }
        return;
      }

      if (result.workoutCompleted) {
        Keyboard.dismiss();
        scrollViewRef.current?.scrollToEnd({ animated: true });
        return;
      }

      const nextExercise = workout.exercises[state.activeSession?.currentExerciseIndex ?? 0];
      if (!nextExercise) {
        return;
      }

      const y = exerciseLayoutY.current[nextExercise.id] ?? 0;
      scrollViewRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });

      const nextSetId = state.getNextIncompleteSetId(nextExercise.id);
      if (nextSetId) {
        // Give the scroll animation a head start before pulling up the
        // keyboard, otherwise the scroll and keyboard fight each other.
        setTimeout(() => weightInputRefs.current[nextSetId]?.focus(), 380);
      }
    });
  }

  if (!activeSession || !workout) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.emptyTitle}>No Active Workout</Text>
        <Text style={styles.emptyCopy}>
          Pick a day from the dashboard to start logging.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onExit}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + (activeSession.exerciseSets[exercise.id]?.length ?? 0),
    0,
  );
  const completedSets = workout.exercises.reduce(
    (sum, exercise) =>
      sum +
      (activeSession.exerciseSets[exercise.id]?.filter((setItem) => setItem.isCompleted)
        .length ?? 0),
    0,
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={returnToDashboard}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.progressText}>
          {completedSets}/{totalSets} sets
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.workoutLabel}>{workout.title}</Text>
          <Text style={styles.workoutTitle}>Log Your Sets</Text>
        </View>

        {workout.exercises.map((exercise) => (
          <ExerciseCard
            exercise={exercise}
            key={exercise.id}
            onLayoutExercise={handleLayoutExercise}
            onLogSet={handleLogSet}
            registerInputRef={registerInputRef}
            sets={activeSession.exerciseSets[exercise.id] ?? []}
          />
        ))}

        {activeSession.completed ? (
          <View style={styles.completePanel}>
            <Text style={styles.completeEyebrow}>Complete</Text>
            <Text style={styles.completeTitle}>{workout.title} Crushed</Text>
            <Text style={styles.emptyCopy}>
              All sets logged. Recover hard and come back heavier.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={returnToDashboard}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderColor: '#232323',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '900',
  },
  progressText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
  },
  headerBlock: {
    marginBottom: 20,
  },
  workoutLabel: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  workoutTitle: {
    color: '#F5F5F5',
    fontSize: 28,
    fontWeight: '900',
  },
  exerciseCard: {
    backgroundColor: '#121212',
    borderColor: '#232323',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 14,
  },
  exerciseCardComplete: {
    borderColor: '#D4AF37',
  },
  exerciseCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  exerciseCardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseCategory: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  exerciseCardTitle: {
    color: '#F5F5F5',
    fontSize: 19,
    fontWeight: '900',
  },
  exerciseTargetText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  setsProgressPill: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 20,
    justifyContent: 'center',
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  setsProgressPillComplete: {
    backgroundColor: '#D4AF37',
  },
  setsProgressText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '900',
  },
  setsProgressTextComplete: {
    color: '#000000',
  },
  setList: {
    gap: 8,
  },
  setRow: {
    backgroundColor: '#000000',
    borderColor: '#1E1E1E',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  setRowCompleted: {
    backgroundColor: '#151107',
    borderColor: '#3A311A',
  },
  setMetaColumn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  setIndexBadge: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  setIndexBadgeCompleted: {
    backgroundColor: '#D4AF37',
  },
  setIndexText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
  },
  setIndexTextCompleted: {
    color: '#000000',
  },
  ghostText: {
    color: '#6B6B6B',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  setInputsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  setInput: {
    backgroundColor: '#121212',
    borderColor: '#2B2B2B',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F5F5F5',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    minHeight: 44,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  setInputCompleted: {
    borderColor: '#3A311A',
    color: '#D4AF37',
  },
  checkButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderColor: '#D4AF37',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  checkButtonCompleted: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  checkButtonDisabled: {
    borderColor: '#2B2B2B',
  },
  deleteButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 24,
  },
  deleteButtonSpacer: {
    width: 24,
  },
  addSetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingVertical: 4,
  },
  addSetButtonText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    minHeight: 58,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderColor: '#2B2B2B',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  centerScreen: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#F5F5F5',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyCopy: {
    color: '#A0A0A0',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  completePanel: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderColor: '#D4AF37',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    padding: 24,
  },
  completeEyebrow: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  completeTitle: {
    color: '#F5F5F5',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
});
