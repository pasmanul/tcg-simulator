/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './index.html', './hand.html', './deck.html'],
  theme: {
    extend: {
      colors: {
        bg:             'var(--bg)',
        bg2:            'var(--bg2)',
        surface:        'var(--surface)',
        surface2:       'var(--surface2)',
        primary:        'var(--purple)',
        'primary-lite': 'var(--purple-lite)',
        accent:         'var(--cyan)',
        danger:         'var(--pink)',
        'text-base':    'var(--text)',
        muted:          'var(--muted)',
        border:         'var(--border)',
      },
      fontFamily: {
        mono: ["'Press Start 2P'", 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
    },
  },
  plugins: [],
}
