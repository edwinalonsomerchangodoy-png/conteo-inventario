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
        display: ['"Archivo Expanded"', '"Archivo"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)', opacity: '0.9' },
          '50%': { opacity: '0.4' },
          '100%': { transform: 'translateY(2400%)', opacity: '0.9' },
        },
      },
      animation: {
        scan: 'scan 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
