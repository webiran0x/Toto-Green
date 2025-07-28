import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext'; // ایمپورت LanguageProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider> {/* App را با LanguageProvider می‌پوشانیم */}
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
