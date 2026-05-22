import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { getUserBookingHistory, cancelBookingById } from '../services/bookingService';
import { getTodayInKolkata, formatDate } from '../utils/dateUtils';
import { COLORS } from '../theme/colors';

function StatusBadge({ status }) {
  const map = {
    booked: { bg: '#e8f5e9', text: COLORS.statusBooked, label: 'Booked' },
    completed: { bg: '#e3f2fd', text: COLORS.statusCompleted, label: 'Completed' },
    cancelled: { bg: '#ffebee', text: COLORS.statusCancelled, label: 'Cancelled' },
  };
  const cfg = map[status] || { bg: '#fff3e0', text: COLORS.statusWarning, label: status };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { employee } = useContext(UserContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const today = getTodayInKolkata();

  const loadHistory = useCallback(async () => {
    if (!employee?.email) return;
    setLoading(true);
    try {
      const data = await getUserBookingHistory(employee.email, { limit: 50 });
      setBookings(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  }, [employee?.email]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await cancelBookingById(bookingId);
      setConfirmingId(null);
      await loadHistory();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isUpcoming = item.status === 'booked' && item.date >= today;
    const floorName = item.seat?.floor?.name || '';
    const seatLabel = item.seat?.label || '';

    return (
      <View style={styles.row}>
        <View style={styles.rowMain}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.seatText}>{floorName ? `${floorName}-${seatLabel}` : seatLabel}</Text>
          <StatusBadge status={item.status} />
        </View>
        {isUpcoming && (
          <View style={styles.actionCell}>
            {confirmingId === item.id ? (
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  style={styles.keepBtn}
                  onPress={() => setConfirmingId(null)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={styles.keepText}>Keep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleCancelBooking(item.id)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={styles.confirmText}>
                    {cancellingId === item.id ? '...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmingId((p) => (p === item.id ? null : item.id))}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My History</Text>
      {bookings.length === 0 ? (
        <Text style={styles.empty}>No bookings found.</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  row: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rowMain: { flex: 1 },
  dateText: { fontWeight: '600', color: COLORS.textPrimaryLight, marginBottom: 2 },
  seatText: { fontSize: 13, color: COLORS.textSecondaryLight, marginBottom: 6 },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 10 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  actionCell: { marginLeft: 8 },
  cancelBtn: { backgroundColor: '#ffebee', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  cancelText: { color: COLORS.statusCancelled, fontWeight: '600', fontSize: 13 },
  confirmRow: { flexDirection: 'row', gap: 6 },
  keepBtn: { backgroundColor: '#eee', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  keepText: { color: '#555', fontWeight: '600', fontSize: 12 },
  confirmBtn: { backgroundColor: COLORS.statusCancelled, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  confirmText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  divider: { height: 8 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
});
