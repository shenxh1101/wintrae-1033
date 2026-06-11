/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        accent: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        success: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        pulseDot: {
          '0%,80%,100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 50%, #1D4ED8 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(59,130,246,0.1) 0%, rgba(30,58,138,0.05) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'success-gradient': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(30, 58, 138, 0.12), 0 2px 8px -2px rgba(30, 58, 138, 0.08)',
        'card-hover': '0 12px 40px -8px rgba(30, 58, 138, 0.2), 0 6px 16px -4px rgba(30, 58, 138, 0.12)',
        'glow': '0 0 40px rgba(59, 130, 246, 0.25)',
      }
    },
  },
  plugins: [],
};
