import React, {useState, useEffect, useContext} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {UserContext} from '../../context/UserContext';
import {useTheme} from '../../context/ThemeContext';
import {getBookingsByDate} from '../../services/bookingService';
import {getEmployeeDetails} from '../../services/employeeService';
import {getGraphUserProfile} from '../../services/graphService';
import {getTodayInKolkata, formatDate} from '../../utils/dateUtils';
import {COLORS} from '../../theme/colors';
import Loader from '../../components/Loader';

const {width: SCREEN_W} = Dimensions.get('window');

export default function AllBookingsScreen() {
  const {accessToken} = useContext(UserContext);
  const {t} = useTheme();
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

      const emails = [...new Set(data.map(b => b.user_email).filter(Boolean))];
      const profileMap = {};
      await Promise.all(
        emails.map(async email => {
          const [details, graph] = await Promise.all([
            getEmployeeDetails(email),
            accessToken ? getGraphUserProfile(email, accessToken) : null,
          ]);
          profileMap[email] = {
            name: details?.name || details?.fullName || graph?.displayName || email,
            empid: details?.empid || details?.employeeId || details?.empId || null,
            photoUrl: graph?.photoUrl || null,
          };
        }),
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

  const renderItem = ({item, index}) => {
    const p = profiles[item.user_email] || {};
    const floorName = item.seat?.floor?.name || item.floor?.name || '';
    const seatLabel = item.seat?.label || '';
    const initial = (p.name || item.user_email || '?')[0].toUpperCase();

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).duration(300)}
        style={[styles.row, {backgroundColor: t.card, borderBottomColor: t.divider}]}>
        <View style={styles.empCell}>
          <View style={[styles.empAvatar, {backgroundColor: COLORS.primaryMuted}]}>
            <Text style={[styles.empAvatarText, {color: COLORS.primary}]}>{initial}</Text>
          </View>
          <View style={styles.empTextWrap}>
            <Text style={[styles.empName, {color: t.text}]} numberOfLines={1}>
              {p.name || item.user_email}
            </Text>
            {p.empid && <Text style={[styles.empId, {color: t.textSub}]}>{p.empid}</Text>}
          </View>
        </View>
        <View style={[styles.seatBadge, {backgroundColor: COLORS.primaryMuted}]}>
          <Text style={[styles.seatBadgeText, {color: COLORS.primary}]}>{seatLabel}</Text>
        </View>
        <Text style={[styles.cellFloor, {color: t.textSub}]}>{floorName}</Text>
        {SCREEN_W > 340 && (
          <Text style={[styles.cellTime, {color: t.textTertiary}]}>
            {item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
              : '-'}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: t.bg}]}>

      {/* Date filter row */}
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.dateInput, {backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text}]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={t.textTertiary}
          onSubmitEditing={loadBookings}
        />
        <TouchableOpacity style={[styles.refreshBtn, {backgroundColor: COLORS.primary}]} onPress={loadBookings}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Count badge */}
      {!loading && bookings.length > 0 && (
        <View style={[styles.countRow, {backgroundColor: COLORS.primaryMuted}]}>
          <Text style={[styles.countText, {color: COLORS.primary}]}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} on {formatDate(date)}
          </Text>
        </View>
      )}

      {/* Table header */}
      <View style={[styles.tableHeader, {backgroundColor: t.surface, borderColor: t.cardBorder}]}>
        <Text style={[styles.headerCell, {flex: 2, color: t.textSub}]}>Employee</Text>
        <Text style={[styles.headerCell, {color: t.textSub}]}>Seat</Text>
        <Text style={[styles.headerCell, {color: t.textSub}]}>Floor</Text>
        {SCREEN_W > 340 && <Text style={[styles.headerCellSm, {color: t.textSub}]}>Time</Text>}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={28} />
        </View>
      ) : (
        <FlatList
          data={paged}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.divider, {backgroundColor: t.divider}]} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={[styles.pagination, {backgroundColor: t.card, borderTopColor: t.divider}]}>
          <TouchableOpacity
            style={[styles.pageBtn, {backgroundColor: COLORS.primaryMuted}, page === 0 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}>
            <Text style={[styles.pageBtnText, {color: page === 0 ? t.textTertiary : COLORS.primary}]}>← Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.pageInfo, {color: t.textSub}]}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, {backgroundColor: COLORS.primaryMuted}, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}>
            <Text style={[styles.pageBtnText, {color: page >= totalPages - 1 ? t.textTertiary : COLORS.primary}]}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},

  filterRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  dateInput: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
  },
  refreshBtn: {
    borderRadius: 12, paddingHorizontal: 18,
    justifyContent: 'center', minHeight: 46,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  refreshText: {color: '#fff', fontWeight: '700', fontSize: 13},

  countRow: {
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    marginBottom: 10,
  },
  countText: {fontWeight: '700', fontSize: 13},

  tableHeader: {
    flexDirection: 'row', padding: 10,
    borderRadius: 10, marginBottom: 4,
    borderWidth: 1,
  },
  headerCell: {flex: 1, fontWeight: '700', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase'},
  headerCellSm: {width: 56, fontWeight: '700', fontSize: 11, letterSpacing: 0.5},

  listContent: {paddingBottom: 16},
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 10,
    borderRadius: 0,
  },
  empCell: {flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  empTextWrap: {flex: 1, minWidth: 0},
  empAvatar: {
    width: 34, height: 34, borderRadius: 17, flexShrink: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  empAvatarText: {fontWeight: '800', fontSize: 13},
  empName: {fontWeight: '600', fontSize: 12},
  empId: {fontSize: 11, marginTop: 1},

  seatBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    marginRight: 4, flex: 1, alignItems: 'center',
  },
  seatBadgeText: {fontWeight: '700', fontSize: 12},
  cellFloor: {flex: 1, fontSize: 12},
  cellTime: {width: 56, fontSize: 11},

  divider: {height: 1},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40},

  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  pageBtn: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 10, minWidth: 76, alignItems: 'center',
  },
  pageBtnDisabled: {opacity: 0.4},
  pageBtnText: {fontWeight: '700', fontSize: 13},
  pageInfo: {fontSize: 13, fontWeight: '700'},
});
