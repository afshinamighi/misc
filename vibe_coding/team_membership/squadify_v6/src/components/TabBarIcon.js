import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function SquadIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="8" r="4" stroke={color} strokeWidth="1.5" />
      <Path d="M3 20c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function SessionsIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x="2" y="2" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
      <Rect x="12" y="2" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
      <Rect x="2" y="12" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
      <Rect x="12" y="12" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function BalanceIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M2 20h18M5 20V13m6 7V8m6 12V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.5" />
      <Path d="M11 7v4.5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
