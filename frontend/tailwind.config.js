/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mapped to CSS variables — auto-switch on .dark class
        th: {
          bg:       'var(--th-bg)',
          sidebar:  'var(--th-sidebar)',
          border:   'var(--th-border)',
          hover:    'var(--th-hover)',
          text:     'var(--th-text)',
          muted:    'var(--th-muted)',
          accent:   'var(--th-accent)',
          accentH:  'var(--th-accent-h)',
          danger:   'var(--th-danger)',
          card:     'var(--th-card)',
          input:    'var(--th-input)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'soft':  '0 1px 4px rgba(0,0,0,.08)',
        'card':  '0 4px 16px rgba(0,0,0,.12)',
        'modal': '0 8px 32px rgba(0,0,0,.18)',
      },
    },
  },
  plugins: [],
}
