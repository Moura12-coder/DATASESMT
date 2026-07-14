'use client';

import React from 'react';
import { useLocation } from 'wouter';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    href: '/moura-dashboard',
  },
  {
    id: 'ghe',
    label: 'Gestão de GHE',
    icon: '🏭',
    href: '/moura-ghe-management',
  },
  {
    id: 'employees',
    label: 'Funcionários',
    icon: '👥',
    href: '/moura-employee-management',
  },
  {
    id: 'risks',
    label: 'Mapa de Riscos',
    icon: '🗺️',
    href: '/moura-risk-map',
  },
  {
    id: 'documents',
    label: 'Documentos SST',
    icon: '📄',
    href: '/moura-documents',
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: '📈',
    href: '/moura-reports',
  },
];

export default function MouraSidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-lg fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center font-bold text-blue-900">
            MT
          </div>
          <div>
            <h1 className="font-bold text-lg">Moura</h1>
            <p className="text-xs text-blue-300">Technology</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-blue-100 hover:bg-blue-700'
              }`}
              onClick={(e) => {
                if (item.href === '#') {
                  e.preventDefault();
                }
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-700">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-700">
          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-blue-900">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Usuário Admin</p>
            <p className="text-xs text-blue-300 truncate">admin@moura.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
