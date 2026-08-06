/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#122019',
          soft: '#1B2E24',
          line: '#28402F',
        },
        paper: '#F6F5F1',
        brand: {
          DEFAULT: '#00953E',
          dark: '#00722F',
          light: '#E7F6EC',
        },
        teal: {
          DEFAULT: '#00947A',
        },
        signal: {
          DEFAULT: '#D9A544',
          dim: '#B9862E',
        },
        ok: '#2E7D5B',
        warn: '#C1873A',
        bad: '#C1443A',
        slate: {
          soft: '#6B7280',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [],
}
