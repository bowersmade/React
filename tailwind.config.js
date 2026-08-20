/** @type {import('tailwindcss').Config} */

const withOpacity =
  (variable) =>
  ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: withOpacity('--color-page'),

        // Text
        primary: withOpacity('--color-text-primary'),
        secondary: withOpacity('--color-text-secondary'),
        muted: withOpacity('--color-text-muted'),
        disabled: withOpacity('--color-text-disabled'),

        // Glass surfaces
        surface: 'rgb(255 255 255 / 0.08)',
        'surface-2': 'rgb(255 255 255 / 0.14)',
        line: 'rgb(255 255 255 / 0.10)',

        // Severity — solid plus 14% tint for badge backgrounds
        critical: {
          DEFAULT: withOpacity('--color-critical'),
          tint: 'rgb(220 38 38 / 0.14)',
        },
        high: {
          DEFAULT: withOpacity('--color-high'),
          tint: 'rgb(249 115 22 / 0.14)',
        },
        medium: {
          DEFAULT: withOpacity('--color-medium'),
          tint: 'rgb(217 119 6 / 0.14)',
        },
        low: {
          DEFAULT: withOpacity('--color-low'),
          tint: 'rgb(79 70 229 / 0.14)',
        },

        // Semantic & accents
        info: {
          DEFAULT: withOpacity('--color-info'),
          tint: 'rgb(99 102 241 / 0.25)',
        },
        resolved: withOpacity('--color-resolved'),
        accent: withOpacity('--color-accent'),
        teal: withOpacity('--color-teal'),
      },

      fontFamily: {
        display: ['Gabarito', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        display: ['3rem', { lineHeight: '3.5rem' }], // 48 / 56
        h1: ['1.75rem', { lineHeight: '2.125rem' }], // 28 / 34
        h2: ['1.25rem', { lineHeight: '1.625rem' }], // 20 / 26
        h3: ['1rem', { lineHeight: '1.375rem' }], // 16 / 22
        body: ['0.875rem', { lineHeight: '1.25rem' }], // 14 / 20
        'body-sm': ['0.8125rem', { lineHeight: '1.125rem' }], // 13 / 18
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.5px' }], // 12 / 16
        mono: ['0.875rem', { lineHeight: '1.125rem' }], // 14 / 18
        'mono-sm': ['0.8125rem', { lineHeight: '1rem' }], // 13 / 16
      },

      borderRadius: {
        xs: '4px', // checkboxes
        sm: '6px', // chips, badges
        md: '12px', // buttons, inputs
        lg: '16px', // charts, inner panels
        xl: '20px',
        '2xl': '24px', // cards, modals
        pill: '99px', // pills, search
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
