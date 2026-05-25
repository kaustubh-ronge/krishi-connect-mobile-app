/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a', // Colors.light.primary
          dark: '#15803d',
          light: '#4ade80',
        },
        background: '#ffffff',
        card: '#f9fafb',
        text: '#1f2937',
        icon: '#6b7280',
        border: '#e5e7eb',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
}
