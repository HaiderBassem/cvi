/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  // hover: styles only apply on devices that can really hover, so a tap on a phone doesn't leave
  // buttons and cards stuck in their hover look.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      screens: {
        // Phones turned sideways: wide enough for columns, far too short for a full-height scene.
        land: { raw: '(min-width: 640px) and (max-height: 520px)' },
        // Wide *and* tall enough for the layered full-height layouts.
        roomy: { raw: '(min-width: 640px) and (min-height: 521px)' },
      },
      colors: {
        basalt: {
          950: '#060608',
          900: '#0a0a0c',
          850: '#101014',
          800: '#141418',
          700: '#1c1c22',
          600: '#282832',
        },
        stone: {
          50: '#faf9f6',
          100: '#f5f3ef',
          200: '#eceae4',
          300: '#dedad0',
          400: '#b8b4a6',
        },
        skyblue: {
          DEFAULT: '#4cb8f5',
          light: '#8dd3fb',
          dark: '#1e90d6',
          glow: 'rgba(76, 184, 245, 0.25)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Labels used to be tiny monospace; they now use the readable sans (the class name is kept
        // so existing markup, including the admin, picks it up).
        mono: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        grotesk: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Nothing on the public site should be smaller than 13px.
        xs: ['0.8125rem', { lineHeight: '1.3rem' }],
      },
      letterSpacing: {
        widest: '0.2em',
        drafting: '0.12em',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'cinematic': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
}
