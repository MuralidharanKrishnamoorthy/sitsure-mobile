import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { getFloors, createFloor, updateFloor } from '../../services/floorService';
import { COLORS } from '../../theme/colors';
import Loader from '../../components/Loader';

export default function FloorManagementScreen() {
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

  const handleUpdate = async (id) => {
    try {
      await updateFloor(id, editName, editDesc);
      setEditingId(null);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update floor');
    }
  };

  const renderFloor = ({ item }) => (
    <View style={styles.card}>
      {editingId === item.id ? (
        <View>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Floor name" />
          <TextInput style={styles.input} value={editDesc} onChangeText={setEditDesc} placeholder="Description" />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdate(item.id)}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.floorName}>{item.name}</Text>
            {item.description ? <Text style={styles.floorDesc}>{item.description}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => { setEditingId(item.id); setEditName(item.name); setEditDesc(item.description || ''); }}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Floor Management</Text>
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Floor</Text>
        <TextInput style={styles.input} placeholder="Floor name" value={newName} onChangeText={setNewName} />
        <TextInput style={styles.input} placeholder="Description" value={newDesc} onChangeText={setNewDesc} />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Loader color={COLORS.primary} />
      ) : (
        <FlatList
          data={floors}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFloor}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  addCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
  addTitle: { fontWeight: '700', marginBottom: 8, color: COLORS.textPrimaryLight },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', marginBottom: 8,
  },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 6, padding: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  floorName: { fontWeight: '700', fontSize: 15 },
  floorDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  editBtn: { backgroundColor: '#e3f2fd', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  editBtnText: { color: '#1976d2', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8 },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 6, padding: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: '#eee', borderRadius: 6, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontWeight: '600' },
});
