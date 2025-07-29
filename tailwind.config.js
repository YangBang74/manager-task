/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // Поддержка тёмной темы через класс "dark"
  theme: {
    extend: {
      colors: {
        // Определяем кастомные цвета для светлой и тёмной тем
        background: {
          DEFAULT: '#ffffff', // Светлый фон
          dark: '#1f2937', // Тёмный фон
        },
        text: {
          DEFAULT: '#1f2937', // Тёмный текст
          dark: '#ffffff', // Светлый текст для тёмной темы
        },
        primary: {
          DEFAULT: '#3b82f6', // Основной цвет
          dark: '#60a5fa', // Основной цвет для тёмной темы
        },
      },
    },
  },
  plugins: [],
}