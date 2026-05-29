import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { UserContext } from '../context/UserContext';
import { getUserBookingHistory, cancelBookingById } from '../services/bookingService';
import { getTodayInKolkata, formatDate } from '../utils/dateUtils';
import { COLORS } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';

// ── Status config — uses rgba so it works on both dark and light surfaces ──────
const STATUS = {
  booked:    { bg: 'rgba(76,175,80,0.12)',   dot: '#4caf50', text: '#4caf50', bar: '#4caf50', label: 'Booked' },
  completed: { bg: 'rgba(66,165,245,0.12)',  dot: '#42a5f5', text: '#42a5f5', bar: '#42a5f5', label: 'Completed' },
  cancelled: { bg: 'rgba(239,83,80,0.12)',   dot: '#ef5350', text: '#ef5350', bar: '#ef5350', label: 'Cancelled' },
};

function StatusPill({ status }) {
  const cfg = STATUS[status] || { bg: 'rgba(254,116,42,0.12)', dot: COLORS.primary, text: COLORS.primary, label: status };
  return (
    <View style={[pillStyles.wrap, { backgroundColor: cfg.bg }]}>
      <View style={[pillStyles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[pillStyles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});

// ── Stats row ─────────────────────────────────────────────────────────────────
function StatsRow({ bookings, t }) {
  const total = bookings.length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <View style={[statStyles.row, { backgroundColor: t?.card || '#fff' }]}>
      {[
        { value: total,     label: 'Total',     color: COLORS.primary },
        { value: completed, label: 'Completed', color: COLORS.statusCompleted },
        { value: cancelled, label: 'Cancelled', color: COLORS.statusCancelled },
      ].map((s, i) => (
        <View key={s.label} style={[statStyles.cell, i < 2 && { borderRightWidth: 1, borderRightColor: t?.divider || '#f0f0f0' }]}>
          <Text style={[statStyles.val, { color: s.color }]}>{s.value}</Text>
          <Text style={[statStyles.lbl, { color: t?.textTertiary || t?.textSub || '#aaa' }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 14,
    marginBottom: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cell: { flex: 1, alignItems: 'center' },
  val: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  lbl: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase' },
});

// ── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({ item, t }) {
  const cfg = STATUS[item.status] || STATUS.booked;
  const floorName = item.seat?.floor?.name || '';
  const seatLabel = item.seat?.label || '';
  const seatDisplay = floorName ? `${floorName}-${seatLabel}` : seatLabel;

  return (
    <View style={[cardStyles.card, { backgroundColor: t?.card || '#fff' }]}>
      <View style={[cardStyles.bar, { backgroundColor: cfg.bar }]} />
      <View style={cardStyles.body}>
        <Text style={[cardStyles.dateText, { color: t?.text || '#212121' }]}>{formatDate(item.date)}</Text>
        {seatDisplay ? (
          <Text style={[cardStyles.seatText, { color: t?.textSub || '#888' }]}>{seatDisplay}</Text>
        ) : null}
        <StatusPill status={item.status} />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bar: { width: 5 },
  body: { flex: 1, padding: 14, gap: 6 },
  dateText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimaryLight, letterSpacing: 0.1 },
  seatText: { fontSize: 13, color: '#888', fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { employee } = useContext(UserContext);
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = getTodayInKolkata();

  const loadHistory = useCallback(async () => {
    if (!employee?.email) return;
    setLoading(true);
    try {
      const data = await getUserBookingHistory(employee.email, { limit: 50 });
      setBookings(data);
    } catch {
      Alert.alert('Error', 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  }, [employee?.email]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (loading) {
    return (
      <View style={[styles.loadWrap, { backgroundColor: t.bg }]}>
        <Loader color={COLORS.primary} size={12} />
        <Text style={styles.loadText}>Loading history…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg, paddingTop: Math.max(52, insets.top + 16) }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Booking History</Text>
      </View>

      {bookings.length > 0 && <StatsRow bookings={bookings} t={t} />}

      {bookings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="4" width="18" height="17" rx="3" stroke={COLORS.primary} strokeWidth={1.5} opacity={0.35} />
            <Path d="M8 2V6M16 2V6M3 9H21" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.35} />
            <Path d="M8 13H16M8 17H13" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.25} />
          </Svg>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>Your seat booking history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <BookingCard item={item} t={t} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimaryLight,
    letterSpacing: -0.5,
  },
  loadWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgLight,
    gap: 12,
  },
  loadText: { color: '#aaa', fontSize: 14, fontWeight: '500' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
