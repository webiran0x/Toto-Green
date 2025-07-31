/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        // NEW: Add your custom font family here
        // این به شما اجازه می دهد از کلاس هایی مانند `font-iranyekan` استفاده کنید
        iranyekan: ['IRANYekanXVF', 'sans-serif'], // 'sans-serif' as a fallback
      },
      colors: {
        'clr-dark-a0': 'var(--clr-dark-a0)',
        'clr-light-a0': 'var(--clr-light-a0)',
        'clr-primary-a0': 'var(--clr-primary-a0)',
        'clr-primary-a10': 'var(--clr-primary-a10)',
        'clr-primary-a20': 'var(--clr-primary-a20)',
        'clr-primary-a30': 'var(--clr-primary-a30)',
        'clr-primary-a40': 'var(--clr-primary-a40)',
        'clr-primary-a50': 'var(--clr-primary-a50)',
        'clr-surface-a0': 'var(--clr-surface-a0)',
        'clr-surface-a10': 'var(--clr-surface-a10)',
        'clr-surface-a20': 'var(--clr-surface-a20)',
        'clr-surface-a30': 'var(--clr-surface-a30)',
        'clr-surface-a40': 'var(--clr-surface-a40)',
        'clr-surface-a50': 'var(--clr-surface-a50)',
        'clr-surface-tonal-a0': 'var(--clr-surface-tonal-a0)',
        'clr-surface-tonal-a10': 'var(--clr-surface-tonal-a10)',
        'clr-surface-tonal-a20': 'var(--clr-surface-tonal-a20)',
        'clr-surface-tonal-a30': 'var(--clr-surface-tonal-a30)',
        'clr-surface-tonal-a40': 'var(--clr-surface-tonal-a40)',
        'clr-surface-tonal-a50': 'var(--clr-surface-tonal-a50)',
      },
    },
  },
  plugins: [],
}