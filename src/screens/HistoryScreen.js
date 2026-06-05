import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import Animated, {FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Rect} from 'react-native-svg';
import {UserContext} from '../context/UserContext';
import {getUserBookingHistory, cancelBookingById} from '../services/bookingService';
import {getTodayInKolkata, formatDate} from '../utils/dateUtils';
import {COLORS} from '../theme/colors';
import {useTheme} from '../context/ThemeContext';
import Loader from '../components/Loader';

const STATUS = {
  booked:    {bg: 'rgba(76,175,80,0.12)',   dot: '#4caf50', text: '#4caf50', bar: '#4caf50',           label: 'Booked'},
  completed: {bg: COLORS.primaryMuted,       dot: COLORS.primary, text: COLORS.primary, bar: COLORS.primary, label: 'Completed'},
  cancelled: {bg: 'rgba(239,83,80,0.12)',    dot: '#ef5350', text: '#ef5350', bar: '#ef5350',           label: 'Cancelled'},
};

function StatusPill({status}) {
  const cfg = STATUS[status] || {bg: COLORS.primaryMuted, dot: COLORS.primary, text: COLORS.primary, label: status};
  return (
    <View style={[pillStyles.wrap, {backgroundColor: cfg.bg}]}>
      <View style={[pillStyles.dot, {backgroundColor: cfg.dot}]} />
      <Text style={[pillStyles.label, {color: cfg.text}]}>{cfg.label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrap: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, gap: 5},
  dot: {width: 6, height: 6, borderRadius: 3},
  label: {fontSize: 11, fontWeight: '700', letterSpacing: 0.4},
});

// ── Stats row with animated numbers ──────────────────────────────────────────

function StatCell({value, label, color, delay, t, last}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[statStyles.cell, !last && {borderRightWidth: 1, borderRightColor: t?.divider || '#f0f0f0'}]}>
      <Text style={[statStyles.val, {color}]}>{value}</Text>
      <Text style={[statStyles.lbl, {color: t?.textTertiary || '#aaa'}]}>{label}</Text>
    </Animated.View>
  );
}

function StatsRow({bookings, t}) {
  const total = bookings.length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <View style={[statStyles.row, {backgroundColor: t?.card || '#fff', shadowColor: t?.dark ? '#000' : 'rgba(108,71,255,0.12)'}]}>
      <StatCell value={total}     label="Total"     color={COLORS.primary}          delay={0}   t={t} />
      <StatCell value={completed} label="Completed" color={COLORS.statusCompleted}  delay={60}  t={t} />
      <StatCell value={cancelled} label="Cancelled" color={COLORS.statusCancelled}  delay={120} t={t} last />
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 20,
    paddingVertical: 16,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cell: {flex: 1, alignItems: 'center'},
  val: {fontSize: 26, fontWeight: '900', letterSpacing: -0.8},
  lbl: {fontSize: 10, fontWeight: '700', marginTop: 3, letterSpacing: 0.6, textTransform: 'uppercase'},
});

// ── Booking card ──────────────────────────────────────────────────────────────

function BookingCard({item, t, index}) {
  const cfg = STATUS[item.status] || STATUS.booked;
  const floorName = item.seat?.floor?.name || '';
  const seatLabel = item.seat?.label || '';
  const seatDisplay = floorName ? `${floorName}-${seatLabel}` : seatLabel;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(350)}
      style={[cardStyles.card, {backgroundColor: t?.card || '#fff'}]}>
      <View style={[cardStyles.bar, {backgroundColor: cfg.bar}]} />
      <View style={cardStyles.body}>
        <View style={cardStyles.topRow}>
          <Text style={[cardStyles.dateText, {color: t?.text || '#0F0F1A'}]}>{formatDate(item.date)}</Text>
          <StatusPill status={item.status} />
        </View>
        {seatDisplay ? (
          <Text style={[cardStyles.seatText, {color: t?.textSub || '#5C5C78'}]}>{seatDisplay}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bar: {width: 5},
  body: {flex: 1, padding: 14, gap: 8},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  dateText: {fontSize: 15, fontWeight: '700', letterSpacing: 0.1},
  seatText: {fontSize: 13, fontWeight: '500'},
});

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({t}) {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconWrap, {backgroundColor: COLORS.primaryMuted}]}>
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="17" rx="3" stroke={COLORS.primary} strokeWidth={1.5} opacity={0.6} />
          <Path d="M8 2V6M16 2V6M3 9H21" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
          <Path d="M8 13H16M8 17H13" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
        </Svg>
      </View>
      <Text style={[emptyStyles.title, {color: t?.text}]}>No bookings yet</Text>
      <Text style={[emptyStyles.sub, {color: t?.textSub}]}>Your seat booking history will appear here.</Text>
    </Animated.View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60},
  iconWrap: {width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  title: {fontSize: 20, fontWeight: '800', letterSpacing: -0.4},
  sub: {fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32},
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const {employee} = useContext(UserContext);
  const {t} = useTheme();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!employee?.email) return;
    setLoading(true);
    try {
      const data = await getUserBookingHistory(employee.email, {limit: 50});
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
      <View style={[styles.loadWrap, {backgroundColor: t.bg}]}>
        <Loader color={COLORS.primary} size={28} />
        <Text style={[styles.loadText, {color: t.textSub}]}>Loading history…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: t.bg, paddingTop: Math.max(52, insets.top + 16)}]}>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <Text style={[styles.title, {color: t.text}]}>Booking History</Text>
        <Text style={[styles.subtitle, {color: t.textSub}]}>
          {bookings.length > 0 ? `${bookings.length} records` : 'No bookings yet'}
        </Text>
      </Animated.View>

      {bookings.length > 0 && <StatsRow bookings={bookings} t={t} />}

      {bookings.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 32}}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          renderItem={({item, index}) => <BookingCard item={item} t={t} index={index} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 16, paddingBottom: 16},
  header: {marginBottom: 20},
  title: {fontSize: 28, fontWeight: '900', letterSpacing: -0.8},
  subtitle: {fontSize: 13, fontWeight: '500', marginTop: 4},
  loadWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14},
  loadText: {fontSize: 14, fontWeight: '500'},
});
