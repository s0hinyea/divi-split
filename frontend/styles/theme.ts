/**
 * Divi Design System — Single source of truth for all design tokens.
 * Import from '@/styles/theme' in every screen and component.
 *
 * Usage:
 *   import { colors, fonts, spacing, radii, animation } from '@/styles/theme';
 */

// ─── Colors ────────────────────────────────────────────────
export const colors = {
    // Brand
    green: '#00C37F',           // vibrant mint-emerald (modern fintech)
    greenLight: '#E6FAF2',      // soft mint tint — backgrounds, highlights
    greenDark: '#00A36A',       // pressed/active state

    // Core
    black: '#0A0A0A',           // near-black (softer than pure black)
    white: '#FFFFFF',

    // Surfaces
    background: '#F6F5F2',      // warm off-white — screen backgrounds

    // Grays (warm-tinted)
    gray100: '#F6F5F2',
    gray200: '#ECEAE6',
    gray300: '#D8D5CF',
    gray400: '#A8A49C',
    gray500: '#737068',
    gray600: '#5A5750',
    gray800: '#1C1B18',

    // Semantic
    error: '#E53935',
    success: '#00C37F',
    warning: '#F59E0B',

    // Overlays
    overlay: 'rgba(10, 10, 10, 0.55)',
    overlayLight: 'rgba(10, 10, 10, 0.2)',
} as const;

// ─── Typography ────────────────────────────────────────────
export const fonts = {
    // Primary UI font (Inter - modern, clean, readable)
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',

    // Display/headers
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
    display: 52,
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
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
} as const;

// ─── Animation Timing ──────────────────────────────────────
export const animation = {
    fast: 100,
    normal: 150,
    slow: 250,
    splash: 600,
    orbit: 1800,
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const shadows = {
    sm: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    md: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
} as const;

// ─── Dark Mode Colors ──────────────────────────────────────
export const darkColors = {
    green: '#00C37F',
    black: '#F2F2F7',
    white: '#1C1C1E',

    gray100: '#000000',
    gray200: '#2C2C2E',
    gray300: '#3A3A3C',
    gray400: '#636366',
    gray500: '#8E8E93',
    gray600: '#AEAEB2',
    gray800: '#F2F2F7',

    error: '#FF453A',
    success: '#00C37F',
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
