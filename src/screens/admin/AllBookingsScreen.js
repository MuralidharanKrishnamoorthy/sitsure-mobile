import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native';
import { UserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { getBookingsByDate } from '../../services/bookingService';
import { getEmployeeDetails } from '../../services/employeeService';
import { getGraphUserProfile } from '../../services/graphService';
import { getTodayInKolkata, formatDate } from '../../utils/dateUtils';
import { COLORS } from '../../theme/colors';
import Loader from '../../components/Loader';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AllBookingsScreen() {
  const { accessToken } = useContext(UserContext);
  const { t } = useTheme();
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
      <View style={[styles.row, { backgroundColor: t.card }]}>
        <View style={styles.empCell}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>
              {(p.name || item.user_email)[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.empTextWrap}>
            <Text style={[styles.empName, { color: t.text }]} numberOfLines={1}>{p.name || item.user_email}</Text>
            {p.empid && <Text style={[styles.empId, { color: t.textSub }]}>{p.empid}</Text>}
          </View>
        </View>
        <Text style={[styles.cell, { color: t.text }]}>{seatLabel}</Text>
        <Text style={[styles.cell, { color: t.textSub }]}>{floorName}</Text>
        {SCREEN_W > 340 && (
          <Text style={[styles.cellSm, { color: t.textTertiary }]}>
            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Text style={[styles.title, { color: COLORS.primary }]}>Seat Bookings By Date</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.dateInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={t.textTertiary}
          onSubmitEditing={loadBookings}
        />
        <TouchableOpacity style={styles.refreshBtn} onPress={loadBookings}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.header, { backgroundColor: t.card, borderColor: t.cardBorder, borderWidth: 1 }]}>
        <Text style={[styles.headerCell, { flex: 2, color: t.textSub }]}>Employee</Text>
        <Text style={[styles.headerCell, { color: t.textSub }]}>Seat</Text>
        <Text style={[styles.headerCell, { color: t.textSub }]}>Floor</Text>
        {/* Time column hidden on very small screens */}
        {SCREEN_W > 340 && <Text style={[styles.headerCellSm, { color: t.textSub }]}>Time</Text>}
      </View>

      {loading ? (
        <Loader color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={paged}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: t.divider }]} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {totalPages > 1 && (
        <View style={[styles.pagination, { backgroundColor: t.card, borderTopColor: t.divider }]}>
          <TouchableOpacity
            style={[styles.pageBtnWrap, page === 0 && styles.pageBtnWrapDisabled]}
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Text style={[styles.pageBtn, { color: page === 0 ? t.textTertiary : COLORS.primary }]}>← Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.pageInfo, { color: t.textSub }]}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtnWrap, page >= totalPages - 1 && styles.pageBtnWrapDisabled]}
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <Text style={[styles.pageBtn, { color: page >= totalPages - 1 ? t.textTertiary : COLORS.primary }]}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateInput: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  refreshBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
    minHeight: 44,
  },
  refreshText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  header: {
    flexDirection: 'row', padding: 10, borderRadius: 10, marginBottom: 4,
  },
  headerCell: { flex: 1, fontWeight: '700', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  headerCellSm: { width: 56, fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8,
  },
  empCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  empTextWrap: { flex: 1, minWidth: 0 },
  empAvatar: {
    width: 34, height: 34, borderRadius: 17, flexShrink: 0,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  empAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empName: { fontWeight: '600', fontSize: 12 },
  empId: { fontSize: 11 },
  cell: { flex: 1, fontSize: 12, minWidth: 0 },
  cellSm: { width: 56, fontSize: 11 },
  divider: { height: 1 },
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  pageBtnWrap: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: COLORS.primaryMuted, minWidth: 72, alignItems: 'center',
  },
  pageBtnWrapDisabled: { opacity: 0.4 },
  pageBtn: { fontWeight: '700', fontSize: 13 },
  pageInfo: { fontSize: 13, fontWeight: '600' },
});
