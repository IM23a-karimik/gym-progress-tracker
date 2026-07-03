import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkoutStore, ExerciseCategory, PlannedExercise } from '../store/workoutStore';

const EXERCISE_DATABASE: Array<{ id: string; name: string; category: ExerciseCategory }> = [
  { id: 'db_1', name: 'Barbell Bench Press', category: 'Chest' },
  { id: 'db_2', name: 'Incline Dumbbell Press', category: 'Chest' },
  { id: 'db_3', name: 'Cable Crossovers', category: 'Chest' },
  { id: 'db_4', name: 'Deadlift', category: 'Back' },
  { id: 'db_5', name: 'Lat Pulldown', category: 'Back' },
  { id: 'db_6', name: 'Barbell Row', category: 'Back' },
  { id: 'db_7', name: 'Squat', category: 'Legs' },
  { id: 'db_8', name: 'Leg Press', category: 'Legs' },
  { id: 'db_9', name: 'Romanian Deadlift', category: 'Legs' },
  { id: 'db_10', name: 'Overhead Press', category: 'Shoulders' },
  { id: 'db_11', name: 'Lateral Raises', category: 'Shoulders' },
  { id: 'db_12', name: 'Barbell Curl', category: 'Arms' },
  { id: 'db_13', name: 'Tricep Extension', category: 'Arms' },
  { id: 'db_14', name: 'Cable Crunches', category: 'Abs' },
  { id: 'db_15', name: 'Hanging Leg Raises', category: 'Abs' },
];

const COLORS = {
  background: '#000000',
  card: '#121212',
  accent: '#D4AF37',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  danger: '#FF4444',
  inputBg: '#080808',
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DashboardScreen() {
  const {
    selectedDay,
    days,
    setSelectedDay,
    setActivePreset,
    addExerciseToPreset,
    removeExerciseFromPreset,
    updateExerciseInPreset,
    reorderExercise,
  } = useWorkoutStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');

  const currentDayPlan = days[selectedDay];
  const activePresetId = currentDayPlan?.activePresetId || 'standard';
  const activePreset = currentDayPlan?.presets[activePresetId] || { id: 'standard', name: 'Standard Workout', exercises: [] };

  const handleAddExercise = (exerciseDef: typeof EXERCISE_DATABASE[0]) => {
    addExerciseToPreset(selectedDay, activePresetId, {
      name: exerciseDef.name,
      category: exerciseDef.category,
      targetSets: '3',
      targetReps: '10',
    });
    setModalVisible(false);
  };

  const filteredExercises = selectedCategory === 'All'
    ? EXERCISE_DATABASE
    : EXERCISE_DATABASE.filter(ex => ex.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Day Selector Tabs */}
        <View style={styles.dayTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsScroll}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, isSelected && styles.dayTabActive]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Preset Selector Sub-Tabs */}
        <View style={styles.presetTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetTabsScroll}>
            {currentDayPlan && Object.values(currentDayPlan.presets).map((preset) => {
              const isActive = preset.id === activePresetId;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetTab, isActive && styles.presetTabActive]}
                  onPress={() => setActivePreset(selectedDay, preset.id)}
                >
                  <Text style={[styles.presetTabText, isActive && styles.presetTabTextActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Exercises Content List */}
        <FlatList
          data={activePreset.exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.category}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => reorderExercise(selectedDay, activePresetId, index, 'up')} style={styles.iconBtn}>
                    <Text style={styles.iconText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => reorderExercise(selectedDay, activePresetId, index, 'down')} style={styles.iconBtn}>
                    <Text style={styles.iconText}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExerciseFromPreset(selectedDay, activePresetId, item.id)} style={styles.iconBtn}>
                    <Text style={[styles.iconText, { color: COLORS.danger }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricInputGroup}>
                  <Text style={styles.metricLabel}>SETS</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={item.targetSets}
                    onChangeText={(text) => updateExerciseInPreset(selectedDay, activePresetId, item.id, { targetSets: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.metricInputGroup}>
                  <Text style={styles.metricLabel}>REPS</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={item.targetReps}
                    onChangeText={(text) => updateExerciseInPreset(selectedDay, activePresetId, item.id, { targetReps: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tap "+ Add Exercise" to design this plan.</Text>
            </View>
          }
        />

        {/* Elegant Bottom Button Frame */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ ADD EXERCISE</Text>
          </TouchableOpacity>
        </View>

        {/* Modern Selection Slide-Up Drawer */}
        <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                {['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat as any)}
                  >
                    <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dbItemCard} onPress={() => handleAddExercise(item)}>
                  <View>
                    <Text style={styles.dbItemName}>{item.name}</Text>
                    <Text style={styles.dbItemCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.dbItemAddIcon}>+</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dayTabsContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#111111',
  },
  dayTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
  },
  dayTabActive: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  dayTabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  dayTabTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  presetTabsContainer: {
    paddingVertical: 12,
  },
  presetTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  presetTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  presetTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  presetTabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  presetTabTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  iconBtn: {
    paddingHorizontal: 4,
  },
  iconText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricInputGroup: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  metricInput: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
    borderRadius: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#262626',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: COLORS.accent,
  },
  categoryPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  modalListContent: {
    padding: 16,
  },
  dbItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  dbItemName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  dbItemCategory: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  dbItemAddIcon: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '600',
  },
});