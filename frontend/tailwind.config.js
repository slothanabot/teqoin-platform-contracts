/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF2D78', // Flaunch hot pink/magenta
        background: '#0B0B0F', // Dark aesthetic mobile-first
        cardBg: '#12121A',
        cardBorder: '#1F1F2E',
      },
    },
  },
  plugins: [],
};
