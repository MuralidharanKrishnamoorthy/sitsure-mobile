import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useTheme} from '../../context/ThemeContext';
import {getFloors, createFloor, updateFloor} from '../../services/floorService';
import {COLORS} from '../../theme/colors';
import Loader from '../../components/Loader';

export default function FloorManagementScreen() {
  const {t} = useTheme();
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFloors();
      setFloors(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFloor(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create floor');
    }
  };

  const handleUpdate = async id => {
    try {
      await updateFloor(id, editName, editDesc);
      setEditingId(null);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update floor');
    }
  };

  const renderFloor = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(350)}
      style={[styles.card, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
      {editingId === item.id ? (
        <View style={styles.editForm}>
          <TextInput
            style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Floor name"
            placeholderTextColor={t.textTertiary}
          />
          <TextInput
            style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
            value={editDesc}
            onChangeText={setEditDesc}
            placeholder="Description"
            placeholderTextColor={t.textTertiary}
          />
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.saveBtn, {backgroundColor: COLORS.primary}]}
              onPress={() => handleUpdate(item.id)}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, {backgroundColor: t.chipBg, borderColor: t.chipBorder}]}
              onPress={() => setEditingId(null)}>
              <Text style={[styles.cancelBtnText, {color: t.textSub}]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cardContent}>
          <View style={[styles.floorIconWrap, {backgroundColor: COLORS.primaryMuted}]}>
            <Text style={[styles.floorIconText, {color: COLORS.primary}]}>
              {item.name?.[0]?.toUpperCase() || 'F'}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.floorName, {color: t.text}]}>{item.name}</Text>
            {item.description ? (
              <Text style={[styles.floorDesc, {color: t.textSub}]}>{item.description}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.editBtn, {backgroundColor: COLORS.primaryMuted}]}
            onPress={() => {setEditingId(item.id); setEditName(item.name); setEditDesc(item.description || '');}}>
            <Text style={[styles.editBtnText, {color: COLORS.primary}]}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, {backgroundColor: t.bg}]}>

      {/* Add floor form */}
      <View style={[styles.addCard, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
        <Text style={[styles.addTitle, {color: t.text}]}>Add Floor</Text>
        <TextInput
          style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
          placeholder="Floor name"
          placeholderTextColor={t.textTertiary}
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={[styles.input, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
          placeholder="Description (optional)"
          placeholderTextColor={t.textTertiary}
          value={newDesc}
          onChangeText={setNewDesc}
        />
        <TouchableOpacity
          style={[styles.createBtn, {backgroundColor: COLORS.primary}]}
          onPress={handleCreate}>
          <Text style={styles.createBtnText}>Create Floor</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={28} />
        </View>
      ) : (
        <FlatList
          data={floors}
          keyExtractor={item => String(item.id)}
          renderItem={renderFloor}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {paddingBottom: 32},

  addCard: {
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  addTitle: {fontWeight: '800', fontSize: 15, marginBottom: 12, letterSpacing: -0.2},
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, marginBottom: 10,
  },
  createBtn: {
    borderRadius: 12, padding: 13, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  createBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  card: {
    borderRadius: 14, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardContent: {flexDirection: 'row', alignItems: 'center', gap: 12},
  floorIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  floorIconText: {fontWeight: '900', fontSize: 16},
  cardInfo: {flex: 1},
  floorName: {fontWeight: '700', fontSize: 15, letterSpacing: -0.2},
  floorDesc: {fontSize: 13, marginTop: 2},

  editBtn: {
    borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14,
  },
  editBtnText: {fontWeight: '700', fontSize: 13},

  editForm: {gap: 0},
  btnRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  saveBtn: {flex: 1, borderRadius: 10, padding: 11, alignItems: 'center'},
  saveBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  cancelBtn: {flex: 1, borderRadius: 10, padding: 11, alignItems: 'center', borderWidth: 1},
  cancelBtnText: {fontWeight: '600', fontSize: 14},
});
