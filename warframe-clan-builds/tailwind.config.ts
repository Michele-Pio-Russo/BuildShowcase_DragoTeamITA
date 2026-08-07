import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0b0f',
          900: '#0e1016',
          800: '#151824',
          700: '#1c2032',
          600: '#262b40',
        },
        accent: {
          500: '#6f5bff',
          400: '#8a78ff',
          300: '#b3a6ff',
        },
        gold: {
          500: '#c9a44c',
          400: '#dcbd6f',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};

export default config;
