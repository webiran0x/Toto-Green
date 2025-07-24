//toto-frontend-user/src/components/NavItem.js

import React from 'react';
import { Link } from 'react-router-dom'; // <--- Link از react-router-dom

const NavItem = ({ children, to, onClick }) => {
  return (
    <Link
      to={to} // <--- استفاده از 'to' به جای 'href' برای Link
      onClick={onClick}
      className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
    >
      {children}
    </Link>
  );
};

export default NavItem;
