// Design-Tokens: einzige Quelle für Farben, Schrift, Abstände, Radien, Ebenen und Bewegung.
// Werte und Begründungen: docs/plan/design-richtung.md. Kontraste prüft tokens.test.ts bei jedem Push.

export type ColorScheme = 'light' | 'dark';

/** Farbrollen. Screens verwenden nur diese Rollen, nie Einzelwerte. */
export interface ColorTokens {
  /** Bildschirmhintergrund */
  readonly background: string;
  /** Karten, Leisten, Tab-Leiste */
  readonly surface: string;
  /** Spuren (Fortschritt), gesperrte Elemente; im Dunkelmodus etwas heller als der Grund, damit sichtbar */
  readonly sunken: string;
  /** Trennlinien und Ränder ohne Bedeutung */
  readonly border: string;
  /** Ränder, die ein Bedienelement erkennbar machen (mindestens 3 : 1) */
  readonly borderStrong: string;
  readonly text: string;
  readonly textMuted: string;
  /** Hauptknopf, aktive Note, Fortschritt */
  readonly primary: string;
  readonly onPrimary: string;
  /** Links und Zweitknöpfe */
  readonly primaryText: string;
  /** Ausgewählte Antwort, Chips */
  readonly primarySoft: string;
  /** Serie, XP, Belohnung: nur als Fläche oder Symbol */
  readonly accent: string;
  readonly onAccent: string;
  readonly accentText: string;
  readonly success: string;
  readonly onSuccess: string;
  readonly successSoft: string;
  readonly danger: string;
  readonly onDanger: string;
  readonly dangerSoft: string;
}

export type ColorRole = keyof ColorTokens;

export const COLORS: Readonly<Record<ColorScheme, ColorTokens>> = {
  light: {
    background: '#F6F5FB',
    surface: '#FFFFFF',
    sunken: '#EDEBF5',
    border: '#E1DEEC',
    borderStrong: '#8A86A0',
    text: '#1A1830',
    textMuted: '#5C5873',
    primary: '#5B3FD9',
    onPrimary: '#FFFFFF',
    primaryText: '#5136CC',
    primarySoft: '#ECE8FF',
    accent: '#F5A524',
    onAccent: '#1A1830',
    accentText: '#8F5300',
    success: '#0B7768',
    onSuccess: '#FFFFFF',
    successSoft: '#E1F3EF',
    danger: '#C43A1E',
    onDanger: '#FFFFFF',
    dangerSoft: '#FCEAE5',
  },
  dark: {
    background: '#0F0E17',
    surface: '#1A1926',
    sunken: '#252336',
    border: '#2C2A3C',
    borderStrong: '#77738F',
    text: '#F3F2FA',
    textMuted: '#A9A5BF',
    primary: '#8E7BFF',
    onPrimary: '#0F0E17',
    primaryText: '#A797FF',
    primarySoft: '#2A2550',
    accent: '#FFC14D',
    onAccent: '#0F0E17',
    accentText: '#FFC967',
    success: '#34D1AE',
    onSuccess: '#0F0E17',
    successSoft: '#0F2F29',
    danger: '#FF6B57',
    onDanger: '#0F0E17',
    dangerSoft: '#3A1C16',
  },
};

/** Abdunkelung hinter Blättern von unten (keine Kontrastrolle). */
export const SCRIM: Readonly<Record<ColorScheme, string>> = {
  light: 'rgba(26, 24, 48, 0.32)',
  dark: 'rgba(0, 0, 0, 0.5)',
};

/** Hervorhebung im Notenbild (richtig, falsch, aktiv) aus den Farbrollen. */
export function highlightColors(scheme: ColorScheme): {
  readonly correct: string;
  readonly wrong: string;
  readonly active: string;
} {
  const c = COLORS[scheme];
  return { correct: c.success, wrong: c.danger, active: c.primary };
}

/**
 * Farbpaare, die vorkommen dürfen, mit Mindestkontrast nach WCAG 2.2: 4,5 : 1 für Text, 3 : 1 für
 * Bedienelemente und Symbole mit Bedeutung. Neue Kombinationen hier eintragen, dann prüft sie der Test.
 */
export const CONTRAST_PAIRS: readonly {
  readonly fg: ColorRole;
  readonly bg: ColorRole;
  readonly min: 3 | 4.5;
}[] = [
  { fg: 'text', bg: 'background', min: 4.5 },
  { fg: 'text', bg: 'surface', min: 4.5 },
  { fg: 'text', bg: 'sunken', min: 4.5 },
  { fg: 'text', bg: 'primarySoft', min: 4.5 },
  { fg: 'text', bg: 'successSoft', min: 4.5 },
  { fg: 'text', bg: 'dangerSoft', min: 4.5 },
  { fg: 'textMuted', bg: 'background', min: 4.5 },
  { fg: 'textMuted', bg: 'surface', min: 4.5 },
  { fg: 'textMuted', bg: 'sunken', min: 4.5 },
  { fg: 'primaryText', bg: 'background', min: 4.5 },
  { fg: 'primaryText', bg: 'surface', min: 4.5 },
  { fg: 'primaryText', bg: 'primarySoft', min: 4.5 },
  { fg: 'onPrimary', bg: 'primary', min: 4.5 },
  { fg: 'primary', bg: 'background', min: 3 },
  { fg: 'primary', bg: 'surface', min: 3 },
  // Fortschritt: Füllung auf der Spur
  { fg: 'primary', bg: 'sunken', min: 3 },
  { fg: 'onAccent', bg: 'accent', min: 4.5 },
  { fg: 'accentText', bg: 'background', min: 4.5 },
  { fg: 'accentText', bg: 'surface', min: 4.5 },
  { fg: 'success', bg: 'background', min: 4.5 },
  { fg: 'success', bg: 'surface', min: 4.5 },
  { fg: 'success', bg: 'successSoft', min: 4.5 },
  { fg: 'onSuccess', bg: 'success', min: 4.5 },
  { fg: 'danger', bg: 'background', min: 4.5 },
  { fg: 'danger', bg: 'surface', min: 4.5 },
  { fg: 'danger', bg: 'dangerSoft', min: 4.5 },
  { fg: 'onDanger', bg: 'danger', min: 4.5 },
  { fg: 'borderStrong', bg: 'background', min: 3 },
  { fg: 'borderStrong', bg: 'surface', min: 3 },
];

