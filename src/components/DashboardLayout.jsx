import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import './DashboardLayout.css';

export default function DashboardLayout({ children, currentView, onNavigate, user, chatSessions, activeSessionId, setActiveSessionId }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when view changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView]);

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-logo-icon">N</div>
        <span className="mobile-header-title">NERO Support</span>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
          <X size={20} />
        </button>
        <Sidebar 
          currentView={currentView} 
          onNavigate={onNavigate} 
          user={user}
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
        />
      </div>

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
