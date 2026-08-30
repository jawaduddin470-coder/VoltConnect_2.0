/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A0F1D',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        teal: {
          500: '#0EA5E9',
          600: '#0284C7',
          50: '#F0F9FF',
        },
        volt: {
          500: '#10B981',
          600: '#059669',
          50: '#ECFDF5',
        },
        sky: {
          500: '#38BDF8',
          50: '#F0F9FF',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 32px rgba(15, 23, 42, 0.1), 0 4px 8px rgba(15, 23, 42, 0.04)',
        'glow-teal': '0 0 24px rgba(14, 165, 233, 0.25)',
        'glow-volt': '0 0 24px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
