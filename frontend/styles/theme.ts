/**
 * Divi Design System — Single source of truth for all design tokens.
 * Import from '@/styles/theme' in every screen and component.
 *
 * Usage:
 *   import { colors, fonts, spacing, radii, animation } from '@/styles/theme';
 */

// ─── Colors ────────────────────────────────────────────────
export const colors = {
    // Primary
    green: '#228B22',
    black: '#000000',
    white: '#FFFFFF',

    // Neutrals
    gray100: '#F5F5F5',   // backgrounds, cards
    gray200: '#E5E5E5',   // borders, dividers
    gray300: '#D4D4D4',   // disabled states, subtle borders
    gray400: '#A0A0A0',   // placeholder text
    gray500: '#737373',   // secondary text (darker)
    gray600: '#6B6B6B',   // secondary text
    gray800: '#2A2A2A',   // near-black text

    // Semantic
    error: '#DC3545',
    success: '#228B22',    // same as green (brand-aligned)
    warning: '#F0AD4E',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',       // modal/blur backdrop
    overlayLight: 'rgba(0, 0, 0, 0.2)',   // subtle overlays
} as const;

// ─── Typography ────────────────────────────────────────────
export const fonts = {
    // Primary UI font (Inter - modern, clean, readable)
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',

    // Display/headers (use Inter Bold for consistency)
    display: 'Inter-Bold',

    // Legacy fallbacks (keep for gradual migration)
    sans: 'WorkSans',
    sansRegular: 'WorkSans-Regular',
    sansMedium: 'WorkSans-Medium',
    sansSemiBold: 'WorkSans-SemiBold',
    sansBold: 'WorkSans-Bold',

    // Monospace (for numbers/amounts)
    mono: 'SpaceMono',
} as const;

export const fontSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    display: 48,
} as const;

// ─── Spacing (8pt grid) ────────────────────────────────────
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
} as const;

// ─── Border Radius ─────────────────────────────────────────
export const radii = {
    sm: 6,
    md: 12,    // default — use this everywhere
    lg: 16,
    xl: 24,
    full: 9999, // pills, circles
} as const;

// ─── Animation Timing ──────────────────────────────────────
export const animation = {
    fast: 100,       // micro-interactions (haptic feedback, press states)
    normal: 150,     // standard transitions (buttons, color changes)
    slow: 250,       // page transitions, modals
    splash: 600,     // splash fade-out
    orbit: 1800,     // splash logo orbit duration
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const shadows = {
    sm: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

// ─── Dark Mode Colors ──────────────────────────────────────
export const darkColors = {
    green: '#34C759',        // iOS system green (pops on dark bg)
    black: '#F2F2F7',        // primary text on dark
    white: '#1C1C1E',        // card / surface backgrounds

    gray100: '#000000',      // app background (OLED-friendly true black)
    gray200: '#2C2C2E',      // borders, dividers
    gray300: '#3A3A3C',      // disabled states
    gray400: '#636366',      // placeholder text
    gray500: '#8E8E93',      // secondary text
    gray600: '#AEAEB2',      // tertiary text
    gray800: '#F2F2F7',      // near-white primary text

    error: '#FF453A',        // iOS dark-mode red
    success: '#34C759',
    warning: '#FFD60A',

    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

// ─── Hit Slop (minimum 44px tap targets) ───────────────────
export const hitSlop = {
    standard: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

// ─── Empty States ──────────────────────────────────────────
export const emptyStates = {
    receipts: {
        title: 'No receipts yet',
        subtitle: 'Tap + to scan your first one!',
    },
    contacts: {
        title: 'No contacts selected',
        subtitle: 'Add people to split with.',
    },
} as const;
