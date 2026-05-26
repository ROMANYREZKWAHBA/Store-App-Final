/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1d4ed8', // Vibrant royal/electric blue
          600: '#1e40af', // Deep royal/navy blue
          700: '#1e3a8a', // High-contrast dark blue
          800: '#172554',
          900: '#1e1b4b',
        }
      }
    },
  },
  plugins: [],
}

