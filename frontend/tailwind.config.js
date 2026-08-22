/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          blue: {
            light: '#00baf2',
            DEFAULT: '#002e6e',
            dark: '#001c48',
          },
          cyan: '#00baf2',
          orange: '#ff9900',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
