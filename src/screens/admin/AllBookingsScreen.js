import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { UserContext } from '../../context/UserContext';
import { getBookingsByDate } from '../../services/bookingService';
import { getEmployeeDetails } from '../../services/employeeService';
import { getGraphUserProfile } from '../../services/graphService';
import { getTodayInKolkata, formatDate } from '../../utils/dateUtils';
import { COLORS } from '../../theme/colors';

export default function AllBookingsScreen() {
  const { accessToken } = useContext(UserContext);
  const [date, setDate] = useState(getTodayInKolkata());
  const [bookings, setBookings] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookingsByDate(date);
      setBookings(data);
      setPage(0);

      const emails = [...new Set(data.map((b) => b.user_email).filter(Boolean))];
      const profileMap = {};
      await Promise.all(
        emails.map(async (email) => {
          const [details, graph] = await Promise.all([
            getEmployeeDetails(email),
            accessToken ? getGraphUserProfile(email, accessToken) : null,
          ]);
          profileMap[email] = {
            name: details?.name || details?.fullName || graph?.displayName || email,
            empid: details?.empid || details?.employeeId || details?.empId || null,
            photoUrl: graph?.photoUrl || null,
          };
        })
      );
      setProfiles(profileMap);
    } catch (err) {
      console.error('AllBookings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [date]);

  const paged = bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);

  const renderItem = ({ item }) => {
    const p = profiles[item.user_email] || {};
    const floorName = item.seat?.floor?.name || item.floor?.name || '';
    const seatLabel = item.seat?.label || '';
    return (
      <View style={styles.row}>
        <View style={styles.empCell}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>
              {(p.name || item.user_email)[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.empName}>{p.name || item.user_email}</Text>
            {p.empid && <Text style={styles.empId}>{p.empid}</Text>}
          </View>
        </View>
        <Text style={styles.cell}>{seatLabel}</Text>
        <Text style={styles.cell}>{floorName}</Text>
        <Text style={styles.cellSm}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Bookings By Date</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          onSubmitEditing={loadBookings}
        />
        <TouchableOpacity style={styles.refreshBtn} onPress={loadBookings}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.headerCell, { flex: 2 }]}>Employee</Text>
        <Text style={styles.headerCell}>Seat</Text>
        <Text style={styles.headerCell}>Floor</Text>
        <Text style={styles.headerCellSm}>Time</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={paged}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity onPress={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <Text style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <Text style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateInput: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff',
  },
  refreshBtn: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 14, justifyContent: 'center' },
  refreshText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginBottom: 4 },
  headerCell: { flex: 1, fontWeight: '700', fontSize: 12, color: '#555' },
  headerCellSm: { width: 60, fontWeight: '700', fontSize: 12, color: '#555' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderRadius: 6 },
  empCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  empAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  empAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empName: { fontWeight: '600', fontSize: 12 },
  empId: { fontSize: 11, color: '#888' },
  cell: { flex: 1, fontSize: 12, color: COLORS.textPrimaryLight },
  cellSm: { width: 60, fontSize: 11, color: '#888' },
  divider: { height: 6 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 },
  pageBtn: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  pageBtnDisabled: { color: '#ccc' },
  pageInfo: { fontSize: 13, color: '#555' },
});
