/**
 * Dharma Customer Design System Tokens
 * Source: docs/ux/design-system.md and AGENTS.md
 */

export const colors = {
  primary: "#7A1F3D",
  primaryHover: "#661932",
  primaryActive: "#541328",
  primaryLight: "#FBF2F4",
  saffron: "#F59E0B",
  saffronLight: "#FEF3C7",
  saffronDark: "#D97706",
  warmCream: "#FFF9F0",
  warmCreamLight: "#FFFCF7",
  warmCreamDark: "#F7EFE4",
  green: "#3F8F4F",
  greenLight: "#EBF5EE",
  text: "#292524",
  textMuted: "#78716C",
  textSubtle: "#A8A29E",
  border: "#E7DED2",
  borderHover: "#D6C7B7",
  borderFocus: "#7A1F3D",
  borderError: "#DC2626",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  white: "#FFFFFF",
  cardBackground: "#FFFFFF",
  transparent: "transparent",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#292524",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#292524",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#7A1F3D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
