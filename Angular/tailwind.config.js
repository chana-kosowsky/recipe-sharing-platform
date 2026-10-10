/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // פלטה חמה - לוהט/אמבר על רקע קרם
      colors: {
        brand: {
          50:  '#fef7ed',
          100: '#fdedd5',
          200: '#fbd7aa',
          300: '#f8b974',
          400: '#f5923c',
          500: '#f17518',
          600: '#e2590e',
          700: '#bb420f',
          800: '#953514',
          900: '#782e14',
        },
        cream: {
          50:  '#fdfbf7',
          100: '#faf5ec',
          200: '#f3e8d3',
        },
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 15px 35px rgba(0, 0, 0, 0.06)',
        warm: '0 10px 30px rgba(241, 117, 24, 0.15)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
