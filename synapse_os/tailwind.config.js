/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#A78BFA',
        },
        secondary: {
          DEFAULT: '#22D3EE',
          dark: '#0891B2',
          light: '#67E8F9',
        },
        dark: {
          bg: '#0F172A', // Slate 900 base
          card: '#1E293B', // Slate 800
          border: '#334155', // Slate 700
        },
        status: {
            approved: '#10B981', // Emerald 500
            pending: '#F59E0B', // Amber 500
            revision: '#F97316', // Orange 500
            rejected: '#EF4444', // Red 500
            emerging: '#06B6D4', // Cyan 500
            trending: '#8B5CF6', // Violet 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
