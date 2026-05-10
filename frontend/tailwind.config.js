/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        result: {
          cn:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
          mci: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
          ad:  { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
