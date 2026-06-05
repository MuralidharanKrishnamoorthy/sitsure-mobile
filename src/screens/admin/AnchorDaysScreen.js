import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useTheme} from '../../context/ThemeContext';
import {getAnchorDays, upsertAnchorDay} from '../../services/bookingService';
import {getTodayInKolkata, formatDate} from '../../utils/dateUtils';
import {COLORS} from '../../theme/colors';
import Loader from '../../components/Loader';

const GROUP_OPTIONS = ['ALL', 'SDOS', 'SDL', 'QA'];
const GROUP_COLORS = COLORS.groupColors;

function normalizeGroups(groups) {
  const upper = groups.map(g => g.trim().toUpperCase()).filter(Boolean);
  const expanded = [];
  upper.forEach(g => {
    if (g === 'ALL') {
      expanded.push('SDOS', 'SDL', 'QA');
    } else {
      expanded.push(g);
    }
  });
  return [...new Set(expanded)];
}

function GroupChip({group}) {
  const cfg = GROUP_COLORS[group] || {bg: COLORS.primaryMuted, text: COLORS.primary};
  return (
    <View style={[chipStyles.wrap, {backgroundColor: cfg.bg}]}>
      <Text style={[chipStyles.text, {color: cfg.text}]}>{group}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9},
  text: {fontSize: 11, fontWeight: '700'},
});

export default function AnchorDaysScreen() {
  const {t} = useTheme();
  const [anchorDays, setAnchorDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

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

  const toggleGroup = g => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
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
      await upsertAnchorDay({date: newDate, groups: normalizeGroups(selectedGroups)});
      setNewDate('');
      setSelectedGroups([]);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add anchor day');
    }
  };

  const upcoming = anchorDays.filter(d => d.upcoming);
  const past = anchorDays.filter(d => !d.upcoming).reverse();

  const renderRow = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(300)}
      style={[styles.row, {borderBottomColor: t.divider}]}>
      <View style={styles.rowDateWrap}>
        <Text style={[styles.rowDate, {color: t.text}]}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.groupsRow}>
        {(item.groups || []).map(g => <GroupChip key={g} group={g} />)}
      </View>
      <View style={[styles.countBadge, {backgroundColor: COLORS.primaryMuted}]}>
        <Text style={[styles.rowCount, {color: COLORS.primary}]}>{item.bookingCount ?? 0}</Text>
      </View>
    </Animated.View>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: t.bg}]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Add form */}
      <View style={[styles.addCard, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
        <Text style={[styles.addTitle, {color: t.text}]}>Add Anchor Day</Text>
        <TextInput
          style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={t.textTertiary}
          value={newDate}
          onChangeText={setNewDate}
        />
        <View style={styles.groupPicker}>
          {GROUP_OPTIONS.map(g => (
            <TouchableOpacity
              key={g}
              style={[
                styles.groupOption,
                {borderColor: t.chipBorder},
                selectedGroups.includes(g) && {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
              ]}
              onPress={() => toggleGroup(g)}>
              <Text style={[
                styles.groupOptionText,
                {color: t.textSub},
                selectedGroups.includes(g) && {color: '#fff'},
              ]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, {backgroundColor: COLORS.primary}]}
          onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add Anchor Day</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={28} />
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, {color: t.text}]}>Upcoming</Text>
          {upcoming.length === 0 ? (
            <Text style={[styles.empty, {color: t.textTertiary}]}>No upcoming anchor days.</Text>
          ) : (
            <View style={[styles.table, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
              <FlatList
                data={upcoming}
                keyExtractor={item => item.date}
                renderItem={renderRow}
                scrollEnabled={false}
              />
            </View>
          )}

          <Text style={[styles.sectionTitle, {color: t.text}]}>Past</Text>
          {past.length === 0 ? (
            <Text style={[styles.empty, {color: t.textTertiary}]}>No past anchor days.</Text>
          ) : (
            <View style={[styles.table, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
              <FlatList
                data={past}
                keyExtractor={item => item.date}
                renderItem={renderRow}
                scrollEnabled={false}
              />
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 40},
  loaderWrap: {alignItems: 'center', paddingTop: 40},

  addCard: {
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  addTitle: {fontWeight: '800', fontSize: 15, marginBottom: 12, letterSpacing: -0.2},
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginBottom: 12,
  },
  groupPicker: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14},
  groupOption: {
    borderWidth: 1.5, borderRadius: 22,
    paddingVertical: 9, paddingHorizontal: 16,
    minHeight: 38, justifyContent: 'center', alignItems: 'center',
  },
  groupOptionText: {fontWeight: '700', fontSize: 13},
  addBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  sectionTitle: {
    fontWeight: '800', fontSize: 14, marginTop: 20, marginBottom: 10,
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
  empty: {fontSize: 13, marginBottom: 8},
  table: {borderRadius: 14, overflow: 'hidden', borderWidth: 1},
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  rowDateWrap: {flex: 2},
  rowDate: {fontSize: 13, fontWeight: '600'},
  groupsRow: {flex: 3, flexDirection: 'row', flexWrap: 'wrap', gap: 4},
  countBadge: {borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, minWidth: 32, alignItems: 'center'},
  rowCount: {fontWeight: '900', fontSize: 14},
});
