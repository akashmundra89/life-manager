/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#3b6dff',
          600: '#2e58e0',
          700: '#1e3fb8',
        },
      },
    },
  },
  plugins: [],
};
