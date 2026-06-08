/**
 * ThemeContext.js — Light/dark theme system for Squadify
 *
 * React Context is used here so that any component anywhere in the app
 * can call useTheme() to get the current colour values — without having
 * to pass colours down through props at every level.
 *
 * The theme automatically switches between light and dark based on the
 * device's system setting (useColorScheme from React Native).
 *
 * Usage in any screen or component:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.bg }}>
 */

import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

// Brand colours — used in both themes
const NAVY = '#1a1a2e';  // Top bar background
const TEAL = '#1a9e75';  // Active tab, checkboxes, primary action colour

// Light mode colour palette
const lightTheme = {
  dark: false,
  navy: NAVY,
  teal: TEAL,
  bg: '#ffffff',                        // Main screen background
  bgSecondary: '#f5f5f5',               // Stat cards, input backgrounds
  bgTertiary: '#ebebeb',                // Code blocks, deeply nested surfaces
  text: '#111111',                      // Primary text
  textSecondary: '#666666',             // Labels, subtitles, muted text
  textTertiary: '#999999',              // Placeholder text
  border: 'rgba(0,0,0,0.12)',           // Default card/row borders
  borderMed: 'rgba(0,0,0,0.22)',        // Stronger borders (inputs, checkboxes)
  positive: '#0F6E56',                  // Positive balance value
  negative: '#A32D2D',                  // Negative balance value and name
  negBg: '#FCEBEB',                     // Absent pill background
  negText: '#791F1F',                   // Absent pill text
  posBg: '#E1F5EE',                     // Present pill / Saved badge background
  posText: '#085041',                   // Present pill / Saved badge text
  cardBg: '#ffffff',                    // Raised card background
  inputBg: '#f0f0f0',                   // Text input background
  separator: 'rgba(0,0,0,0.1)',         // Section dividers in settings
};

// Dark mode colour palette — same structure, darker values
const darkTheme = {
  dark: true,
  navy: NAVY,
  teal: TEAL,
  bg: '#111111',
  bgSecondary: '#1c1c1e',
  bgTertiary: '#2c2c2e',
  text: '#f2f2f7',
  textSecondary: '#8e8e93',
  textTertiary: '#636366',
  border: 'rgba(255,255,255,0.1)',
  borderMed: 'rgba(255,255,255,0.2)',
  positive: '#34c88a',
  negative: '#ff6b6b',
  negBg: '#2d1515',
  negText: '#ff8080',
  posBg: '#0d2b20',
  posText: '#34c88a',
  cardBg: '#1c1c1e',
  inputBg: '#2c2c2e',
  separator: 'rgba(255,255,255,0.08)',
};

// Create the context with light theme as the default value
const ThemeContext = createContext(lightTheme);

/**
 * ThemeProvider — wraps the entire app in App.js.
 * Detects the device colour scheme and provides the correct theme
 * to all child components via Context.
 */
export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — custom hook to access the current theme in any component.
 *
 * @returns {Object} The active theme object with all colour values
 *
 * @example
 * const theme = useTheme();
 * <Text style={{ color: theme.text }}>Hello</Text>
 */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Avatar colour palette — 6 colour pairs for member avatar circles.
 * Each pair has a light background and a dark text colour.
 * Assigned by member ID modulo 6 so the same member always gets the same colour.
 */
export const AVATAR_PALETTE = [
  { bg: '#E6F1FB', text: '#0C447C' }, // Blue
  { bg: '#E1F5EE', text: '#085041' }, // Teal
  { bg: '#EEEDFE', text: '#3C3489' }, // Purple
  { bg: '#FAECE7', text: '#712B13' }, // Coral
  { bg: '#EAF3DE', text: '#27500A' }, // Green
  { bg: '#FAEEDA', text: '#633806' }, // Amber
];

/**
 * Returns the avatar background and text colour for a given member ID.
 * Cycles through the 6-colour palette using modulo arithmetic.
 *
 * @param {number} id - Member's database ID
 * @returns {{ bg: string, text: string }}
 */
export function avatarColors(id) {
  return AVATAR_PALETTE[(id || 0) % AVATAR_PALETTE.length];
}
