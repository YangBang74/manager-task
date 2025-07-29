// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // Включает поддержку тёмной темы по классу "dark"
  theme: {
    extend: {
      colors: {
        // можешь тут расширить свои цвета
      },
    },
  },
  plugins: [],
}
