import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, FlatList,
} from 'react-native';
import { UserContext } from '../../context/UserContext';
import { getFloors, getSeatsByFloor, addSeat, toggleSeat, updateSeatMonitor } from '../../services/seatService';
import { COLORS } from '../../theme/colors';
import Loader from '../../components/Loader';

export default function SeatManagementScreen() {
  const { employee } = useContext(UserContext);
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHasMonitor, setNewHasMonitor] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadFloors = async () => {
    const data = await getFloors();
    setFloors(data);
    if (data.length > 0) setSelectedFloorId(data[0].id);
  };

  const loadSeats = async (floorId) => {
    if (!floorId) return;
    setLoading(true);
    try {
      const data = await getSeatsByFloor(floorId);
      setSeats(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFloors(); }, []);
  useEffect(() => { if (selectedFloorId) loadSeats(selectedFloorId); }, [selectedFloorId]);

  const handleAddSeat = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const seat = await addSeat(newLabel.trim(), selectedFloorId, employee?.email, newHasMonitor);
      setSeats((prev) => [...prev, seat]);
      setNewLabel('');
      setNewHasMonitor(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add seat');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleEnabled = async (seat) => {
    try {
      await toggleSeat(seat.id, seat.enabled);
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, enabled: !s.enabled } : s))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle seat');
    }
  };

  const handleToggleMonitor = async (seat, value) => {
    try {
      await updateSeatMonitor(seat.id, value);
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, has_monitor: value } : s))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update monitor');
    }
  };

  const renderSeat = ({ item }) => (
    <View style={[styles.seatCard, { backgroundColor: item.enabled ? COLORS.seatEnabledBg : COLORS.seatDisabledBgCard }]}>
      <View style={styles.seatTop}>
        <Text style={styles.seatLabel}>{item.label}</Text>
        <Switch
          value={!!item.enabled}
          onValueChange={() => handleToggleEnabled(item)}
          trackColor={{ true: '#a5d6a7', false: '#ef9a9a' }}
          thumbColor="#fff"
        />
      </View>
      <Text style={styles.seatFloor}>{item.floors?.name || ''}</Text>
      <View style={styles.monitorRow}>
        <Text style={styles.monitorLabel}>Monitor</Text>
        <Switch
          value={!!item.has_monitor}
          onValueChange={(v) => handleToggleMonitor(item, v)}
          trackColor={{ true: COLORS.monitorBadge }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Management</Text>

      {/* Floor selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorRow}>
        {floors.map((floor) => (
          <TouchableOpacity
            key={floor.id}
            style={[styles.floorChip, selectedFloorId === floor.id && styles.floorChipActive]}
            onPress={() => setSelectedFloorId(floor.id)}
          >
            <Text style={[styles.floorChipText, selectedFloorId === floor.id && styles.floorChipTextActive]}>
              {floor.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add seat form */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Seat label (e.g. A1)"
          value={newLabel}
          onChangeText={setNewLabel}
        />
        <View style={styles.monitorToggle}>
          <Text style={styles.monitorLabel}>Monitor</Text>
          <Switch value={newHasMonitor} onValueChange={setNewHasMonitor} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddSeat} disabled={adding}>
          <Text style={styles.addBtnText}>{adding ? '...' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loader color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={seats}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSeat}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  floorRow: { marginBottom: 12 },
  floorChip: {
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8,
    backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd',
  },
  floorChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  floorChipText: { color: '#555', fontSize: 13 },
  floorChipTextActive: { color: '#fff', fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff',
  },
  monitorToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monitorLabel: { fontSize: 12, color: '#555' },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  grid: { paddingBottom: 24 },
  gridRow: { gap: 8, marginBottom: 8 },
  seatCard: {
    flex: 1, borderRadius: 8, padding: 10, minHeight: 90,
  },
  seatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seatLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
  seatFloor: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  monitorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
});
