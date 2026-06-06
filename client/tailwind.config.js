/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Domingo Porras — Design System (azul petróleo / navy)
        primary: {
          DEFAULT: '#1E6E92',   // --accent-green (azul petróleo)
          light: '#D6EAF3',     // --accent-green-light
          dark: '#46A6CC',      // dark mode variant
        },
        coral: {
          DEFAULT: '#D4654A',
          light: '#FDEAE4',
          dark: '#F2A65A',
        },
        sidebar: {
          DEFAULT: '#143042',
          hover: '#1F4255',
          dark: '#081720',
          'dark-hover': '#15303D',
        },
        // Semantic surface tokens (reference CSS vars for Tailwind utilities)
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        'bg-app': 'var(--bg-primary)',
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-secondary)',
        'text-faint': 'var(--text-tertiary)',
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(27,27,24,.04)',
        md: '0 4px 16px rgba(27,27,24,.07)',
        lg: '0 12px 32px rgba(27,27,24,.10)',
      },
    },
  },
  plugins: [],
}
