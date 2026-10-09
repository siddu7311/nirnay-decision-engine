import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BookOpen,
  Info,
  Scale,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/new',      label: 'New Decision', icon: PlusCircle },
  { to: '/history',  label: 'History',      icon: History },
  { to: '/how',      label: 'How It Works', icon: BookOpen },
  { to: '/about',    label: 'About',        icon: Info },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside
      className={`
        no-print flex flex-col shrink-0 bg-white border-r border-gray-200
        transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
        min-h-screen sticky top-0
      `}
      style={{ height: '100vh' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
          <Scale className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-[15px] font-bold text-gray-900 tracking-wide leading-none">NIRNAY</div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">Decision Engine</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-600' : ''}`} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            NIRNAY v1.0<br />
            Transparent Decision Engine
          </p>
        </div>
      )}
    </aside>
  );
};
