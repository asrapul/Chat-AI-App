import { Colors } from '@/constants/Colors';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(deviceColorScheme || 'light');

  useEffect(() => {
    if (deviceColorScheme) {
      setColorScheme(deviceColorScheme);
    }
  }, [deviceColorScheme]);

  const toggleTheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
