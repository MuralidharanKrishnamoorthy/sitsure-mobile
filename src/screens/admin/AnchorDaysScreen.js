import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
  const { t } = useTheme();
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
    <View style={[styles.row, { borderBottomColor: t.divider }]}>
      <Text style={[styles.rowDate, { color: t.text }]}>{formatDate(item.date)}</Text>
      <View style={styles.groupsRow}>
        {(item.groups || []).map((g) => <GroupChip key={g} group={g} />)}
      </View>
      <Text style={[styles.rowCount, { color: COLORS.primary }]}>{item.bookingCount ?? 0}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: COLORS.primary }]}>Anchor Days</Text>

      {/* Add form */}
      <View style={[styles.addCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
        <Text style={[styles.addTitle, { color: t.text }]}>Add Anchor Day</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={t.textTertiary}
          value={newDate}
          onChangeText={setNewDate}
        />
        <View style={styles.groupPicker}>
          {GROUP_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.groupOption, { borderColor: t.chipBorder }, selectedGroups.includes(g) && styles.groupOptionActive]}
              onPress={() => toggleGroup(g)}
            >
              <Text style={[styles.groupOptionText, { color: t.textSub }, selectedGroups.includes(g) && styles.groupOptionTextActive]}>
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
          <Text style={[styles.sectionTitle, { color: t.text }]}>Upcoming Anchor Days</Text>
          {upcoming.length === 0 ? (
            <Text style={[styles.empty, { color: t.textTertiary }]}>No upcoming anchor days.</Text>
          ) : (
            <View style={[styles.table, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              {upcoming.map((item) => renderRow({ item }))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: t.text }]}>Past Anchor Days</Text>
          {past.length === 0 ? (
            <Text style={[styles.empty, { color: t.textTertiary }]}>No past anchor days.</Text>
          ) : (
            <View style={[styles.table, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              {past.map((item) => renderRow({ item }))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  addCard: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  addTitle: { fontWeight: '700', marginBottom: 10, fontSize: 14 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, marginBottom: 10,
  },
  groupPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  groupOption: {
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 9, paddingHorizontal: 16,   // min 44px hit area via padding
    minHeight: 38,
    justifyContent: 'center', alignItems: 'center',
  },
  groupOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  groupOptionText: { fontWeight: '700', fontSize: 13 },
  groupOptionTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontWeight: '700', fontSize: 14, marginTop: 18, marginBottom: 8, letterSpacing: 0.2 },
  empty: { fontSize: 13, marginBottom: 8 },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowDate: { flex: 2, fontSize: 13, fontWeight: '600' },
  groupsRow: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rowCount: { width: 36, textAlign: 'right', fontWeight: '800', fontSize: 14 },
  chip: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },
  chipText: { fontSize: 11, fontWeight: '700' },
});
