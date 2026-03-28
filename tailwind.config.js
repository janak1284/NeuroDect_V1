/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#fdfbf7', // Creamish White
          100: '#f9f6f0',
          200: '#f1e9db',
          300: '#e3d5c1',
          primary: '#0369a1', // Deep Professional Blue
          accent: '#0D9488', // Professional Teal
          warm: '#92400e', // Amber/Wood for warmth
          background: '#FDFBF7',
        }
      },
      animation: {
        'gradient-x': 'gradient-x 4s ease infinite',
        'reverse-spin': 'reverse-spin 2s linear infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'reverse-spin': {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        }
      },
      boxShadow: {
        'medical': '0 4px 20px -5px rgba(0, 0, 0, 0.05)',
        'medical-lg': '0 10px 30px -5px rgba(13, 148, 136, 0.05)',
        'medical-xl': '0 20px 50px -10px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
