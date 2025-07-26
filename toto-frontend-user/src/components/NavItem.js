// toto-frontend-user/src/components/NavItem.js
// کامپوننت آیتم ناوبری با طراحی مینیمال و حرفه‌ای

import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext'; // برای استفاده از تابع ترجمه

// این کامپوننت اکنون آیکون و کلید ترجمه را به عنوان پراپس می‌پذیرد.
// Icon: یک کامپوننت آیکون از کتابخانه‌ای مانند lucide-react
// textKey: کلید رشته‌ای برای ترجمه متن آیتم ناوبری
// to: مسیر ناوبری
// onClick: هندلر کلیک (برای بستن منوها در موبایل)
const NavItem = ({ icon: Icon, textKey, to, onClick }) => {
  const { t } = useLanguage(); // استفاده از تابع ترجمه

  return (
    <Link
      to={to}
      onClick={onClick}
      // استایل‌های Tailwind CSS برای ظاهر حرفه‌ای و واکنش‌گرا
      className="flex items-center px-4 py-2 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 ease-in-out font-medium text-base md:text-lg whitespace-nowrap"
    >
      {/* نمایش آیکون در صورت وجود */}
      {Icon && <Icon className="w-5 h-5 mr-3" />}
      {/* نمایش متن ترجمه شده */}
      {t(textKey)}
    </Link>
  );
};

export default NavItem;
