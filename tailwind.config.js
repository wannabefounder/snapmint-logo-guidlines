/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6F00',
          orangeDark: '#E9661C',
          slate: '#151E29',
        },
        ink: '#1B1B1B',
        muted: '#787878',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Archivo', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderColor: {
        hair: 'rgba(16,24,40,0.08)',
      },
    },
  },
  plugins: [],
}
