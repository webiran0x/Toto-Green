/** @type {import('tailwindcss').Config} */
export default { // اگر با Vite ساختید، از 'export default' استفاده کنید
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // اگر از فونت خاصی استفاده می‌کنید
      },
    },
  },
  plugins: [],
}