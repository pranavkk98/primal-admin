/** @type {import('tailwindcss').Config} */
const rgb = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: rgb('ink'),
          800: rgb('ink-800'),
          700: rgb('ink-700'),
          600: rgb('ink-600'),
        },
        bone: {
          DEFAULT: rgb('bone'),
          dim: rgb('bone-dim'),
          dark: rgb('bone-dark'),
        },
        amber: {
          DEFAULT: rgb('amber'),
          light: rgb('amber-light'),
          glow: rgb('amber-glow'),
          dark: rgb('amber-dark'),
        },
        forest: rgb('forest'),
        rust: rgb('rust'),
        red: {
          DEFAULT: '#EC1E27',
          dark: '#8B0F18',
          light: '#F3464F',
        },
        blue: {
          brand: '#2A419B',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        stencil: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        brand: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'fade-up': 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'gradient-x': 'gradientX 8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
