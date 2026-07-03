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

// Mock Database for the premium selection modal
// In the future, this can be swapped with your Supabase fetch logic
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
  borderDark: '#1A1A1A',
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES: Array<ExerciseCategory | 'All'> = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'];

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
  const activePreset = currentDayPlan?.presets[activePresetId] || { id: 'standard', name: 'Default Split', exercises: [] };

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

        {/* Day Selector Navigation */}
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

        {/* Dynamic Preset Navigation Tabs */}
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

        {/* Active Exercise List */}
        <FlatList
          data={activePreset.exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
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
                    <Text style={[styles.iconText, styles.dangerText]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricInputGroup}>
                  <Text style={styles.metricLabel}>TARGET SETS</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={item.targetSets}
                    onChangeText={(text) => updateExerciseInPreset(selectedDay, activePresetId, item.id, { targetSets: text })}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                <View style={styles.metricInputGroup}>
                  <Text style={styles.metricLabel}>TARGET REPS</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={item.targetReps}
                    onChangeText={(text) => updateExerciseInPreset(selectedDay, activePresetId, item.id, { targetReps: text })}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises in this preset.</Text>
              <Text style={styles.emptySubText}>Tap the button below to design your plan.</Text>
            </View>
          }
        />

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ ADD EXERCISE TO PRESET</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Full-Screen Modal for Exercise Selection */}
        <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat)}
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
                  <View style={styles.dbItemAddButton}>
                    <Text style={styles.dbItemAddIcon}>+</Text>
                  </View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  dayTabsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dayTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
  dayTabActive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  dayTabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTabTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  presetTabsContainer: {
    paddingVertical: 16,
  },
  presetTabsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  presetTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  presetTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  presetTabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  presetTabTextActive: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Extra padding to clear the absolute bottom bar
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBtn: {
    paddingHorizontal: 4,
  },
  iconText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerText: {
    color: COLORS.danger,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  metricInputGroup: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  metricInput: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryFilterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  categoryPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryPillText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryPillTextActive: {
    color: COLORS.background,
  },
  modalListContent: {
    padding: 16,
  },
  dbItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  dbItemName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dbItemCategory: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  dbItemAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  dbItemAddIcon: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});