/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dnk-primary': '#56dd76',    /* Base Green */
        'dnk-primary-light': '#7ae596', /* Light Green */
        'dnk-primary-dark': '#45b15f',  /* Dark Green */
        'dnk-secondary': '#2B2B2B',  /* Dark Carbon */
        'dnk-accent': '#3dbb5a',     /* Accent Green */
        'dnk-glow': '#00FFD0',       /* Neon Teal - keeping this for contrast */
        'dnk-surface': '#1A1A1A',    /* App Dark BG */
        'text-light': '#FFFFFF',
        'text-muted': '#C0C0C0',
      },
      fontFamily: {
        header: ['"Press Start 2P"', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 