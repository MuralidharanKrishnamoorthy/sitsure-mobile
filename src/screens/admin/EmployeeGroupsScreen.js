import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { UserContext } from '../../context/UserContext';
import { getEmployeeGroups, upsertEmployeeGroup } from '../../services/employeeGroupService';
import { getGraphUserProfile } from '../../services/graphService';
import { COLORS } from '../../theme/colors';
import Loader from '../../components/Loader';

const GROUP_OPTIONS = ['SDOS', 'SDL', 'QA', 'VENZO'];
const GROUP_COLORS = COLORS.groupColors;

function normalizeGroups(groups) {
  return [...new Set(groups.map((g) => g.trim().toUpperCase()).filter(Boolean))];
}

function getPrimaryPalette(groups) {
  for (const g of groups) {
    if (GROUP_COLORS[g.toUpperCase()]) return GROUP_COLORS[g.toUpperCase()];
  }
  return { bg: '#f5f5f5', text: '#555' };
}

function GroupChip({ group }) {
  const cfg = GROUP_COLORS[group.toUpperCase()] || { bg: '#eee', text: '#333' };
  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.chipText, { color: cfg.text }]}>{group}</Text>
    </View>
  );
}

export default function EmployeeGroupsScreen() {
  const { accessToken } = useContext(UserContext);
  const [groups, setGroups] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeGroups();
      setGroups(data);
      if (accessToken) {
        const photoMap = {};
        await Promise.all(
          data.map(async (entry) => {
            const profile = await getGraphUserProfile(entry.email, accessToken);
            if (profile?.photoUrl) photoMap[entry.email] = profile.photoUrl;
          })
        );
        setPhotos(photoMap);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load employee groups');
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
    if (!email.trim() || selectedGroups.length === 0) {
      Alert.alert('Validation', 'Email and at least one group required');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Validation', 'Enter a valid email address');
      return;
    }
    try {
      await upsertEmployeeGroup({ email: email.trim().toLowerCase(), groups: normalizeGroups(selectedGroups) });
      setEmail('');
      setSelectedGroups([]);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to assign groups');
    }
  };

  const renderCard = ({ item }) => {
    const palette = getPrimaryPalette(item.groups || []);
    const photoUrl = photos[item.email];
    const initial = item.email[0].toUpperCase();

    return (
      <View style={[styles.card, { borderLeftColor: palette.text, backgroundColor: palette.bg }]}>
        <View style={styles.cardHeader}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: palette.text }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.cardEmail}>{item.email}</Text>
            <Text style={styles.cardCount}>{item.bookingCount ?? 0} bookings</Text>
          </View>
        </View>
        <View style={styles.groupsRow}>
          {(item.groups || []).map((g) => <GroupChip key={g} group={g} />)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employee Groups</Text>

      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder="user@venzotechnologies.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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
        <FlatList
          data={groups}
          keyExtractor={(item) => item.email}
          renderItem={renderCard}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  addCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8, backgroundColor: '#fff',
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
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 20, marginRight: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardInfo: { flex: 1 },
  cardEmail: { fontWeight: '600', fontSize: 13 },
  cardCount: { fontSize: 12, color: '#666', marginTop: 2 },
  groupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  chipText: { fontSize: 11, fontWeight: '600' },
});
