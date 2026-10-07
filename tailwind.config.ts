import type { Config } from 'tailwindcss';

/**
 * Meridian design tokens.
 *
 * The palette is deliberately tiny: one paper family, one ink family, one muted
 * grey family, a single deep green accent and a soft ocean blue. Category
 * colours used by the planner's markers live here too, but they are always
 * paired with a shape and a glyph — colour is never the only signal.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F5F1',
        'paper-warm': '#F1EFE9',
        surface: '#FFFFFF',
        'surface-warm': '#FBFAF7',
        line: '#E7E4DD',
        'line-strong': '#D6D2C9',
        ink: '#16181B',
        'ink-soft': '#4B5054',
        muted: '#7B8186',
        faint: '#9AA0A4',
        accent: {
          DEFAULT: '#0E5E52',
          ink: '#0B4C43',
          soft: '#EAF1EF',
        },
        ocean: '#2A7C9E',
        // Marker categories (planner map only)
        marriott: '#1C3F5F',
        hilton: '#3A3F4D',
        ihg: '#8E1B33',
        hyatt: '#1B6E6A',
        gha: '#8A6D2F',
        activity: '#B06340',
        nature: '#47794F',
        beach: '#2F7590',
        food: '#8D5A35',
        nightlife: '#5F5486',
        transport: '#5C6470',
        danger: '#A8452F',
        warn: '#A5792C',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        card: '9px',
        panel: '12px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(22,24,27,0.04), 0 10px 30px -18px rgba(22,24,27,0.22)',
        float: '0 2px 6px rgba(22,24,27,0.06), 0 20px 44px -22px rgba(22,24,27,0.26)',
        marker: '0 1px 2px rgba(22,24,27,0.22)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
