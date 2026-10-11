/**
 * Jetons de design EducationPlus — valeurs reprises des maquettes (design/*.dc.html).
 * Utilisés par l'app mobile (Expo) et l'app web (Next.js).
 */
export const colors = {
  bg: "#F3F5F2",
  surface: "#FFFFFF",
  ink: "#0F1F19",
  muted: "#4A5B54",
  line: "#DDE3DF",
  fieldBorder: "#C9D3CE",
  primary: "#0B5D45",
  primaryDark: "#07402F",
  primarySoft: "#E3EFEA",
  accentMint: "#7FE0B4",
  onPrimarySoft: "#CFE6DC",
  warning: "#F2B544",
  warningText: "#6B4210",
  warningSoft: "#FCEFD9",
  danger: "#A3322A",
  dangerText: "#7A221C",
  dangerSoft: "#F8E4E1",
  info: "#1D3A5C",
  infoSoft: "#DCE6F2",
  neutralSoft: "#EEF2EF",
} as const;

export const fonts = {
  display: "BricolageGrotesque_700Bold",
  body: "Figtree_400Regular",
  bodyMedium: "Figtree_500Medium",
  bodySemiBold: "Figtree_600SemiBold",
  bodyBold: "Figtree_700Bold",
  /** Familles CSS pour le web (chargées via @fontsource). */
  webDisplay: "'Bricolage Grotesque', system-ui, sans-serif",
  webBody: "'Figtree', system-ui, sans-serif",
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  lead: 17,
  title: 22,
  hero: 28,
} as const;

export const radius = {
  chip: 10,
  button: 14,
  card: 18,
  hero: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Taille minimale d'une zone tactile (px / dp). */
export const minTouch = 44;

export type ColorToken = keyof typeof colors;
