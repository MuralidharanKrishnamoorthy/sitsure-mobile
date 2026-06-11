import React, {useState, useEffect, useContext, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SectionList, Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Rect, Circle} from 'react-native-svg';
import {UserContext} from '../context/UserContext';
import {getUserBookingHistory, cancelBookingById} from '../services/bookingService';
import {getTodayInKolkata, formatDate} from '../utils/dateUtils';
import {COLORS} from '../theme/colors';
import {useTheme} from '../context/ThemeContext';
import Loader from '../components/Loader';

const SCREEN_W = Dimensions.get('window').width;

function CancelToast({booking, onHide}) {
  const tx = useSharedValue(SCREEN_W);

  useEffect(() => {
    tx.value = withSpring(0, {damping: 18, stiffness: 180, mass: 0.8});
    const timer = setTimeout(() => {
      tx.value = withTiming(SCREEN_W, {duration: 320, easing: Easing.in(Easing.cubic)}, finished => {
        if (finished) runOnJS(onHide)();
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({transform: [{translateX: tx.value}]}));

  const floorName  = booking?.seat?.floor?.name || '';
  const seatLabel  = booking?.seat?.label || '';
  const seatDisplay = floorName ? `${floorName} · Seat ${seatLabel}` : `Seat ${seatLabel}`;
  const dateLabel  = booking?.date
    ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : '';

  return (
    <Animated.View style={[ctStyles.card, animStyle]} pointerEvents="none">
      <View style={ctStyles.accentBar} />
      <View style={ctStyles.body}>
        <View style={ctStyles.iconWrap}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke="#ef5350" strokeWidth={2} />
            <Path d="M9 9L15 15M15 9L9 15" stroke="#ef5350" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <View style={ctStyles.textBlock}>
          <Text style={ctStyles.title}>Booking Cancelled</Text>
          <Text style={ctStyles.sub}>{seatDisplay}{dateLabel ? `  ·  ${dateLabel}` : ''}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const ctStyles = StyleSheet.create({
  card: {
    position: 'absolute', right: 16, top: 72,
    width: SCREEN_W - 32,
    borderRadius: 16,
    backgroundColor: '#1a0a0a',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 999,
  },
  accentBar: {width: 4, backgroundColor: '#ef5350'},
  body: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(239,83,80,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  textBlock: {flex: 1, gap: 3},
  title: {color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2},
  sub:   {color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500'},
});

const STATUS = {
  booked:    {bg: 'rgba(76,175,80,0.12)',   dot: '#4caf50', text: '#4caf50', bar: '#4caf50',           label: 'Booked'},
  completed: {bg: COLORS.primaryMuted,       dot: COLORS.primary, text: COLORS.primary, bar: COLORS.primary, label: 'Completed'},
  cancelled: {bg: 'rgba(239,83,80,0.12)',    dot: '#ef5350', text: '#ef5350', bar: '#ef5350',           label: 'Cancelled'},
};

function StatusPill({status}) {
  const cfg = STATUS[status] || STATUS.booked;
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

// ── Stats row — tappable filter cells ─────────────────────────────────────────

function StatCell({value, label, color, delay, t, last, active, onPress}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[statStyles.cell, !last && {borderRightWidth: 1, borderRightColor: t?.divider || '#f0f0f0'}]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[statStyles.inner, active && {backgroundColor: `${color}14`, borderRadius: 10}]}>
        <Text style={[statStyles.val, {color}]}>{value}</Text>
        <Text style={[statStyles.lbl, {color: active ? color : (t?.textTertiary || '#aaa')}]}>{label}</Text>
        {active && <View style={[statStyles.activeDot, {backgroundColor: color}]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatsRow({bookings, activeFilter, onFilter, t}) {
  const today     = getTodayInKolkata();
  const isBooked  = b => b.status === 'booked' || b.status === null;
  const total     = bookings.length;
  const booked    = bookings.filter(b => b.date >= today && isBooked(b)).length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  const cells = [
    {key: 'all',       value: total,     label: 'Total',     color: COLORS.primary,         delay: 0},
    {key: 'booked',    value: booked,    label: 'Booked',    color: '#4caf50',               delay: 60},
    {key: 'completed', value: completed, label: 'Completed', color: COLORS.statusCompleted,  delay: 120},
    {key: 'cancelled', value: cancelled, label: 'Cancelled', color: COLORS.statusCancelled,  delay: 180},
  ];

  return (
    <View style={[statStyles.row, {backgroundColor: t?.card || '#fff', shadowColor: t?.dark ? '#000' : 'rgba(108,71,255,0.12)'}]}>
      {cells.map((c, i) => (
        <StatCell
          key={c.key}
          value={c.value}
          label={c.label}
          color={c.color}
          delay={c.delay}
          t={t}
          last={i === cells.length - 1}
          active={activeFilter === c.key}
          onPress={() => onFilter(c.key)}
        />
      ))}
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {flexDirection: 'row', borderRadius: 16, marginBottom: 20, paddingVertical: 12, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4},
  cell: {flex: 1, alignItems: 'center'},
  inner: {alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, minWidth: 56},
  val: {fontSize: 22, fontWeight: '900', letterSpacing: -0.8},
  lbl: {fontSize: 9, fontWeight: '700', marginTop: 3, letterSpacing: 0.6, textTransform: 'uppercase'},
  activeDot: {width: 4, height: 4, borderRadius: 2, marginTop: 4},
});

// ── Booking card with optional cancel ─────────────────────────────────────────

function BookingCard({item, t, index, onCancel, cancelling}) {
  const [confirming, setConfirming] = useState(false);
  const cfg = STATUS[item.status] || STATUS.booked;
  const floorName  = item.seat?.floor?.name || '';
  const seatLabel  = item.seat?.label || '';
  const seatDisplay = floorName ? `${floorName}-${seatLabel}` : seatLabel;
  const canCancel = item.status === 'booked' || item.status === null;

  const handleConfirm = () => {
    setConfirming(false);
    onCancel(item.id);
  };

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

        {/* Cancel area — only for upcoming booked seats */}
        {canCancel && (
          confirming ? (
            <View style={cardStyles.confirmRow}>
              <TouchableOpacity
                style={[cardStyles.confirmBtn, {backgroundColor: t?.divider || '#f0f0f0'}]}
                onPress={() => setConfirming(false)}
                activeOpacity={0.75}>
                <Text style={[cardStyles.confirmBtnText, {color: t?.textSub}]}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cardStyles.confirmBtn, cardStyles.confirmBtnRed]}
                onPress={handleConfirm}
                disabled={cancelling}
                activeOpacity={0.8}>
                {cancelling
                  ? <Loader color="#fff" size={14} />
                  : <Text style={[cardStyles.confirmBtnText, {color: '#fff'}]}>Confirm Cancel</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={cardStyles.cancelBtn}
              onPress={() => setConfirming(true)}
              activeOpacity={0.75}>
              <Text style={cardStyles.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2},
  bar: {width: 5},
  body: {flex: 1, padding: 14, gap: 8},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  dateText: {fontSize: 15, fontWeight: '700', letterSpacing: 0.1},
  seatText: {fontSize: 13, fontWeight: '500'},
  cancelBtn: {alignSelf: 'flex-start', marginTop: 2, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,83,80,0.35)', backgroundColor: 'rgba(239,83,80,0.07)'},
  cancelBtnText: {color: '#ef5350', fontSize: 12, fontWeight: '700'},
  confirmRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  confirmBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  confirmBtnRed: {backgroundColor: '#ef5350'},
  confirmBtnText: {fontSize: 12, fontWeight: '700'},
});

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({title, count, t}) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.title, {color: t?.textSub}]}>{title}</Text>
      <View style={[sectionStyles.badge, {backgroundColor: COLORS.primaryMuted}]}>
        <Text style={[sectionStyles.count, {color: COLORS.primary}]}>{count}</Text>
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingTop: 4},
  title: {fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  count: {fontSize: 11, fontWeight: '800'},
});

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyIcon({filter}) {
  const color = COLORS.primary;
  if (filter === 'booked') {
    return (
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth={1.6} />
        <Path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M8 13H12M8 17H10" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
        <Circle cx="16" cy="16" r="4" stroke={color} strokeWidth={1.5} opacity={0.7} />
        <Path d="M14.5 16L15.5 17L17.5 15" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      </Svg>
    );
  }
  if (filter === 'completed') {
    return (
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
        <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (filter === 'cancelled') {
    return (
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
        <Path d="M9 9L15 15M15 9L9 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  // 'all' — calendar
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth={1.6} />
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M8 13H16M8 17H13" stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

const FILTER_EMPTY = {
  all:       {title: 'No bookings yet',       sub: 'Your seat booking history will appear here.'},
  booked:    {title: 'No active bookings',    sub: 'You have no upcoming booked seats.'},
  completed: {title: 'No completed bookings', sub: 'Bookings where the day has passed will show here.'},
  cancelled: {title: 'No cancellations',      sub: "You haven't cancelled any bookings."},
};

function EmptyState({t, filter = 'all'}) {
  const cfg = FILTER_EMPTY[filter] || FILTER_EMPTY.all;
  return (
    <Animated.View entering={FadeInDown.delay(80).duration(400)} style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconWrap, {backgroundColor: COLORS.primaryMuted}]}>
        <EmptyIcon filter={filter} />
      </View>
      <Text style={[emptyStyles.title, {color: t?.text}]}>{cfg.title}</Text>
      <Text style={[emptyStyles.sub, {color: t?.textSub}]}>{cfg.sub}</Text>
    </Animated.View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60},
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
  const [cancellingId, setCancellingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [cancelToast, setCancelToast] = useState(null);

  const today = getTodayInKolkata();

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

  // Re-fetch every time History tab is focused
  useFocusEffect(
    useCallback(() => { loadHistory(); }, [loadHistory]),
  );

  const handleCancel = useCallback(async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await cancelBookingById(bookingId);
      const cancelled = bookings.find(b => b.id === bookingId);
      if (cancelled) setCancelToast(cancelled);
      // Optimistic update — mark as cancelled without refetch
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? {...b, status: 'cancelled'} : b),
      );
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  }, []);

  const isActiveBooked = b => b.status === 'booked' || b.status === null;

  const filteredBookings = (() => {
    if (activeFilter === 'booked')    return bookings.filter(b => b.date >= today && isActiveBooked(b));
    if (activeFilter === 'completed') return bookings.filter(b => b.status === 'completed');
    if (activeFilter === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings; // 'all'
  })();

  // for 'all' view keep upcoming/past sections; other filters flat list
  const sections = (() => {
    if (activeFilter !== 'all') {
      return filteredBookings.length > 0
        ? [{key: activeFilter, title: '', data: filteredBookings}]
        : [];
    }
    const upcoming = bookings.filter(b => b.date >= today && isActiveBooked(b));
    const past     = bookings.filter(b => !(b.date >= today && isActiveBooked(b)));
    const s = [];
    if (upcoming.length > 0) s.push({key: 'upcoming', title: 'Upcoming', data: upcoming});
    if (past.length > 0)     s.push({key: 'past',     title: 'Past',     data: past});
    return s;
  })();

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

      {bookings.length > 0 && (
        <StatsRow
          bookings={bookings}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          t={t}
        />
      )}

      {bookings.length === 0 || sections.length === 0 ? (
        <EmptyState t={t} filter={activeFilter} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 32}}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          renderSectionHeader={({section}) =>
            section.title ? (
              <SectionHeader title={section.title} count={section.data.length} t={t} />
            ) : null
          }
          renderItem={({item, index}) => (
            <BookingCard
              item={item}
              t={t}
              index={index}
              onCancel={handleCancel}
              cancelling={cancellingId === item.id}
            />
          )}
        />
      )}

      {cancelToast && (
        <CancelToast
          booking={cancelToast}
          onHide={() => setCancelToast(null)}
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
