import React, {useState, useEffect, useContext, useCallback, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Image, PanResponder, Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInDown, Easing, runOnJS,
} from 'react-native-reanimated';
import {UserContext} from '../context/UserContext';
import {getGraphUserProfile} from '../services/graphService';
import {getFloors} from '../services/seatService';
import {
  getSeatBookings, getUserBookingForDate, bookSeat,
  getAnchorDayForDate,
} from '../services/bookingService';
import {getTodayInKolkata, formatDate, isThursdayOrFriday} from '../utils/dateUtils';
import {computeRestrictions, canUserBook, isFirstFloor, isSecondFloor, isThirdFloor} from '../utils/bookingRestrictions';
import FloorSeatLayout from '../components/seat/FloorSeatLayout';
import FirstFloorSeatLayout from '../components/seat/FirstFloorSeatLayout';
import SecondFloorSeatLayout from '../components/seat/SecondFloorSeatLayout';
import ThirdFloorSeatLayout from '../components/seat/ThirdFloorSeatLayout';
import Svg, {Path, Rect, Line} from 'react-native-svg';
import {COLORS} from '../theme/colors';
import {useTheme} from '../context/ThemeContext';
import Loader from '../components/Loader';

const SCREEN_W = Dimensions.get('window').width;
const TOAST_W  = SCREEN_W - 32;


