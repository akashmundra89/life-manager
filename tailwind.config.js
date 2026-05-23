/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#b8ccff',
          300: '#8aa9ff',
          400: '#6b8bff',
          500: '#3b6dff',
          600: '#2a55d8',
          700: '#1e3fb8',
          800: '#172d80',
          900: '#0f1e54',
        },
        violet: {
          400: '#b08bff',
          500: '#9b6bff',
          600: '#7c3aed',
        },
        // Semantic surfaces driven by CSS variables (light/dark switch)
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-strong': 'rgb(var(--surface-strong) / <alpha-value>)',
        'surface-soft': 'rgb(var(--surface-soft) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        'ink-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--text-faint) / <alpha-value>)',
        edge: 'rgb(var(--border) / <alpha-value>)',
        'edge-strong': 'rgb(var(--border-strong) / <alpha-value>)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '28px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 18px 40px -16px rgb(15 23 42 / 0.18), 0 2px 6px rgb(15 23 42 / 0.06)',
        'glass-soft': '0 8px 20px -10px rgb(15 23 42 / 0.12)',
        'glow-brand': '0 6px 24px -6px rgb(59 109 255 / 0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(.2,.8,.2,1) both',
        'fade-in': 'fade-in 0.35s ease both',
        'pop-in': 'pop-in 0.25s cubic-bezier(.2,.8,.2,1) both',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};
