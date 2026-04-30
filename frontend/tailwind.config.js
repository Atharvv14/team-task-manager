/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        ink: {
          950: '#0A0A0F',
          900: '#111118',
          800: '#1A1A26',
          700: '#252535',
          600: '#333348',
          500: '#4A4A68',
        },
        accent: {
          DEFAULT: '#7C6EFA',
          hover:   '#9589FB',
          dim:     '#3D3580',
          glow:    'rgba(124,110,250,0.25)'
        },
        jade:  { DEFAULT: '#2DD4A0', dim: '#1a7a5e' },
        amber: { DEFAULT: '#F59E0B', dim: '#92600a' },
        rose:  { DEFAULT: '#F87171', dim: '#8b2e2e' },
        sky:   { DEFAULT: '#38BDF8', dim: '#1a5c7a' }
      },
      boxShadow: {
        'glow-accent': '0 0 24px rgba(124,110,250,0.35)',
        'glow-jade':   '0 0 16px rgba(45,212,160,0.3)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'grid': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40V0M40 0v40' stroke='rgba(124,110,250,0.06)' stroke-width='1'/%3E%3C/svg%3E\")"
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } }
      }
    }
  },
  plugins: []
}
