/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        'inter': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        'fpl-primary': '#37003c',
        'fpl-secondary': '#ff2882',
        'fpl-accent': '#00ff87',
      },
      backgroundImage: {
        'gradient-fpl': 'linear-gradient(to right, #ff2882, #37003c)',
        'gradient-fpl-reverse': 'linear-gradient(to right, #37003c, #ff2882)',
      },
    },
  },
  plugins: [],
}
