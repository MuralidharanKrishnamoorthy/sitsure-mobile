import { supabase } from './supabase';

export async function getFloors() {
  const { data, error } = await supabase.from('floors').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createFloor(name, description) {
  const { data, error } = await supabase.from('floors').insert([{ name, description }]).select();
  if (error) throw error;
  return data[0];
}

export async function updateFloor(id, name, description) {
  const { data, error } = await supabase
    .from('floors')
    .update({ name, description })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}
