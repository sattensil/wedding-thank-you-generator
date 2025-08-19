/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          50: '#fdf7f0',
          100: '#faeee1',
          200: '#f4dac2',
          300: '#ecc199',
          400: '#e2a26e',
          500: '#d88a4f',
          600: '#ca7643',
          700: '#a85f39',
          800: '#874c35',
          900: '#6e3f2d',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e8e3',
          200: '#c7d2c7',
          300: '#a3b4a3',
          400: '#7a927a',
          500: '#5d755d',
          600: '#485d48',
          700: '#3a4b3a',
          800: '#2f3d2f',
          900: '#282f28',
        }
      },
      fontFamily: {
        'serif': ['Crimson Text', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