function BookingToast({seat, date, onHide}) {
  const tx = useSharedValue(SCREEN_W);

  useEffect(() => {
    // slide in
    tx.value = withSpring(0, {damping: 18, stiffness: 180, mass: 0.8});
    // auto-dismiss after 3s
    const timer = setTimeout(() => {
      tx.value = withTiming(SCREEN_W, {duration: 320, easing: Easing.in(Easing.cubic)}, finished => {
        if (finished) runOnJS(onHide)();
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateX: tx.value}],
  }));

  const floorName  = seat?.floor?.name || '';
  const seatLabel  = seat?.label || '';
  const seatDisplay = floorName ? `${floorName} · Seat ${seatLabel}` : `Seat ${seatLabel}`;
  const dateLabel  = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  return (
    <Animated.View style={[toastStyles.card, animStyle]} pointerEvents="none">
      <View style={toastStyles.accentBar} />
      <View style={toastStyles.body}>
        <View style={toastStyles.iconWrap}>
          <View style={toastStyles.iconDot} />
        </View>
        <View style={toastStyles.textBlock}>
          <Text style={toastStyles.title}>Seat Booked!</Text>
          <Text style={toastStyles.sub}>{seatDisplay}  ·  {dateLabel}</Text>
        </View>
        <View style={toastStyles.checkWrap}>
          <Text style={toastStyles.check}>✓</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  card: {
    position: 'absolute',
    right: 16,
    top: 72,
    width: TOAST_W,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 999,
  },
  accentBar: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: `${COLORS.primary}25`,
    alignItems: 'center', justifyContent: 'center',
  },
  iconDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  textBlock: {flex: 1, gap: 3},
  title: {color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: -0.2},
  sub:   {color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500'},
  checkWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${COLORS.primary}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  check: {color: COLORS.primary, fontSize: 15, fontWeight: '900', lineHeight: 20},
});

// Greeting based on time of day
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const {employee, accessToken, logout} = useContext(UserContext);
  const {t} = useTheme();
  const insets = useSafeAreaInsets();

  const profileSheetPan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
    onPanResponderRelease: (_, gs) => {
      if (gs.dy > 60) setShowProfileModal(false);
    },
  })).current;
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [date, setDate] = useState(getTodayInKolkata());
  const [seats, setSeats] = useState([]);
  const [myBookedSeat, setMyBookedSeat] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [anchorDay, setAnchorDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [bookedProfile, setBookedProfile] = useState({visible: false, loading: false, error: '', data: null, seat: null});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toast, setToast] = useState(null); // {seat, date}
  const todayStr = getTodayInKolkata();

  const bookBtnScale = useSharedValue(1);
  const bookBtnStyle = useAnimatedStyle(() => ({transform: [{scale: bookBtnScale.value}]}));

  const activeFloor = floors.find(f => f.id === selectedFloorId) || null;

  const restrictions = computeRestrictions({
    userGroups: employee?.groups,
    anchorDay,
    activeFloor,
    date,
  });

  const userCanBook = canUserBook(employee?.email, restrictions);

  const visibleFloors = restrictions.showFirstFloor
    ? floors
    : floors.filter(f => !isFirstFloor(f));
  const displayedFloors = restrictions.restrictToSecondFloor
    ? visibleFloors.filter(f => !isFirstFloor(f)).length > 0
      ? visibleFloors.filter(f => !isFirstFloor(f))
      : visibleFloors
    : visibleFloors;

  const loadFloors = useCallback(async () => {
    try {
      const data = await getFloors();
      setFloors(data);
      if (data.length > 0 && !selectedFloorId) setSelectedFloorId(data[0].id);
    } catch (err) {
      Alert.alert('Error', 'Failed to load floors');
    }
  }, []);

  const loadSeatsAndBooking = useCallback(async signal => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const [seatData, myBooking] = await Promise.all([
        getSeatBookings(date, selectedFloorId),
        getUserBookingForDate(employee?.email, date),
      ]);
      const stale = () => signal?.cancelled || !mountedRef.current;
      if (stale()) return;
      setSeats(seatData);
      setMyBookedSeat(myBooking);
    } catch (err) {
      if (signal?.cancelled || !mountedRef.current) return;
      Alert.alert('Error', 'Failed to load seat data');
    } finally {
      if (!signal?.cancelled && mountedRef.current) setLoading(false);
    }
  }, [selectedFloorId, date, employee?.email]);

  useEffect(() => {
    let active = true;
    getAnchorDayForDate(date).then(anchor => {
      if (active) setAnchorDay(anchor);
    }).catch(() => {});
    return () => { active = false; };
  }, [date]);

  useEffect(() => {
    if (!floors.length) return;
    const anchorGroups = anchorDay
      ? (Array.isArray(anchorDay.groups)
          ? anchorDay.groups
          : (anchorDay.groups || '').split(/[,;]+/).map(g => g.trim()))
            .map(g => g.toUpperCase())
      : [];
    const isAllSurecomp = anchorGroups.includes('SDOS') && anchorGroups.includes('SDL') && anchorGroups.includes('QA');
    const isThuFri = isThursdayOrFriday(date);
    const floor1Allowed = isAllSurecomp || isThuFri;
    if (floor1Allowed) {
      const floor1 = floors.find(f => isFirstFloor(f));
      if (floor1 && floor1.id !== selectedFloorId) setSelectedFloorId(floor1.id);
    } else {
      const fallback = floors.find(f => !isFirstFloor(f));
      if (fallback && fallback.id !== selectedFloorId) setSelectedFloorId(fallback.id);
    }
  }, [date, anchorDay, floors]);

  useEffect(() => { loadFloors(); }, []);
  useEffect(() => {
    const signal = {cancelled: false};
    loadSeatsAndBooking(signal);
    return () => { signal.cancelled = true; };
  }, [loadSeatsAndBooking]);

  // Refresh seat data every time this tab is focused (e.g. after cancel on History)
  useFocusEffect(
    useCallback(() => {
      const signal = {cancelled: false};
      loadSeatsAndBooking(signal);
      return () => { signal.cancelled = true; };
    }, [loadSeatsAndBooking]),
  );

  const scrollViewRef = useRef(null);
  const bookingPanelY = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSeatPress = seatId => {
    if (!userCanBook || myBookedSeat) return;
    setSelectedSeatId(prev => (prev === seatId ? null : seatId));
    setBookingError('');
    if (seatId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({y: bookingPanelY.current - 16, animated: true});
      }, 80);
    }
  };

  const handleBook = async () => {
    if (!selectedSeatId || bookingLoading) return;
    const seat = seats.find(s => s.id === selectedSeatId);
    if (!seat) return;
    bookBtnScale.value = withSpring(0.95, {damping: 10});
    setBookingLoading(true);
    setBookingError('');
    try {
      await bookSeat({
        seat_id: selectedSeatId,
        date,
        user_email: employee.email,
        floor_id: selectedFloorId,
        status: 'booked',
      });
      setToast({seat, date});
      setSelectedSeatId(null);
      await loadSeatsAndBooking();
    } catch (err) {
      if (err.code === 'SEAT_ALREADY_BOOKED') {
        setBookingError('That seat was just booked by someone else. Please choose another seat.');
      } else if (err.code === 'USER_ALREADY_BOOKED') {
        setBookingError('You already have a booking for this date. Cancel it before selecting a different seat.');
      } else {
        setBookingError(err.message || 'Booking failed. Please try again.');
      }
    } finally {
      bookBtnScale.value = withSpring(1, {damping: 12});
      setBookingLoading(false);
    }
  };

  const handleBookedSeatPress = useCallback(async seat => {
    const email = seat?.booking?.user_email;
    if (!email) return;
    setBookedProfile({visible: true, loading: true, error: '', data: null, seat});
    try {
      if (!accessToken) {
        setBookedProfile(prev => ({...prev, loading: false, error: 'Not authenticated. Please log out and log in again.'}));
        return;
      }
      const profile = await getGraphUserProfile(email, accessToken);
      setBookedProfile(prev => ({...prev, loading: false, data: profile}));
    } catch (err) {
      setBookedProfile(prev => ({...prev, loading: false, error: err?.message || 'Could not load profile.'}));
    }
  }, [accessToken]);

  const selectedSeat = seats.find(s => s.id === selectedSeatId);
  const isFloor1Active = isFirstFloor(activeFloor);
  const isFloor2Active = isSecondFloor(activeFloor);
  const isFloor3Active = isThirdFloor(activeFloor);
  const floorSeats = seats.filter(s => s.floor_id === selectedFloorId || s.floor?.id === selectedFloorId);

  const firstName = employee?.name?.split(' ')[0] || 'there';

  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, {backgroundColor: t.bg}]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Greeting header ──────────────────────────────────────────────── */}
        <View style={styles.headerBlock}>
          {/* Left: greeting + name + legend */}
          <View style={{flex: 1}}>
            <Text style={[styles.greeting, {color: t.textSub}]}>{getGreeting()}</Text>
            <Text style={[styles.userName, {color: t.text}]}>{firstName}</Text>
            <View style={styles.legendSide}>
              {[
                {color: COLORS.seatAvailableAccent, label: 'Available'},
                {color: COLORS.seatBookedAccent,    label: 'Booked'},
                {color: COLORS.myBookingText,       label: 'My Seat'},
                {color: COLORS.seatDisabledAccent,  label: 'Disabled'},
              ].map(({color, label}) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: color}]} />
                  <Text style={[styles.legendLabel, {color: t.textSub}]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Right: avatar + online dot — tap to open profile modal */}
          <TouchableOpacity
            style={styles.headerAvatarWrap}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.75}>
            {employee?.profilePic ? (
              <Image source={{uri: employee.profilePic}} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatarFallback, {borderColor: COLORS.primaryGlow}]}>
                <Text style={styles.headerAvatarInitial}>
                  {employee?.name ? employee.name[0].toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={[styles.headerOnlineDot, {borderColor: t.bg}]} />
          </TouchableOpacity>
        </View>

        {/* ── Mini week calendar ────────────────────────────────────────────── */}
        {(() => {
          // Compute week days for current offset
          const today = new Date(todayStr);
          const anchor = new Date(today);
          anchor.setDate(anchor.getDate() + calWeekOffset * 7);
          // Sunday of that week
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
            <View style={[styles.miniCal, {backgroundColor: t.card, borderColor: t.cardBorder}]}>
              {/* Header: prev / month label / next */}
              <View style={styles.miniCalHeader}>
                <TouchableOpacity
                  style={[styles.miniCalNavBtn, {backgroundColor: t.chipBg}]}
                  onPress={() => setCalWeekOffset(o => o - 1)}>
                  <Text style={[styles.miniCalNavArrow, {color: t.textSub}]}>‹</Text>
                </TouchableOpacity>
                <Text style={[styles.miniCalMonth, {color: t.text}]}>{monthLabel}</Text>
                <TouchableOpacity
                  style={[styles.miniCalNavBtn, {backgroundColor: t.chipBg}]}
                  onPress={() => setCalWeekOffset(o => o + 1)}>
                  <Text style={[styles.miniCalNavArrow, {color: t.textSub}]}>›</Text>
                </TouchableOpacity>
              </View>
              {/* Day cells */}
              <View style={styles.miniCalRow}>
                {weekDays.map(({dateStr, dayLabel, dayNum}) => {
                  const isPast = dateStr < todayStr;
                  const isSelected = dateStr === date;
                  const isToday = dateStr === todayStr;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={[
                        styles.miniCalCell,
                        isSelected && {backgroundColor: COLORS.primary},
                        isPast && {opacity: 0.35},
                      ]}
                      onPress={() => {
                        if (isPast) return;
                        setDate(dateStr);
                        setSelectedSeatId(null);
                      }}
                      disabled={isPast}
                      activeOpacity={0.75}>
                      <Text style={[
                        styles.miniCalDayLabel,
                        {color: isSelected ? 'rgba(255,255,255,0.75)' : t.textSub},
                      ]}>{dayLabel}</Text>
                      <Text style={[
                        styles.miniCalDayNum,
                        {color: isSelected ? '#fff' : t.text},
                      ]}>{dayNum}</Text>
                      {isToday && (
                        <View style={[styles.miniCalTodayDot, {backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : COLORS.primary}]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* ── Floor selector ────────────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, {color: t.textSub}]}>Floor</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {displayedFloors.map(floor => (
            <TouchableOpacity
              key={floor.id}
              style={[
                styles.floorChip,
                {backgroundColor: t.chipBg, borderColor: t.chipBorder},
                selectedFloorId === floor.id && {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
              ]}
              onPress={() => {setSelectedFloorId(floor.id); setSelectedSeatId(null);}}>
              <Text style={[
                styles.floorChipText,
                {color: t.textSub},
                selectedFloorId === floor.id && styles.floorChipTextActive,
              ]}>
                {floor.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Restriction warning ───────────────────────────────────────────── */}
        {restrictions.blocked && (
          <View style={[styles.restrictionPanel, {
            backgroundColor: COLORS.restrictionBg,
            borderColor: COLORS.restrictionBorder,
          }]}>
            <Text style={[styles.restrictionText, {color: COLORS.restrictionText}]}>
              {restrictions.blockReason}
            </Text>
          </View>
        )}

        {/* ── Seat map ──────────────────────────────────────────────────────── */}
        {loading && (
          <View style={{height: 200, alignItems: 'center', justifyContent: 'center'}}>
            <Loader color={COLORS.primary} size={28} />
          </View>
        )}
        <View style={[styles.seatMapCard, {backgroundColor: t.card, borderColor: t.cardBorder}, loading && {opacity: 0, height: 0, overflow: 'hidden'}]}>
          {isFloor1Active ? (
            <View style={{height: 620}}>
              <FirstFloorSeatLayout
                seats={floorSeats}
                selectedSeatId={selectedSeatId}
                onSeatPress={handleSeatPress}
                onBookedSeatPress={handleBookedSeatPress}
                myBookedSeatId={myBookedSeat?.seat_id}
                userEmail={employee?.email}
              />
            </View>
          ) : isFloor2Active ? (
            <View style={{height: 620}}>
              <SecondFloorSeatLayout
                seats={floorSeats}
                selectedSeatId={selectedSeatId}
                onSeatPress={handleSeatPress}
                onBookedSeatPress={handleBookedSeatPress}
                myBookedSeatId={myBookedSeat?.seat_id}
                userEmail={employee?.email}
              />
            </View>
          ) : isFloor3Active ? (
            <View style={{height: 500}}>
              <ThirdFloorSeatLayout
                seats={floorSeats}
                selectedSeatId={selectedSeatId}
                onSeatPress={handleSeatPress}
                onBookedSeatPress={handleBookedSeatPress}
                myBookedSeatId={myBookedSeat?.seat_id}
                userEmail={employee?.email}
              />
            </View>
          ) : (
            <FloorSeatLayout
              seats={seats}
              floors={floors}
              selectedFloorId={selectedFloorId}
              selectedSeatId={selectedSeatId}
              myBookedSeatId={myBookedSeat?.seat_id}
              onSeatPress={handleSeatPress}
              onBookedSeatPress={handleBookedSeatPress}
              userEmail={employee?.email}
            />
          )}
        </View>

        {/* ── My booking panel ──────────────────────────────────────────────── */}
        {myBookedSeat && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={[styles.myBookingPanel, {
              backgroundColor: COLORS.myBookingBg,
              borderColor: COLORS.myBookingBorder,
            }]}>
            <View style={[styles.myBookingAccent, {backgroundColor: COLORS.primary}]} />
            <View style={styles.myBookingBody}>
              <Text style={[styles.myBookingLabel, {color: COLORS.myBookingText}]}>Your Seat</Text>
              <Text style={[styles.myBookingText, {color: t.text}]}>
                {myBookedSeat.seat?.floor?.name}-{myBookedSeat.seat?.label}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Selected seat panel ───────────────────────────────────────────── */}
        {selectedSeat && !myBookedSeat && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.selectedPanel, {backgroundColor: COLORS.seatSelectedBase, borderColor: COLORS.seatSelectedAccent}]}
            onLayout={e => {
              bookingPanelY.current = e.nativeEvent.layout.y;
              scrollViewRef.current?.scrollTo({y: bookingPanelY.current - 16, animated: true});
            }}>
            <View style={[styles.selectedAccent, {backgroundColor: COLORS.seatSelectedAccent}]} />
            <View style={styles.selectedBody}>
              <Text style={[styles.selectedLabel, {color: COLORS.seatSelectedAccent}]}>
                {selectedSeat.floor?.name
                  ? `${selectedSeat.floor.name}-${selectedSeat.label}`
                  : selectedSeat.label}
              </Text>
              {selectedSeat.has_monitor && (
                <View style={[styles.monitorBadge, {backgroundColor: COLORS.monitorBadge}]}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="3" width="20" height="14" rx="2" stroke="#fff" strokeWidth={2} />
                    <Path d="M8 21H16M12 17V21" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.monitorText}>Monitor</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── Booking error ─────────────────────────────────────────────────── */}
        {bookingError !== '' && (
          <View style={[styles.errorPanel, {backgroundColor: 'rgba(239,83,80,0.08)', borderColor: 'rgba(239,83,80,0.25)'}]}>
            <Text style={[styles.errorText, {color: '#ef5350'}]}>{bookingError}</Text>
          </View>
        )}

        {/* ── Book button ───────────────────────────────────────────────────── */}
        {selectedSeatId && !myBookedSeat && userCanBook && (
          <Animated.View style={[bookBtnStyle, {marginTop: 16}]}>
            <TouchableOpacity
              style={[styles.bookBtn, bookingLoading && styles.bookBtnDisabled]}
              onPress={handleBook}
              disabled={bookingLoading}
              activeOpacity={0.88}>
              {bookingLoading ? (
                <Loader color="#fff" size={22} />
              ) : (
                <Text style={styles.bookBtnText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>

      {/* ── Profile bottom sheet ──────────────────────────────────────────────── */}
      <Modal
        visible={bookedProfile.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookedProfile(p => ({...p, visible: false}))}>
        <TouchableOpacity
          style={styles.profileOverlay}
          activeOpacity={1}
          onPress={() => setBookedProfile(p => ({...p, visible: false}))}>
          <View
            style={[styles.profileSheet, {backgroundColor: t.card}]}
            onStartShouldSetResponder={() => true}>
            <View style={[styles.profileHandle, {backgroundColor: t.divider}]} />
            <Text style={[styles.profileSeatLabel, {color: COLORS.primary}]}>
              {bookedProfile.seat?.floor?.name
                ? `${bookedProfile.seat.floor.name}-${bookedProfile.seat?.label}`
                : bookedProfile.seat?.label}
            </Text>
            {bookedProfile.loading ? (
              <Loader color={COLORS.primary} style={{marginTop: 24}} />
            ) : bookedProfile.error ? (
              <Text style={styles.profileError}>{bookedProfile.error}</Text>
            ) : bookedProfile.data ? (
              <View style={styles.profileContent}>
                {bookedProfile.data.photoUrl ? (
                  <Image source={{uri: bookedProfile.data.photoUrl}} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, {backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center'}]}>
                    <Text style={styles.profileAvatarInitial}>
                      {(bookedProfile.data.displayName || bookedProfile.seat?.booking?.user_email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, {color: t.text}]}>
                    {bookedProfile.data.displayName || bookedProfile.data.mail}
                  </Text>
                  {(bookedProfile.data.jobTitle || bookedProfile.data.department) ? (
                    <Text style={[styles.profileRole, {color: t.textSub}]}>
                      {[bookedProfile.data.jobTitle, bookedProfile.data.department].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  <Text style={[styles.profileEmail, {color: t.textTertiary}]}>{bookedProfile.data.mail}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.profileError}>No profile found.</Text>
            )}
            <TouchableOpacity
              style={[styles.profileCloseBtn, {backgroundColor: COLORS.primary}]}
              onPress={() => setBookedProfile(p => ({...p, visible: false}))}>
              <Text style={styles.profileCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* ── My Profile Modal — tap avatar to open, swipe down to close ────────── */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}>
        {/* Backdrop — tap to close */}
        <TouchableOpacity
          style={styles.profileOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}>
          {/* Sheet — stops tap propagation + handles swipe down */}
          <View
            style={[styles.profileSheet, {backgroundColor: t.card, paddingBottom: insets.bottom + 24}]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
            {...profileSheetPan.panHandlers}>
            {/* Drag handle */}
            <View style={[styles.profileHandle, {backgroundColor: t.divider}]} />

            {/* Avatar */}
            <View style={styles.myProfileAvatarWrap}>
              {employee?.profilePic ? (
                <Image source={{uri: employee.profilePic}} style={styles.myProfileAvatar} />
              ) : (
                <View style={[styles.myProfileAvatar, {backgroundColor: COLORS.primaryMuted, justifyContent: 'center', alignItems: 'center'}]}>
                  <Text style={[styles.profileAvatarInitial, {fontSize: 32, color: COLORS.primary}]}>
                    {employee?.name ? employee.name[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={[styles.headerOnlineDot, {borderColor: t.card, width: 14, height: 14, borderRadius: 7}]} />
            </View>

            {/* Name + email */}
            <Text style={[styles.profileName, {color: t.text, textAlign: 'center', marginTop: 14}]}>
              {employee?.name || 'Unknown'}
            </Text>
            <Text style={[styles.profileEmail, {color: t.textSub, textAlign: 'center', marginTop: 4}]}>
              {employee?.email || ''}
            </Text>

            {/* Logout — solid red */}
            <TouchableOpacity
              style={styles.myProfileLogoutBtn}
              onPress={() => { setShowProfileModal(false); logout(); }}
              activeOpacity={0.82}>
              <Text style={styles.myProfileLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Booking toast — slides in from right ──────────────────────────────── */}
      {toast && (
        <BookingToast
          seat={toast.seat}
          date={toast.date}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 32},

  // Header
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 4,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginLeft: 12,
    marginTop: 2,
  },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
  },
  headerAvatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarInitial: {
    color: COLORS.primary, fontWeight: '800', fontSize: 18,
  },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4caf50', borderWidth: 2,
  },
  greeting: {fontSize: 13, fontWeight: '500', marginBottom: 2},
  userName: {fontSize: 24, fontWeight: '800', letterSpacing: -0.8},
  dateBadge: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dateBadgeText: {fontSize: 12, fontWeight: '700', letterSpacing: 0.2},

  // Section row
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase'},

  // Mini week calendar
  miniCal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  miniCalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  miniCalNavBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  miniCalNavArrow: {fontSize: 20, lineHeight: 22, fontWeight: '600'},
  miniCalMonth: {fontSize: 14, fontWeight: '700', letterSpacing: -0.2},
  miniCalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniCalCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  miniCalDayLabel: {fontSize: 10, fontWeight: '600', letterSpacing: 0.2, marginBottom: 5},
  miniCalDayNum: {fontSize: 15, fontWeight: '700'},
  miniCalTodayDot: {width: 4, height: 4, borderRadius: 2, marginTop: 3},

  // Floor chips
  floorScroll: {marginBottom: 16},
  floorChip: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    borderWidth: 1.5,
  },
  floorChipText: {fontSize: 13, fontWeight: '600'},
  floorChipTextActive: {color: '#FFFFFF', fontWeight: '700'},

  // Floor + legend row
  floorLegendRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4},
  floorSide: {flex: 1, marginRight: 8},
  legendSide: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8, gap: 10},
  legendItem: {flexDirection: 'row', alignItems: 'center', marginRight: 8},
  legendDot: {width: 8, height: 8, borderRadius: 4, marginRight: 4},
  legendLabel: {fontSize: 10, fontWeight: '600', letterSpacing: 0.2},

  // Restriction
  restrictionPanel: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  restrictionText: {fontWeight: '600', fontSize: 13},

  // Seat map card
  seatMapCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  seatMapLoader: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // My booking
  myBookingPanel: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
    overflow: 'hidden',
  },
  myBookingAccent: {width: 4},
  myBookingBody: {flex: 1, padding: 14},
  myBookingLabel: {fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4},
  myBookingText: {fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12},

  // Selected seat
  selectedPanel: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
    overflow: 'hidden',
  },
  selectedAccent: {width: 4},
  selectedBody: {flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10},
  selectedLabel: {fontWeight: '700', fontSize: 15},
  monitorBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start'},
  monitorText: {color: '#fff', fontSize: 11, fontWeight: '600'},

  // Error
  errorPanel: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  errorText: {fontSize: 13, fontWeight: '500'},

  // Book button
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  bookBtnDisabled: {opacity: 0.65, shadowOpacity: 0},
  bookBtnText: {color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.1},


  // Profile sheet
  profileOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  profileSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  profileHandle: {width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20},
  profileSeatLabel: {fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: 0.4},
  profileContent: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  profileAvatar: {width: 60, height: 60, borderRadius: 30, marginRight: 16},
  profileAvatarInitial: {color: '#fff', fontSize: 24, fontWeight: '700'},
  profileInfo: {flex: 1},
  profileName: {fontSize: 17, fontWeight: '800', marginBottom: 3, letterSpacing: -0.3},
  profileRole: {fontSize: 13, marginBottom: 3},
  profileEmail: {fontSize: 12},
  profileError: {color: '#ef5350', fontSize: 13, textAlign: 'center', marginVertical: 20},
  profileCloseBtn: {borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4},
  profileCloseBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},

  // My profile modal
  myProfileAvatarWrap: {alignItems: 'center', marginTop: 8, position: 'relative', alignSelf: 'center'},
  myProfileAvatar: {width: 80, height: 80, borderRadius: 40},
  myProfileLogoutBtn: {
    marginTop: 28,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#ef5350',
    shadowColor: '#ef5350',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  myProfileLogoutText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
