import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { supabase } from './supabase';

export async function getEmployeeDetails(email) {
  const q = query(collection(db, 'employeelists'), where('email', '==', email));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data();
  return null;
}

export async function getEmployeeRole(email) {
  const q = query(collection(db, 'userroles'), where('email', '==', email));
  const snap = await getDocs(q);
  let roles = null;
  snap.forEach((doc) => { roles = doc.data().role; });
  return roles;
}

export async function getEmployeeGroup(email) {
  const { data, error } = await supabase
    .from('employee_groups')
    .select('groups')
    .eq('email', email)
    .single();
  if (error) return ['Venzo'];
  return data?.groups || ['Venzo'];
}

export function isAdminRole(roles) {
  if (!roles) return false;
  const adminRoles = ['superadmin', 'sysadmin', 'hradmin'];
  if (Array.isArray(roles)) return roles.some((r) => adminRoles.includes(r));
  return adminRoles.includes(roles);
}
