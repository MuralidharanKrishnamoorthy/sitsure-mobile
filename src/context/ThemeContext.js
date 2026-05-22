import React, { createContext, useState, useCallback } from 'react';

export const ThemeContext = createContext({ darkMode: false, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = useCallback(() => setDarkMode((d) => !d), []);
  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
