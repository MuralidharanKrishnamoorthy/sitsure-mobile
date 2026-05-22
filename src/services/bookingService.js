import { supabase } from './supabase';

export async function getUserBookingForDate(userEmail, date) {
  if (!userEmail) return null;
  const { data, error } = await supabase
    .from('seat_bookings')
    .select('*, seat:seat_id(*, floor:floor_id(*))')
    .eq('user_email', userEmail)
    .eq('date', date);
  if (error) throw error;
  if (!data) return null;
  const active = data.find((b) => b.status !== 'cancelled');
  return active || null;
}

export async function getSeatBookings(date, floorId) {
  let seatQuery = supabase.from('seats').select('*, floor:floor_id(*)').order('id', { ascending: true });
  if (floorId) seatQuery = seatQuery.eq('floor_id', floorId);
  const { data: seats, error: seatError } = await seatQuery;
  if (seatError) throw seatError;

  const { data: bookings, error: bookingError } = await supabase
    .from('seat_bookings')
    .select('*')
    .eq('date', date);
  if (bookingError) throw bookingError;

  const bookingMap = {};
  bookings.forEach((booking) => {
    if (booking.status !== 'cancelled') {
      bookingMap[booking.seat_id] = booking;
    }
  });

  return seats.map((seat) => ({
    ...seat,
    floor: seat.floor,
    booking: bookingMap[seat.id] || null,
  }));
}

export async function getBookingsByDate(date) {
  if (!date) throw new Error('Date is required');
  const { data, error } = await supabase
    .from('seat_bookings')
    .select('*, seat:seat_id(*, floor:floor_id(*)), floor:floor_id(*)')
    .eq('date', date)
    .or('status.is.null,status.eq.booked')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function bookSeat({ seat_id, date, user_email, floor_id = null, status = 'booked' }) {
  const payload = { seat_id, date, user_email, status };
  if (floor_id !== undefined && floor_id !== null && floor_id !== '') {
    const normalizedFloorId = Number(floor_id);
    payload.floor_id = Number.isNaN(normalizedFloorId) ? floor_id : normalizedFloorId;
  }

  const { data, error } = await supabase
    .from('seat_bookings')
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const seatConflictConstraints = [
        'seat_booking_seat_id_date_key',
        'seat_booking_seat_id_date_status_key',
        'seat_booking_seat_id_date_active_idx',
        'seat_booking_seat_id_date_active_key',
      ];
      if (seatConflictConstraints.some((name) => error.message?.includes(name))) {
        const err = new Error('This seat is already booked for the selected date.');
        err.code = 'SEAT_ALREADY_BOOKED';
        throw err;
      }
      if (error.message?.includes('seat_booking_user_email_date_status_key')) {
        const err = new Error('You already have a seat booked for this date.');
        err.code = 'USER_ALREADY_BOOKED';
        throw err;
      }
    }
    throw error;
  }
  return data;
}

export async function cancelSeatBooking(bookingId) {
  if (!bookingId) throw new Error('Missing booking id');

  const { data: existingBooking, error: fetchError } = await supabase
    .from('seat_bookings')
    .select('id, seat_id, user_email, date')
    .eq('id', bookingId)
    .single();
  if (fetchError) throw fetchError;
  if (!existingBooking) throw new Error('Booking not found');

  const deletionFilters = [{ column: 'user_email', value: existingBooking.user_email }];
  if (existingBooking.seat_id !== null && existingBooking.seat_id !== undefined) {
    deletionFilters.push({ column: 'seat_id', value: existingBooking.seat_id });
  }

  for (const filter of deletionFilters) {
    const { error: cleanupError } = await supabase
      .from('seat_bookings')
      .delete()
      .eq(filter.column, filter.value)
      .eq('date', existingBooking.date)
      .eq('status', 'cancelled')
      .neq('id', bookingId);
    if (cleanupError) throw cleanupError;
  }

  const { data, error } = await supabase
    .from('seat_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelBookingById(bookingId) {
  if (!bookingId) throw new Error('Missing booking id');
  const { data: booking, error: fetchError } = await supabase
    .from('seat_bookings')
    .select('id, user_email, date')
    .eq('id', bookingId)
    .single();
  if (fetchError) throw fetchError;
  if (!booking) throw new Error('Booking not found');

  const { error: deleteError } = await supabase
    .from('seat_bookings')
    .delete()
    .eq('user_email', booking.user_email)
    .eq('date', booking.date)
    .eq('status', 'cancelled')
    .neq('id', bookingId);
  if (deleteError) throw deleteError;

  const { data, error } = await supabase
    .from('seat_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserBookingHistory(userEmail, { limit = 50 } = {}) {
  if (!userEmail) return [];
  let q = supabase
    .from('seat_bookings')
    .select('*, seat:seat_id(*, floor:floor_id(*))')
    .eq('user_email', userEmail)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (limit && Number.isFinite(limit)) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAnchorDayForDate(date) {
  const { data, error } = await supabase
    .from('anchor_days')
    .select('*')
    .eq('date', date)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getAnchorDays() {
  const { data: anchorData, error: anchorError } = await supabase
    .from('anchor_days')
    .select('*')
    .order('date', { ascending: true });
  if (anchorError) throw anchorError;
  const anchorDays = anchorData || [];

  const { data: bookingData, error: bookingError } = await supabase
    .from('seat_bookings')
    .select('date, status')
    .or('status.is.null,status.eq.booked');
  if (bookingError) throw bookingError;

  const countsByDate = new Map();
  (bookingData || []).forEach((row) => {
    if (!row?.date) return;
    countsByDate.set(row.date, (countsByDate.get(row.date) || 0) + 1);
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  return anchorDays.map((entry) => {
    const normalizedGroups = Array.isArray(entry.groups)
      ? entry.groups
      : typeof entry.groups === 'string'
      ? entry.groups.split(/[,;]+/).map((g) => g.trim())
      : [];
    return {
      ...entry,
      groups: normalizedGroups,
      bookingCount: countsByDate.get(entry.date) ?? 0,
      upcoming: new Date(entry.date) >= new Date(todayIso),
    };
  });
}

export async function upsertAnchorDay({ date, groups = [] }) {
  if (!date) throw new Error('Date is required');
  const { data, error } = await supabase
    .from('anchor_days')
    .insert({ date, groups })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('An anchor day already exists for the selected date.');
    throw error;
  }
  return data;
}

export async function bulkUpsertAnchorDays(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const { data, error } = await supabase
    .from('anchor_days')
    .insert(entries, { onConflict: 'date' })
    .select();
  if (error) throw error;
  return data || [];
}

export async function getBookingAggregates() {
  const { data, error } = await supabase
    .from('seat_bookings')
    .select('id, date, user_email, status, seat:seat_id(id, label, floor:floor_id(*))')
    .eq('status', 'booked');
  if (error) throw error;
  return data || [];
}

export async function getBookingCountForDate(date) {
  if (!date) return 0;
  const { data, error } = await supabase
    .from('seat_bookings')
    .select('id, status')
    .eq('date', date)
    .or('status.is.null,status.eq.booked');
  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}
