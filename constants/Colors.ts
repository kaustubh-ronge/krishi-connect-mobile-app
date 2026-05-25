const tintColorLight = '#16a34a'; // Tailwind green-600
const tintColorDark = '#22c55e'; // Tailwind green-500

export const Colors = {
  light: {
    text: '#1f2937', // gray-800
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#6b7280', // gray-500
    tabIconDefault: '#9ca3af', // gray-400
    tabIconSelected: tintColorLight,
    primary: '#16a34a',
    primaryDark: '#15803d',
    secondary: '#fef08a', // yellow-200
    border: '#e5e7eb', // gray-200
    card: '#f9fafb', // gray-50
    error: '#ef4444', // red-500
    success: '#22c55e', // green-500
    warning: '#f59e0b', // amber-500
  },
  dark: {
    text: '#f9fafb',
    background: '#111827', // gray-900
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#4b5563', // gray-600
    tabIconSelected: tintColorDark,
    primary: '#22c55e',
    primaryDark: '#16a34a',
    secondary: '#a16207', // yellow-700
    border: '#374151', // gray-700
    card: '#1f2937', // gray-800
    error: '#f87171', // red-400
    success: '#4ade80', // green-400
    warning: '#fbbf24', // amber-400
  },
};
