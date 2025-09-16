import type { Config } from 'tailwindcss';

// Constants for repeated strings
const LINE_HEIGHT_NORMAL = 'var(--line-height-normal)';
const LINE_HEIGHT_TIGHT = 'var(--line-height-tight)';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        surface: 'var(--card-bg)',
        'surface-border': 'var(--card-border)',
        primary: 'var(--color-primary-500)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
      },
      spacing: {
        '0': 'var(--space-0)',
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
      },
      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: LINE_HEIGHT_NORMAL }],
        sm: ['var(--font-size-sm)', { lineHeight: LINE_HEIGHT_NORMAL }],
        base: ['var(--font-size-md)', { lineHeight: LINE_HEIGHT_NORMAL }],
        lg: ['var(--font-size-lg)', { lineHeight: LINE_HEIGHT_TIGHT }],
        xl: ['var(--font-size-xl)', { lineHeight: LINE_HEIGHT_TIGHT }],
      },
      lineHeight: {
        tight: LINE_HEIGHT_TIGHT,
        normal: LINE_HEIGHT_NORMAL,
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
