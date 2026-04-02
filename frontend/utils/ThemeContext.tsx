import { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors, darkColors } from '@/styles/theme';

export type ColorTokens = typeof colors;

type ThemeCtxValue = { colors: ColorTokens; isDark: boolean };

const ThemeCtx = createContext<ThemeCtxValue>({ colors, isDark: false });

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const themeColors = (isDark ? darkColors : colors) as ColorTokens;
    return (
        <ThemeCtx.Provider value={{ colors: themeColors, isDark }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export function useThemeColors(): ColorTokens {
    return useContext(ThemeCtx).colors;
}

export function useIsDark(): boolean {
    return useContext(ThemeCtx).isDark;
}
