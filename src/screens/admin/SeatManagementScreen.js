import React, {useState, useEffect, useContext} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, FlatList,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {UserContext} from '../../context/UserContext';
import {useTheme} from '../../context/ThemeContext';
import {getFloors, getSeatsByFloor, addSeat, toggleSeat, updateSeatMonitor} from '../../services/seatService';
import {COLORS} from '../../theme/colors';
import Loader from '../../components/Loader';

export default function SeatManagementScreen() {
  const {employee} = useContext(UserContext);
  const {t} = useTheme();
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

  const loadSeats = async floorId => {
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
      setSeats(prev => [...prev, seat]);
      setNewLabel('');
      setNewHasMonitor(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add seat');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleEnabled = async seat => {
    try {
      await toggleSeat(seat.id, seat.enabled);
      setSeats(prev => prev.map(s => s.id === seat.id ? {...s, enabled: !s.enabled} : s));
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle seat');
    }
  };

  const handleToggleMonitor = async (seat, value) => {
    try {
      await updateSeatMonitor(seat.id, value);
      setSeats(prev => prev.map(s => s.id === seat.id ? {...s, has_monitor: value} : s));
    } catch (err) {
      Alert.alert('Error', 'Failed to update monitor');
    }
  };

  const renderSeat = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 25).duration(300)}
      style={[
        styles.seatCard,
        {backgroundColor: item.enabled ? COLORS.seatEnabledBg : COLORS.seatDisabledBgCard},
      ]}>
      <View style={styles.seatTop}>
        <Text style={styles.seatLabel}>{item.label}</Text>
        <Switch
          value={!!item.enabled}
          onValueChange={() => handleToggleEnabled(item)}
          trackColor={{true: 'rgba(255,255,255,0.4)', false: 'rgba(255,255,255,0.2)'}}
          thumbColor="#fff"
        />
      </View>
      <Text style={styles.seatFloor}>{item.floors?.name || ''}</Text>
      <View style={styles.monitorRow}>
        <Text style={styles.monitorLabel}>Monitor</Text>
        <Switch
          value={!!item.has_monitor}
          onValueChange={v => handleToggleMonitor(item, v)}
          trackColor={{true: 'rgba(255,255,255,0.5)', false: 'rgba(255,255,255,0.2)'}}
          thumbColor="#fff"
        />
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, {backgroundColor: t.bg}]}>

      {/* Floor selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorRow}>
        {floors.map(floor => (
          <TouchableOpacity
            key={floor.id}
            style={[
              styles.floorChip,
              {backgroundColor: t.chipBg, borderColor: t.chipBorder},
              selectedFloorId === floor.id && {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
            ]}
            onPress={() => setSelectedFloorId(floor.id)}>
            <Text style={[
              styles.floorChipText,
              {color: t.textSub},
              selectedFloorId === floor.id && {color: '#fff', fontWeight: '700'},
            ]}>
              {floor.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add seat form */}
      <View style={[styles.addForm, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
        <Text style={[styles.addFormTitle, {color: t.text}]}>Add New Seat</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
            placeholder="Seat label (e.g. A1)"
            placeholderTextColor={t.textTertiary}
            value={newLabel}
            onChangeText={setNewLabel}
          />
          <View style={styles.monitorToggle}>
            <Text style={[styles.monitorToggleLabel, {color: t.textSub}]}>Monitor</Text>
            <Switch
              value={newHasMonitor}
              onValueChange={setNewHasMonitor}
              trackColor={{true: COLORS.primary, false: t.chipBorder}}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity
            style={[styles.addBtn, {backgroundColor: COLORS.primary}]}
            onPress={handleAddSeat}
            disabled={adding}>
            <Text style={styles.addBtnText}>{adding ? '…' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={28} />
        </View>
      ) : (
        <FlatList
          data={seats}
          keyExtractor={item => String(item.id)}
          renderItem={renderSeat}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},

  floorRow: {marginBottom: 14},
  floorChip: {
    borderRadius: 24, paddingVertical: 8, paddingHorizontal: 18,
    marginRight: 8, borderWidth: 1.5,
  },
  floorChipText: {fontSize: 13, fontWeight: '600'},

  addForm: {
    borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1,
  },
  addFormTitle: {fontWeight: '700', fontSize: 14, marginBottom: 10},
  addRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  input: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  monitorToggle: {flexDirection: 'row', alignItems: 'center', gap: 4},
  monitorToggleLabel: {fontSize: 12, fontWeight: '600'},
  addBtn: {
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  grid: {paddingBottom: 24},
  gridRow: {gap: 10, marginBottom: 10},
  seatCard: {
    flex: 1, borderRadius: 14, padding: 12, minHeight: 96,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  seatTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  seatLabel: {color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: -0.5},
  seatFloor: {color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2, fontWeight: '500'},
  monitorRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8},
  monitorLabel: {color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600'},
});
