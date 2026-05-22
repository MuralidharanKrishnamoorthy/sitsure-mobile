import { supabase } from './supabase';

export async function getFloors() {
  const { data, error } = await supabase.from('floors').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getSeatsByFloor(floorId) {
  const { data, error } = await supabase
    .from('seats')
    .select('*, floors(name)')
    .order('id', { ascending: true })
    .eq('floor_id', floorId);
  if (error) throw error;
  return data || [];
}

export async function addSeat(label, floorId, userId, hasMonitor = false) {
  const payload = { label, enabled: true, floor_id: floorId, user_email: userId, has_monitor: hasMonitor };
  const { data, error } = await supabase.from('seats').insert([payload]).select();
  if (error) throw error;
  return data[0];
}

export async function deleteSeat(id) {
  const { error } = await supabase.from('seats').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleSeat(id, enabled) {
  const { error } = await supabase.from('seats').update({ enabled: !enabled }).eq('id', id);
  if (error) throw error;
}

export async function updateSeatMonitor(id, hasMonitor) {
  const { error } = await supabase.from('seats').update({ has_monitor: hasMonitor }).eq('id', id);
  if (error) throw error;
}
