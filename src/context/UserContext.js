import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getEmployeeDetails, getEmployeeRole, getEmployeeGroup, isAdminRole } from '../services/employeeService';
import { fetchMyPhoto, clearProfileCache } from '../services/graphService';
import { loadStoredTokens, clearStoredTokens, parseIdToken, validateDomain, getValidAccessToken } from '../services/authService';

export const UserContext = createContext({
  user: null,
  employee: null,
  loading: true,
  accessToken: null,
  isAdmin: false,
  logout: () => {},
  setAuthData: () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const buildEmployee = useCallback(async (email, name, token) => {
    if (!validateDomain(email)) {
      throw new Error('Only @venzotechnologies.com accounts are allowed.');
    }

    const [details, roles, groups, photoUrl] = await Promise.all([
      getEmployeeDetails(email),
      getEmployeeRole(email),
      getEmployeeGroup(email),
      fetchMyPhoto(token),
    ]);

    return {
      name: name || details?.name || email,
      email,
      empid: details?.empid || details?.employeeId || null,
      roles,
      groups: groups || ['Venzo'],
      profilePic: photoUrl || null,
      isAdmin: isAdminRole(roles),
    };
  }, []);

  const setAuthData = useCallback(async (tokens) => {
    const { accessToken: token, idToken, account } = tokens;
    const parsed = parseIdToken(idToken);
    const email = parsed?.preferred_username || parsed?.upn || account?.email || '';
    const name = parsed?.name || account?.name || '';

    setAccessToken(token);
    setUser({ email, name });

    const emp = await buildEmployee(email, name, token);
    setEmployee(emp);
    setIsAdmin(emp.isAdmin);
  }, [buildEmployee]);

  const logout = useCallback(async () => {
    await clearStoredTokens();
    clearProfileCache();
    setUser(null);
    setEmployee(null);
    setAccessToken(null);
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    let active = true;
    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 5000);

    async function restoreSession() {
      setLoading(true);
      try {
        const stored = await loadStoredTokens();
        if (stored.accessToken && stored.idToken && active) {
          const validToken = await getValidAccessToken(stored);
          await setAuthData({ ...stored, accessToken: validToken });
        }
      } catch (err) {
        try { await clearStoredTokens(); } catch (_) {}
      } finally {
        clearTimeout(safetyTimer);
        if (active) setLoading(false);
      }
    }
    restoreSession();
    return () => { active = false; clearTimeout(safetyTimer); };
  }, [setAuthData]);

  return (
    <UserContext.Provider value={{ user, employee, loading, accessToken, isAdmin, logout, setAuthData }}>
      {children}
    </UserContext.Provider>
  );
}
