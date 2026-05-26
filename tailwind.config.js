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
          50: 'var(--blue-50, #eff6ff)',
          100: 'var(--blue-100, #dbeafe)',
          200: 'var(--blue-200, #bfdbfe)',
          300: 'var(--blue-300, #93c5fd)',
          400: 'var(--blue-400, #60a5fa)',
          505: 'var(--blue-500, #3b82f6)', // Backwards-compat / standard blue
          500: 'var(--blue-500, #3b82f6)',
          600: 'var(--blue-600, #2563eb)',
          700: 'var(--blue-700, #1d4ed8)',
          800: 'var(--blue-800, #1e40af)',
          900: 'var(--blue-900, #1e3a8a)',
        }
      }
    },
  },
  plugins: [],
}

