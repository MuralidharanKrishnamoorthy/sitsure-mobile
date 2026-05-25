import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { getAnchorDays, upsertAnchorDay } from '../../services/bookingService';
import { getTodayInKolkata, formatDate } from '../../utils/dateUtils';
import { COLORS } from '../../theme/colors';
import Loader from '../../components/Loader';

const GROUP_OPTIONS = ['ALL', 'SDOS', 'SDL', 'QA'];
const GROUP_COLORS = COLORS.groupColors;

function normalizeGroups(groups) {
  const upper = groups.map((g) => g.trim().toUpperCase()).filter(Boolean);
  const expanded = [];
  upper.forEach((g) => {
    if (g === 'ALL') {
      expanded.push('SDOS', 'SDL', 'QA');
    } else {
      expanded.push(g);
    }
  });
  return [...new Set(expanded)];
}

function GroupChip({ group }) {
  const cfg = GROUP_COLORS[group] || { bg: '#eee', text: '#333' };
  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.chipText, { color: cfg.text }]}>{group}</Text>
    </View>
  );
}

export default function AnchorDaysScreen() {
  const [anchorDays, setAnchorDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const today = getTodayInKolkata();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAnchorDays();
      setAnchorDays(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load anchor days');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleGroup = (g) => {
    setSelectedGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleAdd = async () => {
    if (!newDate || selectedGroups.length === 0) {
      Alert.alert('Validation', 'Date and at least one group required');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || isNaN(Date.parse(newDate))) {
      Alert.alert('Validation', 'Date must be in YYYY-MM-DD format (e.g. 2026-06-15)');
      return;
    }
    try {
      await upsertAnchorDay({ date: newDate, groups: normalizeGroups(selectedGroups) });
      setNewDate('');
      setSelectedGroups([]);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add anchor day');
    }
  };

  const upcoming = anchorDays.filter((d) => d.upcoming);
  const past = anchorDays.filter((d) => !d.upcoming).reverse();

  const renderRow = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
      <View style={styles.groupsRow}>
        {(item.groups || []).map((g) => <GroupChip key={g} group={g} />)}
      </View>
      <Text style={styles.rowCount}>{item.bookingCount ?? 0}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Anchor Days</Text>

      {/* Add form */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Anchor Day</Text>
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={newDate}
          onChangeText={setNewDate}
        />
        <View style={styles.groupPicker}>
          {GROUP_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.groupOption, selectedGroups.includes(g) && styles.groupOptionActive]}
              onPress={() => toggleGroup(g)}
            >
              <Text style={[styles.groupOptionText, selectedGroups.includes(g) && styles.groupOptionTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loader color={COLORS.primary} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Upcoming Anchor Days</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.empty}>No upcoming anchor days.</Text>
          ) : (
            <View style={styles.table}>
              {upcoming.map((item) => renderRow({ item }))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Past Anchor Days</Text>
          {past.length === 0 ? (
            <Text style={styles.empty}>No past anchor days.</Text>
          ) : (
            <View style={styles.table}>
              {past.map((item) => renderRow({ item }))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  addCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
  addTitle: { fontWeight: '700', marginBottom: 8, color: COLORS.textPrimaryLight },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', marginBottom: 8,
  },
  groupPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  groupOption: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 16,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  groupOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  groupOptionText: { color: '#555', fontWeight: '600', fontSize: 13 },
  groupOptionTextActive: { color: '#fff' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 6, padding: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 8 },
  empty: { color: '#999', fontSize: 13, marginBottom: 8 },
  table: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowDate: { flex: 2, fontSize: 13, fontWeight: '600' },
  groupsRow: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rowCount: { width: 32, textAlign: 'right', fontWeight: '700', color: COLORS.primary },
  chip: { borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  chipText: { fontSize: 11, fontWeight: '600' },
});
