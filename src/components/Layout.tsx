import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top header bar */}
        <header className="no-print sticky top-0 z-20 flex items-center justify-end px-4 h-11
          bg-white/90 dark:bg-gray-900/90 backdrop-blur
          border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              border border-gray-200 dark:border-gray-700
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
            "
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
