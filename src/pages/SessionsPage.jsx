import { useState } from 'react';
import { Calendar, Video, Plus, Clock, Users, BookOpen } from 'lucide-react';
import './SessionsPage.css';

const DEFAULT_SESSIONS = [
  { 
    id: 1, 
    title: 'Midterm Prep & Academic Coaching', 
    counselor: 'Jane (Academic Advisor)', 
    date: 'Friday, April 18, 2026', 
    time: '2:00 PM - 3:00 PM', 
    platform: 'Google Meet',
    category: 'Academic',
    guests: ['👩‍💼', '👤', '👨‍🎓']
  },
  { 
    id: 2, 
    title: 'Stress Management Consultation', 
    counselor: 'Dr. Sarah Mark (Clinical Psychologist)', 
    date: 'Monday, April 21, 2026', 
    time: '12:00 PM - 1:00 PM', 
    platform: 'Zoom',
    category: 'Wellbeing',
    guests: ['👩‍⚕️', '👤']
  }
];

export default function SessionsPage({ onJoinMeeting }) {
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);
  const [activeTab, setActiveTab] = useState('meetings'); // meetings vs events
  const [showBookForm, setShowBookForm] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCounselor, setNewCounselor] = useState('Advisor Jane');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPlatform, setNewPlatform] = useState('Google Meet');
  const [newCategory, setNewCategory] = useState('Academic');

  const handleBookSession = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime) return;

    // Convert date string into friendly format
    const dateObj = new Date(newDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const friendlyDate = dateObj.toLocaleDateString('en-US', options);

    const newSession = {
      id: Date.now(),
      title: newTitle,
      counselor: newCounselor,
      date: friendlyDate,
      time: newTime,
      platform: newPlatform,
      category: newCategory,
      guests: ['👤']
    };

    setSessions(prev => [newSession, ...prev]);
    setShowBookForm(false);
    
    // Clear inputs
    setNewTitle('');
    setNewDate('');
    setNewTime('');
  };

  return (
    <div className="sessions-page">
      <header className="page-header">
        <h1 className="page-title">Counselor Sessions</h1>
        <p className="page-subtitle">Schedule individual counseling, academic planning, or join active meetings.</p>
      </header>

      {/* Tabs Row */}
      <div className="tab-control-row">
        <div className="tab-pills card">
          <button 
            className={`tab-btn ${activeTab === 'meetings' ? 'active' : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            Meetings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </div>

        <button className="book-btn-primary" onClick={() => setShowBookForm(!showBookForm)}>
          <Plus size={16} /> Book Session
        </button>
      </div>

      {/* Booking Form Card */}
      {showBookForm && (
        <form onSubmit={handleBookSession} className="book-session-form card">
          <h3>Schedule a Session</h3>
          <div className="booking-form-grid">
            <div className="input-group">
              <label>Session Reason / Topic</label>
              <input 
                type="text" 
                placeholder="e.g. Exam anxiety support, study plan guidance..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Select Counselor</label>
              <select value={newCounselor} onChange={(e) => setNewCounselor(e.target.value)}>
                <option value="Jane (Academic Advisor)">Advisor Jane (Academic Advisor)</option>
                <option value="Dr. Sarah Mark (Clinical Psychologist)">Dr. Sarah Mark (Psychologist)</option>
                <option value="Professor Miller (Career Counseling)">Professor Miller (Careers)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Date</label>
              <input 
                type="date" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Time Slot</label>
              <input 
                type="text" 
                placeholder="e.g. 2:00 PM - 3:00 PM"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Session Platform</label>
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="In-Person (Room 402)">In-Person (Room 402)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="Academic">Academic</option>
                <option value="Wellbeing">Wellbeing</option>
                <option value="Career">Career</option>
              </select>
            </div>
          </div>
          <div className="form-action-row">
            <button type="submit" className="submit-btn">Confirm Appointment</button>
            <button type="button" className="cancel-btn" onClick={() => setShowBookForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Grid of Sessions */}
      <div className="sessions-grid">
        {activeTab === 'meetings' ? (
          sessions.map((session) => (
            <div key={session.id} className="card session-card">
              <div className="session-card-header">
                <span className={`category-pill pill-${session.category.toLowerCase()}`}>
                  {session.category}
                </span>
                <span className="platform-tag">{session.platform}</span>
              </div>

              <div className="session-main">
                <h3 className="session-title">{session.title}</h3>
                <span className="session-instructor">{session.counselor}</span>
              </div>

              <div className="session-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{session.date}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{session.time}</span>
                </div>
              </div>

              <div className="session-footer">
                <div className="guest-avatars">
                  {session.guests.map((emoji, i) => (
                    <span key={i} className="guest-avatar" style={{ zIndex: 10 - i }}>{emoji}</span>
                  ))}
                  {session.guests.length > 2 && <span className="avatar-excess">+{session.guests.length - 2}</span>}
                </div>
                
                <button className="join-session-btn" onClick={onJoinMeeting}>
                  <Video size={16} /> Join Call
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-events card">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Academic Events Today</h3>
            <p>Check back later for support workshops or exam coaching sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
