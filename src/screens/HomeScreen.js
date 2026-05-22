import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Image,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import { getGraphUserProfile } from '../services/graphService';
import { getFloors } from '../services/seatService';
import {
  getSeatBookings, getUserBookingForDate, bookSeat,
  cancelSeatBooking, getAnchorDayForDate, getBookingCountForDate,
} from '../services/bookingService';
import { getTodayInKolkata, formatDate, isUpcomingOrToday } from '../utils/dateUtils';
import { computeRestrictions, canUserBook, isFirstFloor, isSecondFloor, isThirdFloor } from '../utils/bookingRestrictions';
import FloorSeatLayout from '../components/seat/FloorSeatLayout';
import FirstFloorSeatLayout from '../components/seat/FirstFloorSeatLayout';
import SecondFloorSeatLayout from '../components/seat/SecondFloorSeatLayout';
import ThirdFloorSeatLayout from '../components/seat/ThirdFloorSeatLayout';
import { COLORS } from '../theme/colors';

export default function HomeScreen() {
  const { employee, isAdmin, accessToken } = useContext(UserContext);
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [date, setDate] = useState(getTodayInKolkata());
  const [seats, setSeats] = useState([]);
  const [myBookedSeat, setMyBookedSeat] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [anchorDay, setAnchorDay] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [bookedProfile, setBookedProfile] = useState({ visible: false, loading: false, error: '', data: null, seat: null });
  const todayStr = getTodayInKolkata();

  const activeFloor = floors.find((f) => f.id === selectedFloorId) || null;

  const restrictions = computeRestrictions({
    userGroups: employee?.groups,
    anchorDay,
    activeFloor,
    date,
  });

  const userCanBook = canUserBook(employee?.email, restrictions);

  // Mirror web: hide floor 1 from selector when restrictToSecondFloor is true
  const displayedFloors = restrictions.restrictToSecondFloor
    ? floors.filter((f) => !isFirstFloor(f)).length > 0
      ? floors.filter((f) => !isFirstFloor(f))
      : floors
    : floors;

  const loadFloors = useCallback(async () => {
    try {
      const data = await getFloors();
      setFloors(data);
      if (data.length > 0 && !selectedFloorId) {
        setSelectedFloorId(data[0].id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load floors');
    }
  }, []);

  const loadSeatsAndBooking = useCallback(async () => {
    if (!selectedFloorId) return;
    setLoading(true);
    try {
      const [seatData, myBooking, anchor] = await Promise.all([
        getSeatBookings(date, selectedFloorId),
        getUserBookingForDate(employee?.email, date),
        getAnchorDayForDate(date),
      ]);
      setSeats(seatData);
      setMyBookedSeat(myBooking);
      setAnchorDay(anchor);
      if (isAdmin) {
        const count = await getBookingCountForDate(date);
        setBookingCount(count);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load seat data');
    } finally {
      setLoading(false);
    }
  }, [selectedFloorId, date, employee?.email, isAdmin]);

  useEffect(() => { loadFloors(); }, []);
  useEffect(() => { loadSeatsAndBooking(); }, [selectedFloorId, date]);

  const handleSeatPress = (seatId) => {
    if (!userCanBook || myBookedSeat) return;
    setSelectedSeatId((prev) => (prev === seatId ? null : seatId));
    setBookingError('');
  };

  const handleBook = async () => {
    if (!selectedSeatId || bookingLoading) return;
    const seat = seats.find((s) => s.id === selectedSeatId);
    if (!seat) return;
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
      setBookingLoading(false);
    }
  };

  const handleCancelSeat = async () => {
    if (!myBookedSeat || bookingLoading) return;
    setBookingLoading(true);
    try {
      await cancelSeatBooking(myBookedSeat.id);
      setShowCancelConfirm(false);
      await loadSeatsAndBooking();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to cancel booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookedSeatPress = useCallback(async (seat) => {
    const email = seat?.booking?.user_email;
    if (!email) {
      return;
    }
    setBookedProfile({ visible: true, loading: true, error: '', data: null, seat });
    try {
      if (!accessToken) {
        setBookedProfile((prev) => ({ ...prev, loading: false, error: 'Not authenticated. Please log out and log in again.' }));
        return;
      }
      const profile = await getGraphUserProfile(email, accessToken);
      setBookedProfile((prev) => ({ ...prev, loading: false, data: profile }));
    } catch (err) {
      setBookedProfile((prev) => ({ ...prev, loading: false, error: err?.message || 'Could not load profile.' }));
    }
  }, [accessToken]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);
  const isFloor1Active = isFirstFloor(activeFloor);
  const isFloor2Active = isSecondFloor(activeFloor);
  const isFloor3Active = isThirdFloor(activeFloor);
  const floorSeats = seats.filter((s) => s.floor_id === selectedFloorId || s.floor?.id === selectedFloorId);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Seat Booking</Text>

      {isAdmin && (
        <View style={styles.adminCard}>
          <Text style={styles.adminText}>Today's bookings: {bookingCount}</Text>
          {anchorDay && (
            <Text style={styles.anchorText}>
              Anchor Day — Groups: {(anchorDay.groups || []).join(', ')}
            </Text>
          )}
        </View>
      )}

      {/* Date selector */}
      <View style={styles.dateRow}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.datePill}
          onPress={() => {
            const parts = date.split('-');
            setPickerYear(parseInt(parts[0], 10));
            setPickerMonth(parseInt(parts[1], 10) - 1);
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.datePillText}>{formatDate(date)}</Text>
          <Text style={styles.datePillIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Date picker modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => {
                const d = new Date(pickerYear, pickerMonth - 1, 1);
                setPickerYear(d.getFullYear());
                setPickerMonth(d.getMonth());
              }}>
                <Text style={styles.pickerNav}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {new Date(pickerYear, pickerMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const d = new Date(pickerYear, pickerMonth + 1, 1);
                setPickerYear(d.getFullYear());
                setPickerMonth(d.getMonth());
              }}>
                <Text style={styles.pickerNav}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.pickerDayHeaders}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                <Text key={d} style={styles.pickerDayHeader}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.pickerGrid}>
              {(() => {
                const firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
                const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                const cells = [];
                for (let i = 0; i < firstDay; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                return cells.map((day, idx) => {
                  if (!day) return <View key={`e-${idx}`} style={styles.pickerCell} />;
                  const mm = String(pickerMonth + 1).padStart(2, '0');
                  const dd = String(day).padStart(2, '0');
                  const cellDate = `${pickerYear}-${mm}-${dd}`;
                  const isPast = cellDate < todayStr;
                  const isSelected = cellDate === date;
                  const isToday = cellDate === todayStr;
                  return (
                    <TouchableOpacity
                      key={cellDate}
                      style={[
                        styles.pickerCell,
                        isSelected && styles.pickerCellSelected,
                        isToday && !isSelected && styles.pickerCellToday,
                        isPast && styles.pickerCellPast,
                      ]}
                      onPress={() => {
                        if (isPast) return;
                        setDate(cellDate);
                        setSelectedSeatId(null);
                        setShowCancelConfirm(false);
                        setShowDatePicker(false);
                      }}
                      disabled={isPast}
                    >
                      <Text style={[
                        styles.pickerCellText,
                        isSelected && styles.pickerCellTextSelected,
                        isPast && styles.pickerCellTextPast,
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floor selector */}
      <View style={styles.floorRow}>
        <Text style={styles.label}>Floor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {displayedFloors.map((floor) => (
            <TouchableOpacity
              key={floor.id}
              style={[styles.floorChip, selectedFloorId === floor.id && styles.floorChipActive]}
              onPress={() => { setSelectedFloorId(floor.id); setSelectedSeatId(null); }}
            >
              <Text style={[styles.floorChipText, selectedFloorId === floor.id && styles.floorChipTextActive]}>
                {floor.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Restriction warning */}
      {restrictions.blocked && (
        <View style={styles.restrictionPanel}>
          <Text style={styles.restrictionText}>{restrictions.blockReason}</Text>
        </View>
      )}

      {/* Seat map */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : isFloor1Active ? (
        <View style={{ height: 620 }}>
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
        <View style={{ height: 620 }}>
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
        <View style={{ height: 500 }}>
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

      {/* My booked seat panel */}
      {myBookedSeat && (
        <View style={styles.myBookingPanel}>
          <Text style={styles.myBookingText}>
            Your booked seat: {myBookedSeat.seat?.floor?.name}-{myBookedSeat.seat?.label}
          </Text>
          {isUpcomingOrToday(date) && (
            showCancelConfirm ? (
              <View style={styles.cancelConfirmRow}>
                <TouchableOpacity
                  style={styles.keepBtn}
                  onPress={() => setShowCancelConfirm(false)}
                  disabled={bookingLoading}
                >
                  <Text style={styles.keepBtnText}>Keep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={handleCancelSeat}
                  disabled={bookingLoading}
                >
                  <Text style={styles.confirmCancelText}>
                    {bookingLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCancelConfirm(true)}
                disabled={bookingLoading}
              >
                <Text style={styles.cancelBtnText}>Cancel Seat</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* Selected seat info */}
      {selectedSeat && !myBookedSeat && (
        <View style={styles.selectedPanel}>
          <Text style={styles.selectedLabel}>
            Selected: {selectedSeat.floor?.name ? `${selectedSeat.floor.name}-${selectedSeat.label}` : selectedSeat.label}
          </Text>
          {selectedSeat.has_monitor && (
            <View style={styles.monitorBadge}>
              <Text style={styles.monitorText}>🖥 Monitor Available</Text>
            </View>
          )}
        </View>
      )}

      {/* Booking error */}
      {bookingError !== '' && (
        <View style={styles.errorPanel}>
          <Text style={styles.errorText}>{bookingError}</Text>
        </View>
      )}

      {/* Book button */}
      {selectedSeatId && !myBookedSeat && userCanBook && (
        <TouchableOpacity
          style={[styles.bookBtn, bookingLoading && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookBtnText}>Book Your Seat</Text>
          )}
        </TouchableOpacity>
      )}

    </ScrollView>
      <Modal
        visible={bookedProfile.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookedProfile((p) => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={styles.profileOverlay}
          activeOpacity={1}
          onPress={() => setBookedProfile((p) => ({ ...p, visible: false }))}
        >
          <View style={styles.profileSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.profileHandle} />
            <Text style={styles.profileSeatLabel}>
              {bookedProfile.seat?.floor?.name
                ? `${bookedProfile.seat.floor.name}-${bookedProfile.seat?.label}`
                : bookedProfile.seat?.label}
            </Text>
            {bookedProfile.loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
            ) : bookedProfile.error ? (
              <Text style={styles.profileError}>{bookedProfile.error}</Text>
            ) : bookedProfile.data ? (
              <View style={styles.profileContent}>
                {bookedProfile.data.photoUrl ? (
                  <Image source={{ uri: bookedProfile.data.photoUrl }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, styles.profileAvatarFallback]}>
                    <Text style={styles.profileAvatarInitial}>
                      {(bookedProfile.data.displayName || bookedProfile.seat?.booking?.user_email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{bookedProfile.data.displayName || bookedProfile.data.mail}</Text>
                  {(bookedProfile.data.jobTitle || bookedProfile.data.department) ? (
                    <Text style={styles.profileRole}>
                      {[bookedProfile.data.jobTitle, bookedProfile.data.department].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  <Text style={styles.profileEmail}>{bookedProfile.data.mail}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.profileError}>No profile found.</Text>
            )}
            <TouchableOpacity
              style={styles.profileCloseBtn}
              onPress={() => setBookedProfile((p) => ({ ...p, visible: false }))}
            >
              <Text style={styles.profileCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  adminCard: {
    backgroundColor: '#fff3e0', borderRadius: 8, padding: 12, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  adminText: { fontWeight: '600', color: '#e65100' },
  anchorText: { fontSize: 13, color: '#bf360c', marginTop: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  floorRow: { marginBottom: 16 },
  label: { fontWeight: '600', marginRight: 8, color: COLORS.textPrimaryLight },
  dateValue: { color: COLORS.textPrimaryLight, fontSize: 14 },
  floorChip: {
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8,
    backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd',
  },
  floorChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  floorChipText: { color: '#555', fontSize: 13 },
  floorChipTextActive: { color: '#fff', fontWeight: '600' },
  restrictionPanel: {
    backgroundColor: COLORS.restrictionBg, borderWidth: 2, borderColor: COLORS.restrictionBorder,
    borderRadius: 8, padding: 12, marginBottom: 12,
  },
  restrictionText: { color: COLORS.restrictionText, fontWeight: '600' },
  myBookingPanel: {
    backgroundColor: COLORS.myBookingBg, borderWidth: 2, borderColor: COLORS.myBookingBorder,
    borderRadius: 8, padding: 12, marginTop: 12,
  },
  myBookingText: { color: COLORS.myBookingText, fontWeight: '600', marginBottom: 8 },
  cancelBtn: {
    backgroundColor: '#d32f2f', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
  cancelConfirmRow: { flexDirection: 'row', gap: 8 },
  keepBtn: { backgroundColor: '#757575', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16 },
  keepBtnText: { color: '#fff', fontWeight: '600' },
  confirmCancelBtn: { backgroundColor: '#d32f2f', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16 },
  confirmCancelText: { color: '#fff', fontWeight: '600' },
  selectedPanel: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd',
    borderRadius: 8, padding: 10, marginTop: 12,
  },
  selectedLabel: { fontWeight: '600', color: '#1976d2' },
  monitorBadge: { backgroundColor: 'rgba(25,118,210,0.9)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  monitorText: { color: '#fff', fontSize: 11 },
  errorPanel: { backgroundColor: '#ffebee', borderRadius: 8, padding: 10, marginTop: 8 },
  errorText: { color: '#c62828', fontSize: 13 },
  bookBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  bookBtnDisabled: { opacity: 0.7 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  datePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
  },
  datePillText: { color: COLORS.primary, fontWeight: '600', fontSize: 14, marginRight: 4 },
  datePillIcon: { color: COLORS.primary, fontSize: 10 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    width: '90%', maxWidth: 360,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pickerNav: { fontSize: 24, color: COLORS.primary, paddingHorizontal: 8 },
  pickerTitle: { fontWeight: '700', fontSize: 16, color: COLORS.textPrimaryLight },
  pickerDayHeaders: { flexDirection: 'row', marginBottom: 4 },
  pickerDayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#888' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, marginVertical: 2,
  },
  pickerCellSelected: { backgroundColor: COLORS.primary },
  pickerCellToday: { borderWidth: 1.5, borderColor: COLORS.primary },
  pickerCellPast: { opacity: 0.35 },
  pickerCellText: { fontSize: 13, color: COLORS.textPrimaryLight },
  pickerCellTextSelected: { color: '#fff', fontWeight: '700' },
  pickerCellTextPast: { color: '#aaa' },
  pickerClose: {
    marginTop: 16, alignSelf: 'center',
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 32,
  },
  pickerCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  profileOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  profileSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  profileHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
  profileSeatLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 16, letterSpacing: 0.4 },
  profileContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  profileAvatarFallback: { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  profileAvatarInitial: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 2 },
  profileRole: { fontSize: 13, color: '#555', marginBottom: 2 },
  profileEmail: { fontSize: 12, color: '#888' },
  profileError: { color: '#c62828', fontSize: 13, textAlign: 'center', marginVertical: 16 },
  profileCloseBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  profileCloseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
