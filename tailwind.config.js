/** @type {import('tailwindcss').Config} */

const withOpacity =
  (variable) =>
  ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: withOpacity('--color-primary'),
        secondary: withOpacity('--color-secondary'),
        muted: withOpacity('--color-muted'),
        line: withOpacity('--color-border'),
        page: withOpacity('--color-page'),
        surface: withOpacity('--color-surface'),

        critical: {
          DEFAULT: withOpacity('--color-critical'),
          bg: withOpacity('--color-critical-bg'),
          border: withOpacity('--color-critical-border'),
        },
        high: {
          DEFAULT: withOpacity('--color-high'),
          bg: withOpacity('--color-high-bg'),
          border: withOpacity('--color-high-border'),
        },
        medium: {
          DEFAULT: withOpacity('--color-medium'),
          bg: withOpacity('--color-medium-bg'),
          border: withOpacity('--color-medium-border'),
        },
        low: {
          DEFAULT: withOpacity('--color-low'),
          bg: withOpacity('--color-low-bg'),
          border: withOpacity('--color-low-border'),
        },

        info: {
          DEFAULT: withOpacity('--color-info'),
          bg: withOpacity('--color-info-bg'),
          border: withOpacity('--color-info-border'),
        },
        resolved: {
          DEFAULT: withOpacity('--color-resolved'),
          bg: withOpacity('--color-resolved-bg'),
          border: withOpacity('--color-resolved-border'),
        },
      },

      fontFamily: {
        display: ['Gabarito', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        display: ['3rem', { lineHeight: '3.5rem' }],
        h1: ['1.75rem', { lineHeight: '2.125rem' }],
        h2: ['1.25rem', { lineHeight: '1.625rem' }],
        h3: ['1rem', { lineHeight: '1.375rem' }],
        body: ['0.875rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.125rem' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        shimmer: 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
