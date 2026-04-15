/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base:     '#0f172a',
        surface:  '#1a1f2e',
        elevated: '#1e293b',
      },
      animation: {
        'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
        'fade-in':         'fade-in 0.25s ease-out',
        'slide-in-right':  'slide-in-right 0.3s ease-out',
        'bar-fill':        'bar-fill 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.55' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'bar-fill': {
          from: { width: '0%' },
          to:   { width: 'var(--bar-w)' },
        },
      },
      boxShadow: {
        'card':    '0 10px 24px -4px rgba(0,0,0,0.4)',
        'glow-green': '0 0 18px rgba(16,185,129,0.25)',
        'glow-red':   '0 0 18px rgba(239,68,68,0.2)',
        'glow-blue':  '0 0 18px rgba(59,130,246,0.25)',
      },
    },
  },
  plugins: [],
}
