/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile': '480px',
        'tablet': '768px',
      },
      fontFamily: {
        'poppins': ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        'inter': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colores principales del sistema
        'federal': {
          'purple': '#37003c',      // Violeta principal (15+ usos)
          'green': '#00ff87',       // Verde brillante (8+ usos)
          'pink': '#ff2882',        // Rosa/Magenta (6+ usos)
          'beige': '#ebe5eb',       // Beige claro (5+ usos)
          'black': '#0a0a0a',       // Negro profundo (3+ usos)
        },
        // Colores de acento
        'accent': {
          'purple': '#953bff',      // Púrpura (4+ usos)
          'cyan': '#02efff',        // Cian (4+ usos)
          'cyan-light': '#05f0ff',  // Cian claro (2+ usos)
        },
        // Colores RGB específicos
        'rgb': {
          'violet': 'rgb(55, 0, 60)',
          'success': 'rgb(0, 255, 135)',
          'cyan': 'rgb(2, 239, 255)',
          'pink': 'rgb(255, 40, 130)',
          'purple': 'rgb(150, 60, 255)',
          'light-gray': 'rgb(239, 239, 239)',
          'divider': 'rgb(20, 198, 236)',
        },
        // Colores RGBA para transparencias
        'rgba': {
          'white-75': 'rgba(255, 255, 255, 0.75)',
          'white-85': 'rgba(237, 237, 237, 0.85)',
          'black-50': 'rgba(0, 0, 0, 0.5)',
        }
      },
      backgroundImage: {
        // Gradientes principales
        'gradient-fpl': 'linear-gradient(to right, #ff2882, #37003c)',
        'gradient-fpl-reverse': 'linear-gradient(to right, #37003c, #ff2882)',
        'gradient-primary': 'linear-gradient(to right, #953bff, #02efff)',
        'gradient-success': 'linear-gradient(to right, rgb(0, 255, 135), rgb(2, 239, 255))',
        'gradient-danger': 'linear-gradient(to right, rgb(255, 40, 130), rgb(55, 0, 60))',
        'gradient-danger-reverse': 'linear-gradient(to left, rgb(255, 40, 130), rgb(55, 0, 60))',
        // Gradientes complejos
        'gradient-modal': 'linear-gradient(rgba(255, 255, 255, 0) 240px, white 360px), linear-gradient(to right, rgb(2, 239, 255), rgb(98, 123, 255))',
        'gradient-header': 'linear-gradient(to right, #953bff, #02efff)',
      },
    },
  },
  plugins: [],
}
