/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#e0eaff',
          500: '#5b6cff',
          600: '#4854f0',
          700: '#3a44c2',
        },
      },
    },
  },
  plugins: [],
};