// ---------------------------------------------------------------------------
// Schrift

/** Registrierte Namen der Figtree-Schnitte (die App lädt sie unter diesen Namen). */
export const FONT_FAMILIES = {
  regular: 'Figtree-Regular',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
  extrabold: 'Figtree-ExtraBold',
} as const;

export type FontFamily = (typeof FONT_FAMILIES)[keyof typeof FONT_FAMILIES];

/**
 * Vorzeichen im Fließtext (♭ ♮ ♯ Doppelkreuz): Teilmenge von Bravura Text unter eigenem Namen
 * (SIL OFL 1.1, „Bravura“ ist reserviert). Erzeugt mit tools/make-accidental-font.py.
 */
export const ACCIDENTAL_FONT = 'HarmoniaAccidentals';

export type TextVariant =
  'display' | 'title1' | 'title2' | 'title3' | 'body' | 'small' | 'footnote' | 'overline';

export interface TextStyleToken {
  readonly fontFamily: FontFamily;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: 'uppercase';
}

/** Schriftgrößen in pt; Laufweite in pt (aus em umgerechnet). */
export const TYPOGRAPHY: Readonly<Record<TextVariant, TextStyleToken>> = {
  display: {
    fontFamily: FONT_FAMILIES.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.68,
  },
  title1: {
    fontFamily: FONT_FAMILIES.extrabold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
  title2: { fontFamily: FONT_FAMILIES.bold, fontSize: 22, lineHeight: 28 },
  title3: { fontFamily: FONT_FAMILIES.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: FONT_FAMILIES.regular, fontSize: 17, lineHeight: 24 },
  small: { fontFamily: FONT_FAMILIES.semibold, fontSize: 15, lineHeight: 20 },
  footnote: { fontFamily: FONT_FAMILIES.regular, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
};

/** Überschriften bekommen für den Screenreader die Rolle „heading“. */
export const HEADING_VARIANTS: readonly TextVariant[] = ['display', 'title1', 'title2', 'title3'];

// ---------------------------------------------------------------------------
// Formen, Abstände, Ebenen

/** Raster von 4 pt */
export const SPACE = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Bildschirmrand und größte Inhaltsbreite (Tablet, Web) */
export const LAYOUT = { screenPadding: 20, maxContentWidth: 560 } as const;

export const RADIUS = {
  /** Markierungen */
  mark: 8,
  /** Eingaben */
  input: 12,
  /** Knöpfe, Antworten */
  control: 16,
  /** Karten */
  card: 20,
  /** Blätter von unten */
  sheet: 28,
  /** Chips, Knoten, Schalter */
  full: 999,
} as const;

/** Mindestgröße für Touch-Ziele und Höhe der Knöpfe */
export const TOUCH = { min: 48, buttonLarge: 56, buttonMedium: 48 } as const;

/** Weiche, violett getönte Schatten im Hellmodus (CSS-Syntax); im Dunkelmodus Tiefe durch hellere Flächen. */
export const ELEVATION: Readonly<
  Record<ColorScheme, { readonly card: string | undefined; readonly button: string | undefined }>
> = {
  light: {
    card: '0px 1px 2px rgba(26, 24, 48, 0.06), 0px 6px 20px rgba(60, 40, 160, 0.08)',
    button: '0px 4px 14px rgba(91, 63, 217, 0.3)',
  },
  dark: { card: undefined, button: undefined },
};

// ---------------------------------------------------------------------------
// Bewegung

/** Dauer in ms */
export const DURATION = {
  tap: 100,
  state: 200,
  fade: 280,
  celebrate: 900,
  /** Höchstdauer, wenn „Bewegung reduzieren“ gilt (nur Überblenden) */
  reduced: 150,
} as const;

/** Federn (Masse 1) */
export const SPRING = {
  /** allgemein */
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  /** Feedback, Fortschritt */
  bouncy: { damping: 12, stiffness: 220, mass: 1 },
  /** Antippen, Ziehen */
  firm: { damping: 28, stiffness: 420, mass: 1 },
} as const;

/** Bézier-Kurven (x1, y1, x2, y2) */
export const EASING = {
  enter: [0.22, 1, 0.36, 1],
  exit: [0.55, 0, 1, 0.45],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const MOTION = {
  /** Knopf beim Antippen */
  pressScale: 0.96,
  /** Strecke beim Wechsel zur nächsten Aufgabe (pt) */
  slideDistance: 28,
  /** Atmen des aktuellen Lernpfad-Knotens (ms, ganzer Zyklus) */
  breathePeriod: 2400,
} as const;
