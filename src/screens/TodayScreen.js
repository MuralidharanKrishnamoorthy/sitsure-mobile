import React, {useState, useEffect, useCallback, useContext, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {UserContext} from '../context/UserContext';
import {getBookingsByDate, getAnchorDayForDate} from '../services/bookingService';
import {getGraphUserProfile} from '../services/graphService';
import {getFloors} from '../services/seatService';
import {getTodayInKolkata, isThursdayOrFriday} from '../utils/dateUtils';
import {isFirstFloor} from '../utils/bookingRestrictions';
import {COLORS} from '../theme/colors';
import {useTheme} from '../context/ThemeContext';
import Loader from '../components/Loader';

function nameFromEmail(email) {
  if (!email) return 'Unknown';
  const local = email.split('@')[0];
  return local.split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

const AVATAR_PALETTE = [
  '#FF6B6B', '#FFA94D', '#69DB7C', '#4DABF7',
  '#CC5DE8', '#F06595', '#38D9A9', '#FFD43B',
];

// ── Avatar ────────────────────────────────────────────────────────────────────

function PersonAvatar({email, index, accessToken, size = 42}) {
  const [photo, setPhoto] = useState(null);
  const color = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const initial = nameFromEmail(email)[0]?.toUpperCase() || '?';

  useEffect(() => {
    if (!accessToken || !email) return;
    let active = true;
    getGraphUserProfile(email, accessToken)
      .then(p => { if (active && p?.photoUrl) setPhoto(p.photoUrl); })
      .catch(() => {});
    return () => { active = false; };
  }, [email, accessToken]);

  const r = size / 2;
  return photo ? (
    <Image source={{uri: photo}} style={{width: size, height: size, borderRadius: r}} />
  ) : (
    <View style={{width: size, height: size, borderRadius: r,
      backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color, fontWeight: '900', fontSize: Math.round(size * 0.38)}}>{initial}</Text>
    </View>
  );
}

// ── Person row ────────────────────────────────────────────────────────────────

function PersonRow({booking, index, accessToken, t, isMe}) {
  const email = booking.user_email || '';
  const name = nameFromEmail(email);
  const seatLabel = booking.seat?.label || '';

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      <View style={[rowStyles.row, isMe && {backgroundColor: `${COLORS.primary}0A`}]}>
        <PersonAvatar email={email} index={index} accessToken={accessToken} size={42} />
        <View style={rowStyles.info}>
          <View style={rowStyles.nameRow}>
            <Text style={[rowStyles.name, {color: t.text}]} numberOfLines={1}>{name}</Text>
            {isMe && (
              <View style={[rowStyles.meBadge, {backgroundColor: COLORS.primaryMuted}]}>
                <Text style={[rowStyles.meBadgeText, {color: COLORS.primary}]}>You</Text>
              </View>
            )}
          </View>
          <Text style={[rowStyles.email, {color: t.textSub}]} numberOfLines={1}>{email}</Text>
        </View>
        {seatLabel ? (
          <View style={[rowStyles.seatPill, {backgroundColor: `${COLORS.primary}14`}]}>
            <Text style={[rowStyles.seatText, {color: COLORS.primary}]}>Seat {seatLabel}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12},
  info: {flex: 1, gap: 2},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  name: {fontSize: 14, fontWeight: '700', letterSpacing: -0.1, flexShrink: 1},
  email: {fontSize: 11, fontWeight: '500'},
  meBadge: {borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2},
  meBadgeText: {fontSize: 10, fontWeight: '800'},
  seatPill: {borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0},
  seatText: {fontSize: 11, fontWeight: '800', letterSpacing: 0.2},
});

// ── Mini week calendar ────────────────────────────────────────────────────────

function MiniCalendar({date, onDateChange, t}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayStr = getTodayInKolkata();

  const anchor = new Date(todayStr);
  anchor.setDate(anchor.getDate() + weekOffset * 7);
  const sun = new Date(anchor);
  sun.setDate(anchor.getDate() - anchor.getDay());
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${d.getFullYear()}-${mm}-${dd}`,
      dayLabel: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      dayNum: d.getDate(),
    };
  });
  const monthLabel = anchor.toLocaleString('en-IN', {month: 'long', year: 'numeric'});

  return (
    <View style={[calStyles.wrap, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
      <View style={calStyles.header}>
        <TouchableOpacity
          style={[calStyles.navBtn, {backgroundColor: t.chipBg}]}
          onPress={() => setWeekOffset(o => o - 1)}>
          <Text style={[calStyles.navArrow, {color: t.textSub}]}>‹</Text>
        </TouchableOpacity>
        <Text style={[calStyles.month, {color: t.text}]}>{monthLabel}</Text>
        <TouchableOpacity
          style={[calStyles.navBtn, {backgroundColor: t.chipBg}]}
          onPress={() => setWeekOffset(o => o + 1)}>
          <Text style={[calStyles.navArrow, {color: t.textSub}]}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={calStyles.row}>
        {weekDays.map(({dateStr, dayLabel, dayNum}) => {
          const isPast = dateStr < todayStr;
          const isSelected = dateStr === date;
          const isToday = dateStr === todayStr;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                calStyles.cell,
                isSelected && {backgroundColor: COLORS.primary},
                isPast && {opacity: 0.35},
              ]}
              onPress={() => onDateChange(dateStr)}
              activeOpacity={0.75}>
              <Text style={[calStyles.dayLabel,
                {color: isSelected ? 'rgba(255,255,255,0.75)' : t.textSub}]}>
                {dayLabel}
              </Text>
              <Text style={[calStyles.dayNum, {color: isSelected ? '#fff' : t.text}]}>
                {dayNum}
              </Text>
              {isToday && (
                <View style={[calStyles.todayDot, {backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : COLORS.primary}]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrap: {borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  navBtn: {width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  navArrow: {fontSize: 20, fontWeight: '600', lineHeight: 24},
  month: {fontSize: 14, fontWeight: '700'},
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  cell: {flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, marginHorizontal: 1},
  dayLabel: {fontSize: 9, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4},
  dayNum: {fontSize: 15, fontWeight: '700'},
  todayDot: {width: 4, height: 4, borderRadius: 2, marginTop: 3},
});

// ── Floor tab pill ────────────────────────────────────────────────────────────

function FloorTabs({floors, activeId, onSelect, t}) {
  return (
    <View style={[tabStyles.wrap, {backgroundColor: t.chipBg}]}>
      {floors.map(f => {
        const active = f.id === activeId;
        return (
          <TouchableOpacity
            key={f.id}
            style={[tabStyles.tab, active && {backgroundColor: COLORS.primary}]}
            onPress={() => onSelect(f.id)}
            activeOpacity={0.8}>
            <Text style={[tabStyles.label, {color: active ? '#fff' : t.textSub}]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: {flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 14},
  tab: {flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center'},
  label: {fontSize: 13, fontWeight: '700'},
});

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({t}) {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.emoji}>🏢</Text>
      <Text style={[emptyStyles.title, {color: t.text}]}>No bookings</Text>
      <Text style={[emptyStyles.sub, {color: t.textSub}]}>Nobody booked this floor on this date.</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 40},
  emoji: {fontSize: 36, marginBottom: 4},
  title: {fontSize: 17, fontWeight: '800', letterSpacing: -0.3},
  sub: {fontSize: 13, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20},
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const {employee, accessToken} = useContext(UserContext);
  const {t} = useTheme();
  const insets = useSafeAreaInsets();
  const todayStr = getTodayInKolkata();

  const [date, setDate] = useState(todayStr);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [anchorDay, setAnchorDay] = useState(null);

  // load floors once
  useEffect(() => {
    getFloors().then(data => {
      setFloors(data);
      // default to first non-floor-1 tab
      const def = data.find(f => !isFirstFloor(f)) || data[0];
      if (def) setActiveFloorId(def.id);
    }).catch(() => {});
  }, []);

  // load anchor day when date changes
  useEffect(() => {
    let active = true;
    getAnchorDayForDate(date).then(a => { if (active) setAnchorDay(a); }).catch(() => {});
    return () => { active = false; };
  }, [date]);

  // compute which floors are visible (Floor 1 only on anchor/thu-fri)
  const anchorGroups = anchorDay
    ? (Array.isArray(anchorDay.groups)
        ? anchorDay.groups
        : (anchorDay.groups || '').split(/[,;]+/).map(g => g.trim())
      ).map(g => g.toUpperCase())
    : [];
  const isAllSurecomp = anchorGroups.includes('SDOS') && anchorGroups.includes('SDL') && anchorGroups.includes('QA');
  const isThuFri = isThursdayOrFriday(date);
  const showFloor1 = isAllSurecomp || isThuFri;

  const visibleFloors = floors.filter(f => showFloor1 || !isFirstFloor(f));

  // if activeFloorId is floor1 but floor1 not visible, reset to first visible
  useEffect(() => {
    if (!visibleFloors.length) return;
    const stillVisible = visibleFloors.find(f => f.id === activeFloorId);
    if (!stillVisible) setActiveFloorId(visibleFloors[0].id);
  }, [showFloor1, visibleFloors.map(f => f.id).join(',')]);

  const load = useCallback(async (forDate) => {
    setLoading(true);
    try {
      const data = await getBookingsByDate(forDate);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  useFocusEffect(
    useCallback(() => { load(date); }, [date, load]),
  );

  // filter to active floor
  const floorBookings = bookings.filter(b => {
    const floorId = b.seat?.floor?.id ?? b.seat?.floor_id ?? b.floor?.id ?? b.floor_id;
    return floorId === activeFloorId;
  });

  const activeFloor = visibleFloors.find(f => f.id === activeFloorId);
  const isToday = date === todayStr;

  return (
    <View style={[styles.container, {backgroundColor: t.bg, paddingTop: Math.max(52, insets.top + 16)}]}>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={[styles.title, {color: t.text}]}>
            {isToday ? "Today's Office" : 'Office Bookings'}
          </Text>
          <Text style={[styles.subtitle, {color: t.textSub}]}>
            {loading ? 'Loading…' : `${floorBookings.length} booked on ${activeFloor?.name || 'this floor'}`}
          </Text>
        </View>
        {floorBookings.length > 0 && !loading && (
          <View style={[styles.badge, {backgroundColor: COLORS.primaryMuted}]}>
            <Text style={[styles.badgeText, {color: COLORS.primary}]}>{floorBookings.length}</Text>
          </View>
        )}
      </Animated.View>

      {/* Calendar */}
      <MiniCalendar date={date} onDateChange={d => { setDate(d); }} t={t} />

      {/* Floor tabs */}
      {visibleFloors.length > 1 && (
        <FloorTabs
          floors={visibleFloors}
          activeId={activeFloorId}
          onSelect={setActiveFloorId}
          t={t}
        />
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <Loader color={COLORS.primary} size={26} />
        </View>
      ) : floorBookings.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <FlatList
          data={floorBookings}
          keyExtractor={(item, i) => (item.user_email || '') + i}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: insets.bottom + 32}}
          ItemSeparatorComponent={() => <View style={[styles.sep, {backgroundColor: t.divider}]} />}
          renderItem={({item, index}) => (
            <PersonRow
              booking={item}
              index={index}
              accessToken={accessToken}
              t={t}
              isMe={item.user_email?.toLowerCase() === employee?.email?.toLowerCase()}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16},
  title: {fontSize: 26, fontWeight: '900', letterSpacing: -0.7},
  subtitle: {fontSize: 13, fontWeight: '500', marginTop: 3},
  badge: {borderRadius: 14, paddingHorizontal: 13, paddingVertical: 6, marginTop: 4},
  badgeText: {fontSize: 16, fontWeight: '900'},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  sep: {height: 1, marginHorizontal: 4, marginVertical: 2},
});
