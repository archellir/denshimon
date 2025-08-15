/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': [
          'JetBrains Mono',
          'Fira Code', 
          'Source Code Pro',
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Consolas',
          'Courier New',
          'monospace'
        ],
      },
    },
  },
  plugins: [],
}