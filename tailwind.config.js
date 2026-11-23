/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          pink: '#ec4899',
          rose: '#f43f5e',
          purple: '#9333ea',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #ec4899, #f43f5e, #9333ea)',
        'brand-gradient-hover': 'linear-gradient(to right, #db2777, #e11d48, #7e22ce)',
        'stranger-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #18181b 100%)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
