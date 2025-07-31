// toto-landing/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // NEW: ایمپورت BrowserRouter
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { LanguageProvider } from './contexts/LanguageContext'; // NEW: ایمپورت LanguageProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* NEW: کامپوننت App را داخل Router قرار می‌دهیم */}
      <LanguageProvider> {/* NEW: App را داخل LanguageProvider قرار می‌دهیم */}
        <App />
      </LanguageProvider>
    </Router>
  </React.StrictMode>
);

reportWebVitals();