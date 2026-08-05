/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F5F1',
        ink: '#12181B',
        graphite: '#5B6660',
        flame: '#FF5A36',
        tealx: '#0E6E63',
        caution: '#9A6700',
        line: '#DCE1DA',
        paperRaised: '#FFFFFF',
        inkRaised: '#1B2226',
        graphiteDark: '#9AA3A0',
        flameDark: '#FF7A56',
        tealxDark: '#2FB39F',
        cautionDark: '#F4C95D',
        lineDark: '#2A3236',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
