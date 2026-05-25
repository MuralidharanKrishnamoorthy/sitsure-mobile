import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';

export const ThemeContext = createContext({ darkMode: false, toggleTheme: () => {}, t: {} });

// ── Theme token sets ──────────────────────────────────────────────────────────
const light = {
  dark: false,
  bg: COLORS.bgLight,           // screen background
  card: '#ffffff',              // card / paper surface
  cardBorder: '#f0f0f0',
  text: COLORS.textPrimaryLight,
  textSub: COLORS.textSecondaryLight,
  tabBar: '#ffffff',
  tabBarBorder: '#f0f0f0',
  tabInactive: '#b0b0b0',
  drawerBg: '#ffffff',
  drawerActiveText: COLORS.primary,
  drawerActiveBg: '#fff6f0',
  inputBg: '#ffffff',
  inputBorder: '#e0e0e0',
  divider: '#f0f0f0',
  shimmer: '#f5f5f5',
};

const dark = {
  dark: true,
  bg: '#0f1117',
  card: '#1a1d27',
  cardBorder: '#2a2d3a',
  text: '#f0f0f0',
  textSub: '#9096a8',
  tabBar: '#13161f',
  tabBarBorder: '#1f2230',
  tabInactive: '#555b6e',
  drawerBg: '#13161f',
  drawerActiveText: COLORS.primary,
  drawerActiveBg: 'rgba(254,116,42,0.12)',
  inputBg: '#1a1d27',
  inputBorder: '#2a2d3a',
  divider: '#1f2230',
  shimmer: '#1f2230',
};

export const THEME = { light, dark };

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('sitsure_dark_mode')
      .then(v => { if (v === 'true') setDarkMode(true); })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      AsyncStorage.setItem('sitsure_dark_mode', String(next));
      return next;
    });
  }, []);

  const t = darkMode ? dark : light;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
