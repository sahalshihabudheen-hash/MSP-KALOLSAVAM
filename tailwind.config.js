/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#e2e8f0',    /* Light — readable on dark bg */
        'brand-secondary': '#94a3b8',
        'brand-accent': '#38bdf8',     /* Bright sky-blue — pops on dark */
        'bg-main': '#07101f',
        'text-main': '#e2e8f0',
        'text-muted': '#94a3b8',
        /* Cinematic palette */
        'cin-bg':    '#07101f',
        'cin-card':  'rgba(13,24,50,0.75)',
        'cin-border':'rgba(255,255,255,0.10)',
      },
      fontFamily: {
        malayalam: ['"Baloo Chettan 2"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      },
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        }
      },
      animation: {
        'gradient': 'gradient 3s linear infinite',
      }
    },
  },
  plugins: [],
}
