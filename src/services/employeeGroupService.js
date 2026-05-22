import { supabase } from './supabase';

export async function getEmployeeGroups() {
  const { data, error } = await supabase
    .from('employee_groups')
    .select('*')
    .order('email', { ascending: true });
  if (error) throw error;
  const groups = data || [];

  const { data: bookingData, error: bookingError } = await supabase
    .from('seat_bookings')
    .select('user_email, status')
    .not('status', 'eq', 'cancelled');
  if (bookingError) throw bookingError;

  const counts = new Map();
  (bookingData || []).forEach((row) => {
    if (!row?.user_email) return;
    const key = row.user_email.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return groups.map((entry) => {
    const email = entry.email?.toLowerCase?.() || '';
    return { ...entry, email, bookingCount: counts.get(email) ?? 0 };
  });
}

export async function upsertEmployeeGroup({ email, groups = [] }) {
  if (!email) throw new Error('Email is required');
  const { error } = await supabase
    .from('employee_groups')
    .upsert({ email, groups }, { onConflict: 'email' });
  if (error) throw error;
}

export async function bulkUpsertEmployeeGroups(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const { error } = await supabase
    .from('employee_groups')
    .upsert(entries, { onConflict: 'email' });
  if (error) throw error;
  return entries;
}
