/** @type {import('tailwindcss').Config} */
module.exports = {
  // فعال کردن حالت دارک با کلاس
  darkMode: 'class',

  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        iranyekan: ['IRANYekanXVF', 'sans-serif'],
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
  // NEW: فعال کردن variant: 'dir' (این به طور ضمنی در Tailwind v3 وجود دارد و نیازی به اضافه کردن صریح آن به variants نیست،
  // اما برای وضوح می‌توان اطمینان حاصل کرد که 'dir' در لیست `variants` یا `plugins` فعال است یا از طریق JIT mode پشتیبانی می‌شود.)
  // اگر از TailwindCSS 3.x استفاده می‌کنید، اکثر این موارد به صورت پیش‌فرض با قابلیت JIT فعال هستند.
  // در غیر این صورت، می توانید از یک پلاگین مانند tailwindcss-rtl استفاده کنید.
  // برای سادگی، فرض می کنیم JIT به طور خودکار dir را مدیریت می کند.
  // اگر نیاز به کنترل دقیق‌تر دارید، می‌توانید از لایه‌های CSS (base, components, utilities) برای تعریف قوانین RTL استفاده کنید.
  plugins: [], // نیازی به افزودن explicit 'dir' به پلاگین نیست اگر از Tailwind v3 استفاده می‌کنید و JIT فعال است.
}