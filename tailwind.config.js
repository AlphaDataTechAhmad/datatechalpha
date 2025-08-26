/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7ff',
          100: '#b3e7ff',
          200: '#80d5ff',
          300: '#4dc3ff',
          400: '#26b5ff',
          500: '#00a6ff',
          600: '#0090e0',
          700: '#0073b3',
          800: '#005988',
          900: '#003d5c',
        },
        secondary: {
          50: '#f3e8ff',
          100: '#e5c7ff',
          200: '#d5a3ff',
          300: '#c47eff',
          400: '#b359ff',
          500: '#9d4edd',
          600: '#8c35c8',
          700: '#7429a8',
          800: '#5b1d87',
          900: '#3d1257',
        },
        accent: {
          50: '#eefbfa',
          100: '#d0f5f2',
          200: '#a8ede8',
          300: '#73e0d8',
          400: '#39cdc2',
          500: '#14b8a6',
          600: '#0e8f85',
          700: '#0f726b',
          800: '#115c57',
          900: '#124b47',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
        dark: {
          100: '#d1d5db',
          200: '#9ca3af',
          300: '#6b7280',
          400: '#4b5563',
          500: '#374151',
          600: '#1f2937',
          700: '#111827',
          800: '#0d1117',
          900: '#030712',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(0, 180, 216, 0.5), 0 0 10px rgba(0, 180, 216, 0.3)' 
          },
          '100%': { 
            boxShadow: '0 0 10px rgba(0, 180, 216, 0.8), 0 0 20px rgba(0, 180, 216, 0.5), 0 0 30px rgba(0, 180, 216, 0.3)' 
          },
        },
      },
      boxShadow: {
        'neon': '0 0 5px rgba(0, 180, 216, 0.5), 0 0 10px rgba(0, 180, 216, 0.3)',
        'neon-lg': '0 0 10px rgba(0, 180, 216, 0.8), 0 0 20px rgba(0, 180, 216, 0.5), 0 0 30px rgba(0, 180, 216, 0.3)',
        'neon-purple': '0 0 5px rgba(157, 78, 221, 0.5), 0 0 10px rgba(157, 78, 221, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
      },
      backdropFilter: {
        'glass': 'blur(4px)',
      },
    },
  },
  plugins: [],
};