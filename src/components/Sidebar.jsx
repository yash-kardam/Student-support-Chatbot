import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Home, 
  MessageSquarePlus, 
  CheckSquare, 
  Video, 
  FileText, 
  Share2, 
  MoreHorizontal,
  ChevronLeft,
  Phone,
  Settings,
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'chat', icon: MessageSquarePlus, label: 'Support Chat' },
  { id: 'tasks', icon: CheckSquare, label: 'My Action Plan' },
  { id: 'sessions', icon: Video, label: 'Counselor Sessions' },
  { id: 'resources', icon: FileText, label: 'Saved Resources' },
];

export default function Sidebar({ currentView, onNavigate, user, chatSessions, activeSessionId, setActiveSessionId }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Trigger crisis counselor chat
  const handleUrgentHelp = () => {
    if (onNavigate) {
      onNavigate('chat');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';

  return (
    <aside className="stratify-sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="avatar-small">
            <span className="user-face">👤</span>
            <span className="online-indicator"></span>
          </div>
          <div className="user-meta">
            <span className="user-name">{userName}</span>
            <span className="user-role">Student</span>
          </div>
        </div>
      </div>

      <div className="sidebar-scrollable">
        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === currentView;
            return (
              <button 
                key={item.id} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'chat') {
                    setActiveSessionId(null);
                  }
                  onNavigate(item.id);
                }}
              >
                <span className="nav-label">{item.label}</span>
                <item.icon size={18} className="nav-icon" />
              </button>
            );
          })}
        </nav>

        <div className="history-section">
          <h4 className="history-title">Recent Chats</h4>
          <ul className="history-list">
            {chatSessions?.map((session) => (
              <li 
                key={session.id} 
                className={`history-item ${activeSessionId === session.id && currentView === 'chat' ? 'active-history' : ''}`} 
                onClick={() => {
                  setActiveSessionId(session.id);
                  onNavigate('chat');
                }}
              >
                {session.title || 'New Session'}
              </li>
            ))}
            {(!chatSessions || chatSessions.length === 0) && (
              <li className="history-item empty">No recent chats</li>
            )}
          </ul>
        </div>
      </div>

      <div className="sidebar-footer">
        {/* Urgent Counseling Hotline Card */}
        <div className="emergency-card">
          <div className="emergency-header">
            <div className="pulse-dot"></div>
            <span>Need Urgent Help?</span>
          </div>
          <p className="emergency-text">Chat immediately with an emergency crisis counselor.</p>
          <button className="upgrade-btn" onClick={handleUrgentHelp}>
            <Phone size={14} className="phone-icon" />
            Contact Now
          </button>
        </div>
        
        <button className="settings-row" onClick={handleLogout} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="settings-label" style={{ color: 'var(--text-main)' }}>Log Out</span>
          <div className="more-btn" style={{ pointerEvents: 'none' }}>
            <LogOut size={18} />
          </div>
        </button>
      </div>
    </aside>
  );
}
