/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#060810',
          2: '#0c0e18',
          3: '#10131f',
        },
        surface: {
          DEFAULT: '#0f1120',
          2: '#161929',
          3: '#1c2035',
        },
        border: {
          DEFAULT: '#1e2236',
          2: '#252a42',
          3: '#2e3454',
        },
        accent: {
          DEFAULT: '#3b82f6',
          bright: '#60a5fa',
          dim:    '#1d4ed8',
        },
        teal: { DEFAULT: '#2dd4bf' },
        muted: { DEFAULT: '#8892b0', 2: '#4a5280' },
      },
      animation: {
        'fade-up':  'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':  'fadeIn 0.3s ease both',
        'pop':      'pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        fadeUp: { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn: { from: { opacity:'0' }, to: { opacity:'1' } },
        pop:    { from: { opacity:'0', transform:'scale(0.9)' }, to: { opacity:'1', transform:'scale(1)' } },
      },
    },
  },
  plugins: [],
};
