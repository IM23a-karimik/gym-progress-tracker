import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useWorkoutStore } from '../store/workoutStore';

interface ActiveWorkoutScreenProps {
  onExit: () => void;
}

function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export default function ActiveWorkoutScreen({
  onExit,
}: ActiveWorkoutScreenProps) {
  const activeSession = useWorkoutStore((state) => state.activeSession);
  const draft = useWorkoutStore((state) => state.draft);
  const workout = useWorkoutStore((state) => state.getActiveWorkout());
  const exercise = useWorkoutStore((state) => state.getCurrentExercise());
  const lastLog = useWorkoutStore((state) => state.getLastLogForCurrentExercise());
  const logSetAndAdvance = useWorkoutStore((state) => state.logSetAndAdvance);
  const resetActiveWorkout = useWorkoutStore((state) => state.resetActiveWorkout);
  const updateDraft = useWorkoutStore((state) => state.updateDraft);
  const isDraftValid =
    Number(draft.weight.replace(',', '.')) > 0 &&
    Number.parseInt(draft.reps, 10) > 0;

  function returnToDashboard() {
    resetActiveWorkout();
    onExit();
  }

  function handleLogSet() {
    logSetAndAdvance();
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

  if (activeSession.completed || !exercise) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.completeEyebrow}>Complete</Text>
        <Text style={styles.completeTitle}>{workout.title}</Text>
        <Text style={styles.emptyCopy}>
          Sets logged. Next session has a cleaner target to beat.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={returnToDashboard}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  const progressText = `${activeSession.currentExerciseIndex + 1} / ${
    workout.exercises.length
  }`;
  const lastSessionText = lastLog
    ? `Last ${workout.title}: ${formatWeight(lastLog.weight)}kg x ${
        lastLog.reps
      } reps`
    : `Last ${workout.title}: No previous set logged`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={returnToDashboard}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        <View style={styles.exerciseBlock}>
          <Text style={styles.workoutLabel}>{workout.title}</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseTarget}>
            {exercise.targetSets} sets x {exercise.targetReps} reps
          </Text>
        </View>

        <View style={styles.lastSessionPanel}>
          <Text style={styles.lastSessionLabel}>Beat This</Text>
          <Text style={styles.lastSessionText}>{lastSessionText}</Text>
        </View>

        <View style={styles.inputGrid}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Weight</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => updateDraft('weight', value)}
              placeholder="0"
              placeholderTextColor="#5F5F5F"
              selectionColor="#D4AF37"
              style={styles.input}
              value={draft.weight}
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Reps</Text>
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => updateDraft('reps', value)}
              placeholder="0"
              placeholderTextColor="#5F5F5F"
              selectionColor="#D4AF37"
              style={styles.input}
              value={draft.reps}
            />
            <Text style={styles.inputUnit}>reps</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!isDraftValid}
          onPress={handleLogSet}
          style={[
            styles.primaryButton,
            !isDraftValid && styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              !isDraftValid && styles.primaryButtonTextDisabled,
            ]}
          >
            Log Set & Next
          </Text>
        </Pressable>
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
    justifyContent: 'center',
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
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
  exerciseBlock: {
    marginBottom: 24,
  },
  workoutLabel: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  exerciseName: {
    color: '#F5F5F5',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 44,
  },
  exerciseTarget: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  lastSessionPanel: {
    backgroundColor: '#121212',
    borderColor: '#2B2B2B',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 22,
    padding: 16,
  },
  lastSessionLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  lastSessionText: {
    color: '#F5F5F5',
    fontSize: 18,
    fontWeight: '900',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  inputBlock: {
    backgroundColor: '#121212',
    borderColor: '#2B2B2B',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  inputLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  input: {
    color: '#F5F5F5',
    fontSize: 34,
    fontWeight: '900',
    minHeight: 58,
    padding: 0,
  },
  inputUnit: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    backgroundColor: '#1D1D1D',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  primaryButtonTextDisabled: {
    color: '#666666',
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
  completeEyebrow: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  completeTitle: {
    color: '#F5F5F5',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
});
