import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Lấy theme từ localStorage hoặc mặc định là light
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <div className={`app ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'drawer-open' : ''}`} id="app">
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      <div className="main">
        <TopBar 
          onOpenMobile={() => setIsMobileOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        
        <main className="content" id="content">
          <Outlet context={{ isDarkMode, toggleTheme, isCollapsed, toggleCollapse: () => setIsCollapsed(!isCollapsed) }} />
        </main>
      </div>

      <div className="modal-root" id="modalRoot"></div>
    </div>
  );
}
