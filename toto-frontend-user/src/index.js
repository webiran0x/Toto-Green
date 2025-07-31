import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // استایل‌های Tailwind CSS شما
import App from './App';
import reportWebVitals from './reportWebVitals';

// 1. ایمپورت کردن ThemeProvider و createTheme از Material-UI
import { ThemeProvider, createTheme } from '@mui/material/styles';
// 2. (اختیاری) ایمپورت CssBaseline برای ریست کردن استایل‌ها
import CssBaseline from '@mui/material/CssBaseline';

// 3. تعریف یک تم Material-UI سفارشی
// این تم می تواند شامل رنگ ها، تایپوگرافی، و سایر تنظیمات باشد
// می توانید این قسمت را برای هماهنگی با طراحی Tailwind خود شخصی سازی کنید
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // رنگ اصلی Material-UI (مثلاً آبی)
      // می توانید رنگ های دیگر را بر اساس پالت Tailwind خود تنظیم کنید
    },
    secondary: {
      main: '#dc004e', // رنگ ثانویه (مثلاً قرمز)
    },
    // ... سایر تنظیمات پالت
  },
  typography: {
    fontFamily: [
      'IRANYekanXVF', // فونت پیش‌فرض Material-UI
      'Roboto', // فونت فارسی شما (اطمینان حاصل کنید که این فونت در CSS یا index.html لود شده باشد)
      'Arial',
      'sans-serif',
    ].join(','),
    // ... سایر تنظیمات تایپوگرافی
  },
  // می توانید breakpoints, components, spacing و ... را نیز شخصی سازی کنید
  // برای مثال، می توانید تنظیمات کامپوننت ها را برای هماهنگی با Tailwind انجام دهید:
  // components: {
  //   MuiButton: {
  //     styleOverrides: {
  //       root: {
  //         // این می تواند استایل های Tailwind را override کند یا با آن ترکیب شود
  //         // مثلاً می توانید border-radius یا padding را اینجا تنظیم کنید
  //       },
  //     },
  //   },
  // },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 4. اعمال ThemeProvider به کل اپلیکیشن */}
    <ThemeProvider theme={theme}>
      {/* 5. (اختیاری) CssBaseline برای نرمال سازی استایل ها */}
      {/* توجه: استفاده از CssBaseline می تواند با استایل های Tailwind تداخل داشته باشد.
          اگر تداخل دیدید، می توانید آن را حذف کنید و به Tailwind بسنده کنید. */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();